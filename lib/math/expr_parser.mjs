"use strict";

import { ActionBase, AstTreeNode, GrammarParser, Parser, SyntaxTreeNode } from "../parser/parser.mjs";

// Order of precedence
/*
1. Parenthesization,
2. Factorial, (currently unsupported)
3. Exponentiation,
4. Multiplication and division,
5. Addition and subtraction.
*/

// grammar for a eqation or a algebra
export const mathExprGrm =
`start      = inequality | equation | expression;
 inequality = (equation | expression) , {ineqoper, (equation | expression)};
 equation   = expression, {eq, expression};
 expression = term;

 group       = '(', { expression }, ')';

 term        = factor, [{('+'|'-'), factor}];
 factor      = base, [{(mul|div), base}];

 base        = root | exponent | molecule; (* base bypassed in AST *)
 root        = [(float | integer)],'√', (exponent | molecule);
 exponent    = molecule, '^', (root | molecule);
 molecule = signed | unsigned;             (* molecule bypassed in AST *)
 signed   = ('-'|'+') , (implmul | float | integer | variable | group);
 unsigned = implmul | float | integer | variable | group; (* unsigned bypassed in AST *)
 implmul  = (float | integer), ({group} | {variable})
          | variable, ({group}| {variable} | float | integer)
          | group, {group | variable};
 integer  = {digit};
 float    = wholenum, decpoint, fracnum;
 wholenum = {digit};
 fracnum  = {digit};
 decpoint = ','|'.';

 ineqoper = neq | lt | gt | lteq | gteq; (* ineqoper bypassed in AST *)
 eq       = '=';
 neq      = "≠"|"!=";
 lt       = '<';
 gt       = '>';
 lteq     = "≤"|"<=";
 gteq     = "≥"|">=";
 mul      = "•"|"*";
 div      = "÷"|"/";
 variable = "a"|"b"|"c"|"d"|"e"|"f"|"g"|"h"|"i"|"j"|"k"|"l"|"m"|"n"
          | "o"|"p"|"q"|"r"|"s"|"t"|"u"|"v"|"w"|"x"|"y"|"z"
          | "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"
          | "O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z";
 digit    = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";
`;

// work around EEE754 floating point rounding error
function fpRound(jsNumber) {
  return +jsNumber.toPrecision(15);
}

class Value {
  constructor(value, type) {
    this.value = value;
    this.type = type || 'value';
  }
  clone(){
    return new {
      variable:Variable,
      integer:Integer,
      float:Float,
      value:Value
    }[this.type](this.value);
  }
}

class Variable extends Value {
  constructor(letter) {
    super(letter, 'variable');
  }
}

class Integer extends Value {
  constructor(value) {
    if (value instanceof SyntaxTreeNode) {
      value = parseInt(value.tokString());
    }
    super(value, 'integer');
  }
}

class Float extends Value {
  constructor(value) {
    let whole, dec, point;
    if (value instanceof SyntaxTreeNode) {
      whole = value.children[0].tokString();
      point = value.children[1].tokString();
      dec   = value.children[2].tokString();
      value = parseFloat(`${whole}.${dec}`);
    }
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

class DefaultAction extends ActionBase {
  visit(engine) {// eslint-disable no-unused-vars
    // allow stepping through evaluator
    if (!engine.state && !engine.currentNode)
      engine.currentNode = this;
    else
      return super.visit(engine);
  }
}

class BinaryOpAction extends DefaultAction {
  visit(engine) {// eslint-disable-line no-unused-vars
    const left = this.astNode.left.action.visit(engine),
          right = this.astNode.right.action.visit(engine);
    return this.operator(left, right)
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

export class MathEngine {
  constructor(source) {
    this.grmParser = new GrammarParser(mathExprGrm, 'start');
    this.grmParser.checkGrammar();
    this.varValues = {};

    const generateFuncs = {
      term:this._createBinaryNode, factor:this._createFactorNode,
      root:this._createRootNode, exponent:this._createBinaryNode,
      float:this._createValueNode, integer:this._createValueNode,
      variable:this._createValueNode, signed: this._createSignedNode,
      implmul:this._createImplMul, group: this._createGroupNode,
      equation:this._createCompareNode, ineqauality: this._createCompareNode,
    };
    for(const key of Object.keys(generateFuncs))
      generateFuncs[key] = generateFuncs[key].bind(this);

    this.parser = new Parser({
      grmParser:this.grmParser, source,
      defaultAction: DefaultAction,
      flattenRules:['variable', 'integer', 'whole','fracnum'],
      dropTerminalsAllRules:[
        ',','.','(',')','*','/','+','-','•','÷','^','√'],
      bypassRules:[
        'molecule','base','ineqoper', 'expression','unsigned'],
      generateFuncs
    });

    this.currentNode = this.parser.prgAstRoot;
    console.log(this.currentNode.asJson());
  }

  evaluate(varValues) {
    if (varValues)
      this.varValues = varValues;
    if (this.currentNode) {
      const res = this.currentNode.action.visit(this);
      return res.value;
    }
    return NaN;
  }

  // place node on ast, left to right, ast.right becomes the new node
  // ie use node.right as a linked list
  _placeNode(o, ast) {
    if (!o.root) { o.root = ast; }
    if (!o.node) o.node = ast;
    else if (!o.node.left) o.node.addLeft(ast);
    else if (!o.node.right) {
      o.node.addRight(ast);
      o.node = ast;
    }
  }

  // 1 + 2 or 1 - 2 or 1^2
  _createBinaryNode(cst, parser) {
    const o = {root:null, node:null};
    let left = parser.generateNode(cst.children[0]);

    // it might be a node with only left, aka a node we can bypass
    if (cst.children.length < 2)
      return left;


    for(let i = 1; i < cst.children.length; i += 3) {
      const right = parser.generateNode(cst.children[i+1]),
            midCh = cst.children[i].tokString(),
            action = new BinaryOpAction(parser,null);
      action.operator = midCh  === '+' ? this.add :
        midCh === '^' ? this.exp : this.sub;
      const nodeVlu = midCh === '+' ? 'add' :
        midCh === '^' ? 'exp' : 'sub'
      const ast = new AstTreeNode(cst, action, nodeVlu, midCh);
      this._placeNode(o, ast);
      this._placeNode(o, left);
      this._placeNode(o, right);
      left = ast;
    }
    return o.root;
  }

  // 1 * 2 or 1 / 2
  _createFactorNode(cst, parser) {
    const o = {root:null, node:null};
    let left = parser.generateNode(cst.children[0]);

    // it might be a node with only left, aka a node we can bypass
    if (cst.children.length < 2)
      return left;

    for(let i = 1; i < cst.children.length; i += 3) {
      const right = parser.generateNode(cst.children[i+1]),
            isMul = cst.children[i].type === 'mul',
            action = new BinaryOpAction(parser,null);
      action.operator = isMul ? this.mul : this.div;
      const nodeVlu = isMul ? 'mul' : 'div',
            ast = new AstTreeNode(
        cst, action, nodeVlu, cst.children[i].tokString());
      this._placeNode(o, ast);
      this._placeNode(o, left);
      this._placeNode(o, right);
      left = ast;
    }
    return o.root;
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
      this._placeNode(o, ast);
      this._placeNode(o, left);
      this._placeNode(o, right);
      left = ast;
    }
    return o.root;
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
      this._placeNode(o, ast);
      if (isNthRoot) {
        this._placeNode(o, parser.generateNode(cst.children[i]));
        this._placeNode(o, parser.generateNode(cst.children[i+2]));
      } else
        this._placeNode(o, parser.generateNode(cst.children[i+1]));
    }
    return o.root;
  }

  // a terminal node
  _createValueNode(cst, parser) {
    const vluCls = cst.type === 'float' ? Float :
      cst.type === 'variable' ? Variable : Integer;
    const action = new ValueAction(parser,null, new vluCls(cst));
    return new AstTreeNode(cst, action, cst.type, cst.tokString());
  }

  // negative -12 or -x
  _createSignedNode(cst, parser) {
    const left = parser.generateNode(cst.children[1]);
    if (cst.children[0] === '-') {
      const action = new UnaryOpAction(parser,null);
      action.operator = this.negSign;
      return new AstTreeNode(cst, action, cst.type, '-');
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
      this._placeNode(o, ast);
      this._placeNode(o, node);
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
      this._placeNode(o, ast);
      this._placeNode(o, parser.generateNode(cst.children[i]));
      this._placeNode(o, parser.generateNode(cst.children[i+2]));
    }
    return o.root;
  }

  negSign(value) {
    const cl = value.clone();
    cl.value *= -1;
    return cl;
  }

  add(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value + rightVlu.value;
    return new Value(fpRound(jsNumber));
  }

  sub(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value - rightVlu.value;
    return new Value(fpRound(jsNumber));
  }

  mul(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value * rightVlu.value;
    return new Value(fpRound(jsNumber));
  }

  div(leftVlu, rightVlu) {
    const jsNumber = leftVlu.value / rightVlu.value;
    return new Value(fpRound(jsNumber));
  }

  exp(leftVlu, rightVlu) {
    const jsNumber = Math.pow(leftVlu.value, rightVlu.value);
    return new Value(fpRound(jsNumber));
  }

  // √9 square root
  root(value) {
    const jsNumber = Math.sqrt(value.value);
    return new Value(fpRound(jsNumber));
  }

  // 3√9 other than square root
  nthRoot(leftVlu, rightVlu) {
    const jsNumber = Math.pow(rightVlu.value, (1 / leftVlu.value));
    return new Value(fpRound(jsNumber));
  }
}

