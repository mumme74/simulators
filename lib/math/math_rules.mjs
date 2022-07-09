"use strict";
// collection of default math rules in this file
import { MathEngine, SolveChange, fpRound,
         SolveTreeNode, Value, precedence} from "./math_engine.mjs";


export class MathRuleBase {
  constructor(description, precedence, appliesToTypes=[]) {
    this.name = this.constructor.name;
    this.description = description;
    this.appliesToTypes = appliesToTypes;
    this.precedence = precedence;

    if (!MathEngine.allMathRules.find(r=>r.name===this.name))
      MathEngine.allMathRules.push(this);
  }

  run(node, args) {
    return false; // subclasses must implement
  }

  _doChange(triggerNode, args, value, leftChild, rightChild) {
    const newNode = new SolveTreeNode(
      triggerNode.astNode, Value.create(value),
      triggerNode.depth, triggerNode.expression,
      triggerNode.equation);
    newNode.type = newNode.value.type;

    let rChild = null;
    const depth = triggerNode.depth +1;
    const lChild = args.engine.buildSolveTree(leftChild, depth);
    lChild.parent = triggerNode;
    if (rightChild) {
      rChild = args.engine.buildSolveTree(rightChild, depth);
      rChild.parent = triggerNode;
    }

    const change = new SolveChange(
      triggerNode, this, lChild, rChild);
    args.changes.push(change);

    // bypass if node only has one child, ie: we are finished solved that node
    if (triggerNode.expression.depth > 0) {
      this._moveUpNode(newNode, triggerNode);
      const subExpr = triggerNode.expression.subExpressions;
      const idx = subExpr.indexOf(triggerNode);
      if (idx > -1) subExpr.splice(idx,1);
    } else
      triggerNode.parent.replaceChild(newNode, triggerNode);

    return newNode;
  }

  // node is contained by a subexpression, move up tree
  _moveUpNode(newNode, triggerNode) {
    newNode.depth++;
    let n = triggerNode;
    for(; n.parent.parent &&
          (!n.parent.right || n.parent.right.type === 'group');
        n = n.parent)
    {
      newNode.depth--;
      n.parent.replaceChild(newNode, n);
    }
  }

  // when we have 2 operands
  _runBinary(node, args, operCb, cb) {
    let lNode = null, rNode = null, hasChanged = false;

    for (let n = node; n && !hasChanged; n = n.parent) {
      if (this.typeChk(n.left)) lNode = n.left;
      if (this.typeChk(n.right)) rNode = n.right;
      if (lNode && rNode) {
        if (cb) {
          hasChanged = cb();
        } else if (operCb[n.type]) {
          const lVlu = getValue(lNode),
                rVlu = getValue(rNode);
          const vlu = operCb[n.type](lVlu, rVlu);
          this._doChange(n, args, vlu, lNode, rNode);
          hasChanged = true;
        }
      }
    }

    return hasChanged;
  }

  // when we have a single operand
  _runUnary(node, args, operCb, cb) {
    let vNode = null, hasChanged = false;

    for (let n = node; n && !hasChanged; n = n.parent) {
      if (this.typeChk(n.left)) vNode = n.left;
      else if (this.typeChk(n.right)) vNode = n.right;
      if (vNode) {
        if (cb) {
          hasChanged = cb();
        } else if (operCb[n.type]) {
          const nVlu = getValue(vNode),
                vlu = operCb[n.type](nVlu);
          this._doChange(n, args, vlu, vNode, null);
          hasChanged = true;
        }
      }
    }

    return hasChanged;
  }
}

// ------------------------------------------

const allRules = [];

function createTypeCheck(types) {
  return (node)=>{
    if (node?.type === 'signed') node = node.left;
    return types.indexOf(node?.type) > -1
  }
}

function getValue(node) {
  if (node.type === 'signed')
    return -node.left.value.value();
  return node.value.value()
}

class AddSubConstants extends MathRuleBase {
  constructor() {
    const operCb = {
      add: (lVlu, rVlu) => fpRound(lVlu + rVlu),
      sub: (lVlu, rVlu) => fpRound(lVlu - rVlu),
    };

    super(`
    Add or subtract 2 or more contants.
    ie: 1 + 2 - 4 -> -1
    `, precedence.AddAndSub, Object.keys(operCb));

    this.typeChk = createTypeCheck(['integer','float']);
    this._operCb = operCb;
  }
  /*
  input expression: 1 + 2 - 4 -> -1
  input:
  term -> sub -> add -> 1
           \      \  -> 2
            \ -> 4
  output:
  term -> -1
  */
  run(node, args) {
    return this._runBinary(node, args, this._operCb, null);
  }
}
allRules.push(AddSubConstants);

class MulDivConstants extends MathRuleBase {
  constructor() {
    const operCb = {
      mul: (lVlu, rVlu) => fpRound(lVlu * rVlu),
      div: (lVlu, rVlu) => fpRound(lVlu / rVlu),
    }
    super(`
    Multiply or divide 2 or more contants.
    ie: 1 * 2 / 4 -> 0.5
    `, precedence.MulAndDiv, Object.keys(operCb));

    this.typeChk = createTypeCheck(['integer','float']);
    this._operCb = operCb;
  }
  /*
  input expression: 1 * 2 / 4 -> 0.5
  input:
  term -> div -> mul -> 1
           \      \  -> 2
            \ -> 4
  output:
  term -> 0.5
  */
  run(node, args) {
    return this._runBinary(node, args, this._operCb, null);
  }
}
allRules.push(MulDivConstants);

class ExpConstants extends MathRuleBase {
  constructor() {
    const operCb = {
      exp: (lVlu, rVlu) => fpRound(Math.pow(lVlu, rVlu)),
    }
    super(`
    Exponential 2 or more contants.
    ie: 2 ^ 8  = 16 or 2 ^ 2 ^ 4 = 65536
    `, precedence.Exponentiation, Object.keys(operCb));

    this.typeChk = createTypeCheck(['integer','float']);
    this._operCb = operCb;
  }
  /*
  input expression: 2 ^ 2 ^ 4 -> 65536
  input:
  term -> exp -> exp -> 2
           \      \  -> 4
            \ -> 2
  output:
  term -> 65536
  */
  run(node, args) {
    return this._runBinary(node, args, this._operCb, null);
  }
}
allRules.push(ExpConstants);

class RootConstants extends MathRuleBase {
  constructor() {
    const operCb = {
      root: (rVlu) => fpRound(Math.sqrt(rVlu)),
      nthRoot: (lVlu, rVlu) => fpRound(Math.pow(rVlu, (1 / lVlu))),
    }
    super(`
    Square root a constant √xx or nthRoot ie: 3√xx.
    ie: √25 = 5 or 3√75 = 5
    `, precedence.Exponentiation, Object.keys(operCb));

    this.typeChk = createTypeCheck(['integer','float']);
    this._operCb = operCb;
  }
  /*
  input expression: 3√125 -> 5
  input:
  term -> root -> 3
            \
             \ -> 125
  output:
  term -> 5
  */
  run(node, args) {
    if (node.type === 'nthRoot')
      return this._runBinary(node, args, this._operCb, null);
    return this._runUnary(node, args, this._operCb, null);
  }
}
allRules.push(RootConstants);


class AddSubAlgebraicTerms extends MathRuleBase {
  constructor() {
    super(`
    Adds or subtracts together together 2 variables.
    ie: 2x+3x -> 5x`,
    precedence.AddAndSub,
    ['add', 'sub'])
  }
  /*
  input expression: 2x+3x-4x^2 -> 5x-4x^2
  input:
  term -> sub -> add -> mul -> 2
           \      \      \ ->  x
            \      \ -> mul -> 3
             \            \ -> x
              \ -> sub ->mul -> 4
                     \ -> exp -> x
                           \  -> 2
  output:
  term -> sub -> mul -> 5
            \     \  -> x
             \ -> mul -> 4
                   \ -> exp -> x
                          \ -> 2
  */
  run(node, args) {
    if (!node.expression.isAlgebraic)
      return false;
    const terms = [];
  }
}
allRules.push(AddSubAlgebraicTerms);



class MulAlgebraicTerms extends MathRuleBase {
  constructor() {
    super(`
    Multiplies 2 or more factors together.
    ie: x * 2x becomes 2x^2
    `,
    precedence.MulAndDiv,
    ['mul']);
  }
  /*
  input expression: 2x * 3x -> 2x^2
  input:
  factor -> mul -> mul -> 2
             \      \  -> x
              \ -> mul -> 3
                    \  -> x

  output:
  factor -> mul -> 2
             \ -> exp - x
                   \ -> 2
  */
  run(node, args) {
    if (!node.expression.isAlgebraic)
      return false;
  }
}
allRules.push(MulAlgebraicTerms);




export function initDefaultMathRules() {
  for (const rule of allRules)
    new rule(); // registers plugin in base constructor
};
