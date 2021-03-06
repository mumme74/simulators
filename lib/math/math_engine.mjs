"use strict";

import { ActionBase, AstTreeNode, GrammarParser, Parser, SyntaxTreeNode } from "../parser/parser.mjs";
import { SolveTreeNode, SolveChange, SolveVisitArgs } from "./math_solutions.mjs";
import { initMathRules } from "./math_rule_base.mjs";
import { ValueBase, Fraction, Variable, Integer } from "./math_values.mjs";

import "./tr_math.mjs";
import "./math_rule_fractions.mjs";
import "./math_rule_constants.mjs";
import "./math_rule_algebraic.mjs";
import "./math_rule_equation.mjs";
import "./math_rule_inequality.mjs";

// Order of precedence, rules are applied in this order
export const precedence = {
  Parenthesization: 0,
  Factorial:        1,
  Exponentiation:   2,
  MulAndDiv:        3,
  AddAndSub:        4,
  TidyUp:           5, // simplify fractions, '--' -> '+' etc
}
/*
1. Parenthesization,
2. Factorial, (currently unsupported)
3. Exponentiation,
4. Multiplication and division,
5. Addition and subtraction.
*/

// grammar for a eqation or a algebra
export const mathExprGrm =
`start      = inequality | equationSystem | equation | expression;
 inequality = expression , {ineqoper, expression};
 equationSystem = '{', '@', equation, { '@', equation };
 equation   = expression, eq, expression;
 expression = term;

 group       = '(', { expression }, ')';

 term        = factor, [{('+'|'-'), factor}];
 factor      = base, [{(mul|div), base}];

 base        = root | exponent | molecule; (* base bypassed in AST *)
 root        = [(float | integer)],'√', (exponent | molecule);
 exponent    = molecule, '^', (exponent | root | molecule);
 molecule  = signed | unsigned;             (* molecule bypassed in AST *)
 signed    = ('-'|'+') , (implmul | variable | fraction | float | integer | group);
 unsigned  = implmul | variable | fraction | float | integer | group; (* unsigned bypassed in AST *)
 implmul   = variable, ({group}|{variable})
           | (fraction | float | integer), {group}
           | variable, {group}
           | group, {group | variable};

 integer   = {digit};
 variable  = [varCoef], letter, [(varExp | varCoef)];

 varCoef   = fraction | float | integer;
 varExp    = '^', molecule;

 float     = wholenum, decpoint, fracnum;
 wholenum  = {digit};
 fracnum   = {digit};
 decpoint  = ','|'.';

 fraction    = 'frac', '{', numerator, '/', denominator, '}';
 numerator   = (integer|variable), [{variable}];
 denominator = (integer|variable), [{variable}];

 ineqoper  = neq | lt | gt | lteq | gteq; (* ineqoper bypassed in AST *)
 eq        = '=';
 neq       = "≠"|"!=";
 lt        = '<';
 gt        = '>';
 lteq      = "≤"|"<=";
 gteq      = "≥"|">=";
 mul       = "•"|"*";
 div       = "÷"|"/";
 letter    = "a"|"b"|"c"|"d"|"e"|"f"|"g"|"h"|"i"|"j"|"k"|"l"|"m"|"n"
           | "o"|"p"|"q"|"r"|"s"|"t"|"u"|"v"|"w"|"x"|"y"|"z"
           | "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"
           | "O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z"
           | "Α"|"Β"|"Γ"|"Δ"|"Ε"|"Ζ"|"Η"|"Θ"|"Ι"|"Κ"|"Λ"|"Μ"|"Ν"|"Ξ"
           | "Ο"|"Π"|"Ρ"|"Σ"|"Τ"|"Υ"|"Φ"|"Χ"|"Ψ"|"Ω"
           | "α"|"β"|"γ"|"δ"|"ε"|"ζ"|"η"|"θ"|"ι"|"κ"|"λ"|"μ"|"ν"|"ξ"
           | "ο"|"π"|"ρ"|"σ"|"ς"|"τ"|"υ"|"φ"|"χ"|"ψ"|"ω" ;
 digit     = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";





`;

const operOpposites = {
  add: 'sub', sub:'add',mul:'div',div:'mul'
}

// work around EEE754 floating point rounding error
export function fpRound(jsNumber) {
  return +jsNumber.toPrecision(15);
}

// ---------------------------------------------------

class DefaultAction extends ActionBase {
  result = null;
  visit(engine) {
    return super.visit(engine);
  }
}

class BinaryOpAction extends DefaultAction {
  visit(engine) {// eslint-disable-line no-unused-vars
    const left = this.astNode.left.action.visit(engine),
          right = this.astNode.right.action.visit(engine);
    return this.operator(left, right);
  }
}

class UnaryOpAction extends DefaultAction {
  visit(engine) {// eslint-disable-line no-unused-vars
    const value = this.astNode.left.action.visit(engine);
    return this.operator(value);
  }
}

class ValueAction extends DefaultAction {
  constructor(parser, astNode, valueObj) {
    super(parser, astNode);
    this.valueObj = valueObj;
  }
  visit(engine) { // eslint-disable-line no-unused-vars
    return this.valueObj;
  }
}

// ---------------------------------------------------

const grmParser = new GrammarParser(mathExprGrm, 'start');
grmParser.checkGrammar();

export class MathEngine {
  static allMathRules = []; // all implemented plugins

  constructor(source, includeRules = [], excludeRules = [], traceRules = false) {
    this.varValues = {};
    this.isAlgebraic = false; // has variables in it, sets during parse phase
    this.exponents = []; // contains all exponents in expr x^2 and 2^4, sets during parse phase

    this._traceRules = !traceRules ? ()=>{} :
      typeof traceRules === 'function' ? traceRules :
        (preamble, node, rule)=>{
          console.log(`${preamble} rule '${rule.name}'` +
            `operated on node '${node.type}'`+
            ` with depth: ${node.depth}`);
        }

    // custom mathrules
    this.mathRules = includeRules.length ?
      includeRules.map(name=>MathEngine.allMathRules.name===name) :
        MathEngine.allMathRules;
    if (excludeRules.length)
      this.mathRules = this.mathRules.filter(
        r=>excludeRules.indexOf(r.name) < 0);
    // group them in precedences
    this.mathRules = this.mathRules.reduce((arr, r)=>{
      arr[r.precedence].push(r);
      return arr;
    }, Object.keys(precedence).map(p=>[]));
    Object.freeze(this.mathRules);

    // parse source
    this.parser = new Parser({
      grmParser, source,
      defaultAction: DefaultAction,
      flattenRules:['integer', 'whole','fracnum'],
      dropTerminalsAllRules:[
        ',','.','(',')','*','/','+','-','•','÷','^','√'],
      dropTerminalsOnRules:{fraction:['frac','{','}']},
      bypassRules:[
        'molecule','base','ineqoper','unsigned'],
      generateFuncs:this._generateFuncs()
    });

    const rootAst = this.parser.prgAstRoot;
    //console.log(rootAst.asJson());

    if (rootAst?.left) {
      this.solveTreeRoot = this.cloneTree(
        rootAst.left, 0, null, null);
    }
  }

  runRulesOnNode(solveNode, precedence, args) {
    let res = false;
    for(const rule of this.mathRules[precedence]) {
      if (args.changes.length &&
          args.changes[0].resultNode?.depth !== solveNode.depth)
        return res;
      if (rule.appliesToTypes.indexOf(solveNode.type) > -1) {
        this._traceRules("trying", solveNode, rule);
        if(rule.run(solveNode, args)) {
          res = true;
          this._traceRules("  +accepted", solveNode, rule);
        } else {
          this._traceRules("  -rejected", solveNode, rule);
        }
      }
    }
    return res;
  }

  // tries to solve tree, one step at a time
  solveNextStep() {
    console.log(this.solveTreeRoot.asJson());
    const changes = [];
    const args = new SolveVisitArgs(this, changes)
    if (this.solveTreeRoot) {
      for (const prec of Object.values(precedence)) {
        if (changes.length)
          break;
        this.solveTreeRoot.runStep(args, prec);
      }
    }
    args.tree = this.solveTreeRoot;
    return args;
  }

  solveSteps() {
    const steps = [];
    while(this.solveNextStep().length > 0) {
      steps.push(...this.solveInfo.changes);
    }
    return steps;
  }

  evaluate(varValues) {
    if (varValues)
      this.varValues = varValues;
    if (this.parser.prgAstRoot) {
      let res = this.parser.prgAstRoot.action.visit(this);
      if (res.type==='fraction')
        res = res.shrinkTo();
      return res.printable();
    }
    return NaN;
  }

  static childrenOf(parent, types = []) {
    const nodes = [];
    const walk = (node)=>{
      if (!node || (node.type === 'expression' &&
                    node.parent.type !== 'start'))
      {
        return;
      }
      walk(node.left);
      walk(node.right);
      if (!types.length || types.indexOf(node.type) > -1)
        nodes.push(node);
    }
    walk(parent);

    return nodes;
  }

  // a solveTree is a more flat copy of the AST
  cloneTree(node, depth, expression, equation) {
    if (!depth) depth = node?.depth || 0;
    if (!expression) expression = node?.expression;
    if (!equation) equation = node?.equation;

    const valueObj = node?.action?.valueObj?.clone() ||
      (node.value instanceof ValueBase ? node.value?.clone() : undefined);
    if (valueObj instanceof Variable)
      expression.isAlgebraic = true;

    const solveNode = new SolveTreeNode(
      node, null, valueObj, depth,
      expression, equation);

    switch (node?.type) {
    case 'equation': equation = solveNode; break;
    case 'expression':
      if (expression) { // when we have a (...) expression
        expression.subExpressions.push(solveNode);
      }
      expression = solveNode;
      expression.subExpressions = [];
      break;
    }

    if (node?.left) {
      // 1*2*3 same depth, 2a*3a -> 2*a*3*a not same depth
      const depth2 = depth + +!this._isLeftAtSameDepth(node);
      solveNode.addLeft(
        this.cloneTree(node.left,
          depth2, expression, equation));
    }
    if (node?.right) {
      solveNode.addRight(
        this.cloneTree(node.right,
          depth+1, expression, equation));
    }

    if (!solveNode.parent)
      solveNode.parent = node.parent;

    return solveNode;
  }

  static scanAlgebraicTerm(rootNode) {
    let maxDepth = rootNode.depth+1;
    const obj = {coef:null, vars:[], signedNode:null, rootNode};
    const walk = (node)=>{
      if (!node || node.depth > maxDepth) return null;
      if (node.type === 'signed') {
         obj.signedNode = node;
         node = node.left;
         maxDepth++;
      }
      if (['integer','float','fraction'].indexOf(node.type) > -1) {
        if (obj.coef) return false;
        obj.coef = node;
        return true;
      } else if (node.type === 'variable') {
        obj.vars.push({
          name: node instanceof SolveTreeNode ?
            node.value.value() : node.value,
          node, exp:1});
        maxDepth++;
        return true;
      } else if (node.type === 'exp') {
        if (node.parent.left.type !== 'variable') return false;
        const varNode =
          obj.vars.find(v=>v.name === node.left.value.value()) ||
            {name: node.left.value.value(), node: node.left, exp:1};
        const exp = node.right.value?.value();
        if (Number.isNaN(exp)) return false; // unsupported x^y
        varNode.exp *= exp;
      } else {
        if (walk(node.left) === false) return false;
        if (walk(node.right) === false) return false;
      }
      if (node.type === 'mul')
        return true;
      return false;
    }
    if (['mul','variable','signed'].indexOf(rootNode.type) < 0)
      return false;
    if (walk(rootNode) === false)
      return false;
    if (obj.vars.length < 1)
      return false;
    return obj;
  }

  _isLeftAtSameDepth(node) {
    if (node.type === 'mul' && node.left.type === 'mul')
    {
      // specialcase 2ab from 2*3
      // 2*a*b -> 2ab, 2*a*3 -> 2a*3, 4*5a*
      const algebraTerm = MathEngine.scanAlgebraicTerm(node.left);
      if (algebraTerm)
        return false;
      // else treat normaly
    }

    return !(
      operOpposites[node.type] !== node.left.type &&
      node.type !== node.left.type);
  }

  _generateFuncs() {
    const funcs = {
      term:this._createBinaryNode, factor:this._createFactorNode,
      root:this._createRootNode, exponent:this._createBinaryNode,
      float:this._createValueNode, integer:this._createValueNode,
      fraction: this._createFractionNode,
      variable:this._createVariableNode, signed: this._createSignedNode,
      implmul:this._createImplMul, group: this._createGroupNode,
      equation:this._createCompareNode,
      ineqauality: this._createCompareNode,
    };
    for(const key of Object.keys(funcs))
      funcs[key] = funcs[key].bind(this);

    return funcs;
  }

  // place ast as the new operator, o.node.right becomes a linked list
  // with the rightmost thing to do first
  _placeOper(o, ast) {
    if (!o.root) o.root = ast;
    if (!o.node) o.node = ast;
    else {
      if (o.node.parent)
        o.node.parent.replaceChild(ast, o.node);
      ast.addLeft(o.node);
      o.node = ast;
    }
  }

  // place node on ast, left to right
  _placeChild(o, ast) {
    if (!o.node.left) o.node.addLeft(ast);
    else if (!o.node.right) o.node.addRight(ast);
  }

  // 1 + 2 or 1 - 2 or 1^2
  _createBinaryNode(cst, parser) {
    const o = {root:null, node:null};
    let left = parser.generateNode(cst.children[0]);

    // it might be a node with only left, aka a node we can bypass
    if (cst.children.length < 2)
      return left;


    for(let i = 2; i < cst.children.length; i += 2) {
      const right = parser.generateNode(cst.children[i], parser),
            midCh = cst.children[i-1].tokString(),
            action = new BinaryOpAction(parser, null);
      if (midCh === '^') {
        action.operator = this.exp;
        if (!this.exponents.find(e=>e.action.valueObj?.value()===right))
          this.exponents.push(right);
      } else
        action.operator = midCh  === '+' ? this.add : this.sub;
      const nodeVlu = midCh === '+' ? 'add' :
        midCh === '^' ? 'exp' : 'sub'
      const ast = new AstTreeNode(cst, action, nodeVlu, midCh);
      this._placeOper(o, ast);
      if (left) this._placeChild(o, left);
      //this._placeChild(o, right);
      ast.addRight(right);
      left = null;
    }
    return o.node;
  }

  // 1 * 2 or 1 / 2
  _createFactorNode(cst, parser) {
    const o = {root:null, node:null};
    let left = parser.generateNode(cst.children[0]);

    // it might be a node with only left, aka a node we can bypass
    if (cst.children.length < 2)
      return left;

    for(let i = 2; i < cst.children.length; i += 2) {
      const right = parser.generateNode(cst.children[i]),
            isMul = cst.children[i-1].type === 'mul',
            action = new BinaryOpAction(parser,null);
      action.operator = isMul ? this.mul : this.div;
      const nodeVlu = isMul ? 'mul' : 'div',
            ast = new AstTreeNode(
        cst, action, nodeVlu, cst.children[i].tokString());
      this._placeOper(o, ast);
      if (left) this._placeChild(o, left);
      this._placeChild(o, right);
      left = null;
    }
    return o.node;
  }

  // 2a or 3(1-2)
  _createImplMul(cst, parser) {
    const o = {root:null, node:null};
    let left = parser.generateNode(cst.children[0]);

    for(let i = 1; i < cst.children.length; i += 1) {
      const right = parser.generateNode(cst.children[i]),
            action = new BinaryOpAction(parser,null);
      action.operator = this.mul;
      const ast = new AstTreeNode(
        cst, action, 'mul', 'implicit *');

      this._placeOper(o, ast);
      if (left) this._placeChild(o, left);
      this._placeChild(o, right);
      left = null;
    }
    return o.node;
  }

  // √2 or 3√2
  _createRootNode(cst, parser) {
    const o = {root: null, node: null};
    for(let i = 0; i < cst.children.length; i += 3) {
      const isNthRoot = cst.children[i].type !== 'terminal', // √2 or 3√2
            actionCls = isNthRoot ? BinaryOpAction : UnaryOpAction,
            action = new actionCls(parser, null);
      action.operator = isNthRoot ? this.nthRoot : this.root;
      const nodeVlu = isNthRoot ? 'nthRoot' : 'root',
            ast = new AstTreeNode(
              cst, action, nodeVlu, cst.children[i+isNthRoot].tok.str);
      this._placeOper(o, ast);
      if (isNthRoot) {
        this._placeChild(o, parser.generateNode(cst.children[i]));
        this._placeChild(o, parser.generateNode(cst.children[i+2]));
      } else
        this._placeChild(o, parser.generateNode(cst.children[i+1]));
    }
    return o.node;
  }

  // a terminal node
  _createValueNode(cst, parser) {
    if (cst.type === 'variable')
      this.isAlgebraic = true;
    const action = new ValueAction(parser, null, ValueBase.create(cst));
    return new AstTreeNode(cst, action, cst.type, cst.tokString());
  }

  // a variable node
  _createVariableNode(cst, parser) {
    let chIdx = 0, variable, coeficient, exponent, value;

    if (cst.children[chIdx].type === 'varCoef') {
      coeficient = ValueBase.create(cst.children[chIdx].children[0]);
      chIdx += 1;
    }
    if (cst.children[chIdx+1]?.type === 'varExp') {
      const molecule = cst.children[chIdx+1].children[1];
      if (molecule.children[0].type === 'signed') {
        const sign = molecule.children[0].children[0].tokString();
        exponent = ValueBase.create(molecule.children[0].children[1]);
        if (sign === '-') exponent *= -1;
      } else {
        exponent = ValueBase.create(molecule.children[0].children[0]);
      }
      variable = new Variable(
        cst.children[chIdx].children[0],
        { exponent, coeficient });
    } else
      variable = new Variable(cst.children[chIdx],
        { exponent, coeficient });
    const action = new ValueAction(parser, null, variable);
    return new AstTreeNode(cst, action, cst.type, cst.tokString());
  }

  // a fraction node
  _createFractionNode(cst, parser) {
    const frac = new Fraction(cst);
    const action = new ValueAction(parser, null, frac);
    return new AstTreeNode(
      cst, action, cst.type, action.valueObj.toString());
  }

  // negative -12 or -x
  _createSignedNode(cst, parser) {
    const left = parser.generateNode(cst.children[1]);
    if (cst.children[0].tok.str === '-') {
      const action = new UnaryOpAction(parser, null);
      action.operator = this.negSign;
      const sign = new AstTreeNode(cst, action, cst.type, '-');
      sign.addLeft(left);
      return sign;
    }
    return left; // when sign is + we dont need to do anything
  }

  // (...)
  _createGroupNode(cst, parser) {
    const o = {root: null, node: null};

    for(let i = 1; i < cst.children.length-1; ++i) {
      const action = new DefaultAction(parser,null);
      const ast = new AstTreeNode(cst, action, cst.type,'(...)');
      const node = parser.generateNode(cst.children[i]);
      this._placeOper(o, ast);
      this._placeChild(o, node);
    }
    return o.root;
  }

  _createCompareNode(cst, parser) {
    const o = {root: null, node: null};
    for(let i = 0; i < cst.children.length; i += 3) {
      const cmpNode = cst.children[i+1].children[0];
      const action = new BinaryOpAction(parser,null);
      const operTbl = {
        eq:this.equal, neq:this.notEqual, lt:this.less,
        gt:this.greater, lteq: this.lessOrEqual,
        gteq: this.greaterOrEqual
      }
      action.operator = operTbl[cmpNode.type];
      const ast = new AstTreeNode(
        cst, action, cmpNode.type, cmpNode.children[0].tok.str);
      this._placeOper(o, ast);
      this._placeChild(o, parser.generateNode(cst.children[i]));
      this._placeChild(o, parser.generateNode(cst.children[i+2]));
    }
    return o.root;
  }

  negSign(value) {
    const cl = value.clone();
    return cl.mul(new Integer(-1));
  }

  add(leftVlu, rightVlu) {
    return leftVlu.add(rightVlu);
  }

  sub(leftVlu, rightVlu) {
    return leftVlu.sub(rightVlu);
  }

  mul(leftVlu, rightVlu) {
    return leftVlu.mul(rightVlu);
  }

  div(leftVlu, rightVlu) {
    return leftVlu.div(rightVlu);
  }

  exp(leftVlu, rightVlu) {
    return leftVlu.exp(rightVlu);
  }

  // √9 square root
  root(value) {
    return value.root();
  }

  // 3√9 other than square root
  nthRoot(leftVlu, rightVlu) {
    return leftVlu.nthRoot(rightVlu);
  }
}

// set up all rules so the are registred in MathEngine statically
initMathRules();
