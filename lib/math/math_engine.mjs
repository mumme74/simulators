"use strict";

import { ActionBase, AstTreeNode, GrammarParser, Parser, SyntaxTreeNode } from "../parser/parser.mjs";
import { initDefaultMathRules } from './math_rules.mjs';

// Order of precedence, rules are applied in this order
export const precedence = {
  Parenthesization: 0,
  Factorial:        1,
  Exponentiation:   2,
  MulAndDiv:        3,
  AddAndSub:        4,
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
 signed    = ('-'|'+') , (fraction | implmul | float | integer | variable | group);
 unsigned  = fraction | implmul | float | integer | variable | group; (* unsigned bypassed in AST *)
 implmul   = (fraction | float | integer), ({group} | {variable})
           | variable, ({group}| {variable} | float | integer)
           | group, {group | variable};

 integer   = {digit};

 float     = wholenum, decpoint, fracnum;
 wholenum  = {digit};
 fracnum   = {digit};
 decpoint  = ','|'.';

 fraction    = 'frac', numerator, '/', denominator;
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
 variable  = "a"|"b"|"c"|"d"|"e"|"f"|"g"|"h"|"i"|"j"|"k"|"l"|"m"|"n"
           | "o"|"p"|"q"|"r"|"s"|"t"|"u"|"v"|"w"|"x"|"y"|"z"
           | "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"
           | "O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z";
 digit     = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";
`;

const operOpposites = {
  add: 'sub', sub:'add',mul:'div',div:'mul'
}

// work around EEE754 floating point rounding error
export function fpRound(jsNumber) {
  return +jsNumber.toPrecision(15);
}
// ------------------------------------------

export class SolveChange {
  /**
   * Store the changes made by one rule on one step on one node
   * @param {SolveTreeNode} triggerNode The node that triggered this change
   * @param {MathRuleBase} changeRule The Math rule that did the change
   * @param {SolveTreeNode} originalLeft The original leaf left
   * @param {SolveTreeNode} originalRight The original leaft right
   */
  constructor(triggerNode, changeRule,
              originalLeft = null,
              originalRight = null)
  {
    this.triggerNode = triggerNode;
    this.changeRule = changeRule;
    this.originalLeft = originalLeft;
    this.originalRight = originalRight;
  }
}

export class SolveVisitArgs {
  /**
   * Passed as argument to all math rules, stores all changes made during one step
   * @param {MathEngine} engine Reference to the math engine that owns this tree
   * @param {Array.<SolveChange>} changes Changes made during this step
   */
  constructor(engine, changes){
    this.engine = engine;
    this.changes = changes;
  }
  hasChanges() {
    return this.changes.length > 0;
  }
}

/**
 * This is a node in a Solve tree. initially it is a copy of the AST
 * During solving it can shrink with the reductions we have made
 * Or it can grow, if we are factorizing an expression
 */
export class SolveTreeNode extends AstTreeNode {
  /**
   * @param {AstTreeNode} ast The Ast treenode that constructed this node
   * @param {Value | null} value The value this node has, if not a value node it has no value
   * @param {number} depth The distance from root this node has
   * @param {SolveTreeNode | null} expression The expression this node belongs to
   * @param {SolveTreeNode | null} equation The equation this node belongs to, in case of equation system we might have more than one
   */
  constructor(ast, value, depth, expression, equation) {
    super(ast?.cstNode, null, ast?.type, ast?.cstNode.tok,);
    this.astNode = ast;
    this.depth = depth;
    this.equation = equation;
    this.expression = expression;
    this.value = value || null;
  }

  runStep(args, prec) {
    if (this.subExpressions) {
      for (const subExpr of this.subExpressions) {
        subExpr.left.runStep(args, prec);
        if (subExpr.right) subExpr.right.runStep(args, precedence);
      }
    }
    const isSubExpr = this.expression?.subExpressions.indexOf(this) > -1;
    if (this.left && !isSubExpr)
      this.left.runStep(args, prec);
    if (this.right && !isSubExpr)
      this.right.runStep(args, prec);
    args.engine.runRulesOnNode(this, prec, args);
  }

  asObject() {
    return {
      depth:this.depth, ...super.asObject()
    };
  }
}

// -----------------------------------------

/**
 * Base class for all values
 * @prop {string} type The typename of this value
 */
export class Value {
  constructor(value, type) {
    this._value = value;
    this.type = type || 'value';
  }

  static create(value, denominator) {
    if (value instanceof SyntaxTreeNode) {
      switch (value.type) {
      case 'integer': return new Integer(value);
      case 'float': return new Float(value);
      case 'fraction': return new Fraction(value);
      case 'variable': return new Variable(value);
      }
    } else if (denominator !== undefined)
      return new Fraction(value, denominator);
    const numVlu = parseFloat(value);
    if (Number.isNaN(numVlu))
      return new Variable(value);
    if (Number.isInteger(numVlu))
      return new Integer(numVlu);
    return new Float(value);
  }

  /**
   * Return the class that constructed value
   * @param {Value} value
   * @returns {Value|Integer|Float|Fraction} The class type to construct value from
   */
  static classOf(value) {
    return {
      variable:Variable,
      integer:Integer,
      float:Float,
      fraction:Fraction,
      value:Value
    }[value.type];
  }
  /**
   * Clone a value
   * @returns {Value|Integer|Float|Fraction} The new copy of this value
   */
  clone(){
    return new (Value.classOf(this))(this._value);
  }
  /**
   * Return the value contained by this value class
   * @returns {number|string} The value contained in this value
   */
  value() {
    return this._value;
  }
}

export class Variable extends Value {
  constructor(letter) {
    super(letter, 'variable');
  }
}

export class Integer extends Value {
  constructor(value) {
    if (value instanceof SyntaxTreeNode) {
      value = parseInt(value.tokString());
    }
    super(value, 'integer');
  }
}

export class Float extends Value {
  constructor(value) {
    let whole, dec, point;
    if (value instanceof SyntaxTreeNode) {
      whole = value.children[0].tokString();
      point = value.children[1].tokString();
      dec   = value.children[2].tokString();
    } else if (typeof value === 'string') {
      const res = /^(.*)([.,])(.*)$/.exec(value);
      whole = res[1]; point = res[2]; dec = res[3];
    }

    if (point) value = parseFloat(`${whole}.${dec}`);

    super(value, 'float');

    if (point) {
      this.whole = whole;
      this.dec = dec;
      this.point = point;
    }
  }
  clone(){
    const cl = super.clone();
    cl.whole = this.whole;
    cl.dec = this.dec;
    cl.point = this.point;
    return cl;
  }
  toString() {
    return `${this.whole}${this.point}${this.dec}`;
  }
}

// ie ½
export class Fraction extends Value {
  constructor(numerator, denominator) {
    if (numerator instanceof SyntaxTreeNode) {
      denominator = numerator.children[2];
      numerator = numerator.children[0];
    }

    super(null, 'fraction');

    this.numerator = numerator;
    this.denominator = numerator;
    this._value = this;
  }
  toString() {
    return `${this.numerator}/${this.denominator}`;
  }
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

  constructor(source, includeRules = [], excludeRules = []) {
    this.varValues = {};
    this.isAlgebraic = false; // has variables in it, sets during parse phase
    this.exponents = []; // contains all exponents in expr x^2 and 2^4, sets during parse phase

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
    }, [[],[],[],[],[]]);

    // parse source
    this.parser = new Parser({
      grmParser, source,
      defaultAction: DefaultAction,
      flattenRules:['variable', 'integer', 'whole','fracnum'],
      dropTerminalsAllRules:[
        ',','.','(',')','*','/','+','-','•','÷','^','√'],
      dropTerminalsOnRules:{fraction:['fraction']},
      bypassRules:[
        'molecule','base','ineqoper','unsigned'],
      generateFuncs:this._generateFuncs()
    });

    const rootAst = this.parser.prgAstRoot;
    //console.log(rootAst.asJson());

    if (rootAst?.left) {
      this.solveTreeRoot = this.buildSolveTree(
        rootAst.left, 0, null, null);
    }
  }

  runRulesOnNode(solveNode, precedence, args) {
    let res = false;
    for(const rule of this.mathRules[precedence]) {
      if (args.changes.length &&
          args.changes[0].triggerNode.depth !== solveNode.depth)
        return res;
      if (rule.appliesToTypes.indexOf(solveNode.type) > -1 &&
          rule.run(solveNode, args))
        res = true;
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
      const res = this.parser.prgAstRoot.action.visit(this);
      return res.value();
    }
    return NaN;
  }

  // a solveTree is a more flat copy of the AST
  buildSolveTree(node, depth, expression, equation) {
    const valueObj = node?.action?.valueObj?.clone() ||
      (node.value instanceof Value ? node.value?.clone() : undefined);
    if (valueObj instanceof Variable)
      expression.isAlgebraic = true;

    const solveNode = new SolveTreeNode(node, valueObj, depth,
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
      const depth2 = depth +
        +(operOpposites[node.type] !== node.left.type && node.type !== node.left.type)
      solveNode.addLeft(
        this.buildSolveTree(node.left,
          depth2, expression, equation));
    }
    if (node?.right) {
      solveNode.addRight(
        this.buildSolveTree(node.right,
          depth+1, expression, equation));
    }

    return solveNode;
  }

  _generateFuncs() {
    const funcs = {
      term:this._createBinaryNode, factor:this._createFactorNode,
      root:this._createRootNode, exponent:this._createBinaryNode,
      float:this._createValueNode, integer:this._createValueNode,
      fraction: this._createFractionNode,
      variable:this._createValueNode, signed: this._createSignedNode,
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
      this._placeChild(o, right);
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
    if (cst.type === 'variable') this.isAlgebraic = true;

    const action = new ValueAction(parser, null, Value.create(cst));
    return new AstTreeNode(cst, action, cst.type, cst.tokString());
  }

  // a fraction node
  _createFractionNode(cst, parser) {
    const nom = cst.children[0], denom = cst.children[1];
    const frac = new Fraction(nom, denom);
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
    cl._value *= -1;
    return cl;
  }

  add(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value() + rightVlu.value();
    return Value.create(fpRound(jsNumber));
  }

  sub(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value() - rightVlu.value();
    return Value.create(fpRound(jsNumber));
  }

  mul(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value() * rightVlu.value();
    return Value.create(fpRound(jsNumber));
  }

  div(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value() / rightVlu.value();
    return Value.create(fpRound(jsNumber));
  }

  exp(leftVlu, rightVlu) {
    const jsNumber = Math.pow(leftVlu.value(), rightVlu.value());
    return Value.create(fpRound(jsNumber));
  }

  // √9 square root
  root(value) {
    const jsNumber = Math.sqrt(value.value());
    return Value.create(fpRound(jsNumber));
  }

  // 3√9 other than square root
  nthRoot(leftVlu, rightVlu) {
    const jsNumber = Math.pow(rightVlu.value(), (1 / leftVlu.value()));
    return Value.create(fpRound(jsNumber));
  }
}

initDefaultMathRules();
