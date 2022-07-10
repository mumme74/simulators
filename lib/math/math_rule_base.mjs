"use strict";

import { MathEngine, SolveChange,
         SolveTreeNode, Value } from "./math_engine.mjs";


// every mathrule shuld register here
export const allMathRules = [];


// called by math_engine.mjs script,
// before any MathEngine has been consructed
export function initMathRules() {
  for (const rule of allMathRules)
    new rule(); // registers plugin in MathRuleBase constructor
}


// base class for all Math rules
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
    if (rightChild) {
      rChild = args.engine.buildSolveTree(rightChild, depth);
      rChild.parent = triggerNode;
    }

    const change = new SolveChange(
      newNode, this, triggerNode, lChild, rChild);
    args.changes.push(change);

    // bypass if node only has one child, ie: we are finished solved that node
    if (this._isSingleInSubExpression(triggerNode)) {
      this._moveUpNode(newNode, triggerNode);
      const subExpr = triggerNode.expression.subExpressions;
      const idx = subExpr.indexOf(triggerNode);
      if (idx > -1) subExpr.splice(idx,1);
    } else
      triggerNode.parent.replaceChild(newNode, triggerNode);

    return newNode;
  }

  _isSingleChild(node) {
    const p = node.parent;
    return (p.left === node && !p.right) ||
           (p.right === node && !p.left);
  }

  _isSingleInSubExpression(node) {
    let p = node.parent;
    for(;p?.parent && p.type !== 'group' && p.expression?.expression;
         p = p.parent)
    {
      if (p.left && p.right) return false;
    }
    return node.expression?.expression;
  }

  // node is contained by a subexpression, move up tree
  _moveUpNode(newNode, triggerNode) {
    newNode.depth++;
    let n = triggerNode, lastType;
    for(; n.parent.parent &&
          (!n.parent.right || n.parent.right.type === 'group');
        n = n.parent)
    {
      newNode.depth--;
      n.parent.replaceChild(newNode, n);
      if (lastType === 'expression')
        break;
      lastType = n.type;
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
          hasChanged = cb(lNode, rNode, node, args);
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

export function createTypeCheck(types) {
  return (node)=>{
    if (node?.type === 'signed') node = node.left;
    return types.indexOf(node?.type) > -1
  }
}

export function getValue(node) {
  if (node.type === 'signed')
    return -node.left.value.value();
  return node.value.value()
}
