"use strict";

import { MathEngine, precedence } from "./math_engine.mjs";
import { ValueBase } from "./math_values.mjs";

import { SolveTreeNode, SolveChange, SolveVisitArgs } from "./math_solutions.mjs";

import { getTr } from "../translations/translations.mjs";



// every mathrule shuld register here
export const allMathRules = [];


// called by math_engine.mjs script,
// before any MathEngine has been consructed
export function initMathRules() {
  for (const rule of allMathRules)
    new rule(); // registers plugin in MathRuleBase constructor
}


// Base class for all Math rules.
// Rules should NOT store any solving related info,
// ie They should be reentrant.
export class MathRuleBase {
  constructor(description, precedence, appliesToTypes=[]) {
    const t = getTr(this);
    this.name = this.constructor.name;
    this.description = t('description', description);
    this.appliesToTypes = appliesToTypes;
    this.precedence = precedence;

    if (!MathEngine.allMathRules.find(r=>r.name===this.name))
      MathEngine.allMathRules.push(this);
  }

  run(node, args) {
    return false; // subclasses must implement
  }

  _doChange(operatorNode, args, value, leftChild, rightChild, description, operator) {
    const vlu = ValueBase.create(value);
    const newNode = new SolveTreeNode(
      operatorNode.astNode, vlu.type, vlu,
      operatorNode.depth, operatorNode.expression,
      operatorNode.equation);

    const depth = operatorNode.depth +1;
    const oldNodes = [args.engine.cloneTree(leftChild, depth)];
    if (rightChild) {
      oldNodes.push(args.engine.cloneTree(rightChild, depth));
    }

    SolveChange.push(
      args, description, newNode, this, oldNodes, operator);

    operatorNode.parent.replaceChild(newNode, operatorNode);

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

  _childrenOf = MathEngine.childrenOf;

    // scan all of expressions children, find alla of type at depth
  _nodesOnDepth(node, depth, types = []) {
    return this._nodesOfTypeInExpr(node, types).filter(n=>n.depth===depth);
  }

  _nodesOfTypeInExpr(node, types = []) {
    const nodes = [
      ...MathEngine.childrenOf(node.expression?.left, types),
      ...MathEngine.childrenOf(node.expression?.right, types)
    ];

    return nodes;
  }

  // node is contained by a subexpression, move up tree
  _moveUpNode(newNode, triggerNode) {
    newNode.depth++;
    let n = triggerNode, lastType, parent = n.parent;
    for(; parent?.parent &&
          (!parent.right || parent.right.type === 'group');
        n = parent)
    {
      newNode.depth--;
      parent = n.parent.parent; // parent gets unset in replaceChild
      n.parent.replaceChild(newNode, n);
      if (lastType === 'expression')
        break;
      lastType = n.type;
    }
  }

  _moveDepth(node, deeper) {
    if (!node) return;
    this._moveDepth(node.left);
    this._moveDepth(node.right);
    node.depth += deeper;
  }

  // when we have 2 operands
  _runBinary(node, args, operCb, cb, description) {
    let lNode = null, rNode = null, hasChanged = false;

    for (let n = node; n && !hasChanged; n = n.parent) {
      if (this.typeChk(n.left)) lNode = n.left;
      if (this.typeChk(n.right)) rNode = n.right;
      if (lNode && rNode) {
        if (cb) {
          hasChanged = cb.call(this, lNode, rNode, n, args);
        } else if (operCb[n.type]) {
          const lVlu = this._getUnsignedValue(lNode),
                rVlu = this._getUnsignedValue(rNode);
          const vlu = operCb[n.type].call(this, lVlu, rVlu, n, args);
          this._doChange(n, args, vlu, lNode, rNode, description, n.type);
          hasChanged = true;
        }
      }
    }

    return hasChanged;
  }

  // when we have a single operand
  _runUnary(node, args, operCb, cb, description) {
    let vNode = null, hasChanged = false;

    for (let n = node; n && !hasChanged; n = n.parent) {
      if (this.typeChk(n.left)) vNode = n.left;
      else if (this.typeChk(n.right)) vNode = n.right;
      if (vNode) {
        if (cb) {
          hasChanged = cb.call(this, vNode, n, args);
        } else if (operCb[n.type]) {
          const nVlu = this._getUnsignedValue(vNode),
                vlu = operCb[n.type].call(this, nVlu, n, args);
          this._doChange(n, args, vlu, vNode, null, description, n.type);
          hasChanged = true;
        }
      }
    }

    return hasChanged;
  }

  _removeNode(oldNode, args, description, operator) {
    const oldTree = args.engine.cloneTree(oldNode)
    SolveChange.push(
      args, description, null, this, oldTree, operator);
    oldNode.parent.removeChild(oldNode);
  }

  _replaceNode(newNode, oldNode, args, description, operator, forceNew = false) {
    const oldTree = args.engine.cloneTree(oldNode);
    SolveChange.push(
      args, description, newNode, this,
      oldNode, operator, forceNew);
    oldNode.parent.replaceChild(newNode, oldNode);
  }

  _createTypeCheck(types) {
    return (node)=>{
      if (node?.type === 'signed') node = node.left;
      return types.indexOf(node?.type) > -1
    }
  }

  _getUnsignedValue(valueNode) {
    if (valueNode.type === 'signed')
      return -valueNode.left.value.value();
    return valueNode.value.value()
  }
}

// ------------------------------------------

class RemoveUnnecessaryGroups extends MathRuleBase {
  constructor() {
    super(`
    Removes unneeded groups, such as (-1) or (a^2)
    `, precedence.Parenthesization, ['group']);
  }

  run(node, args) {
    const expr = node.left;
    if (!expr.left && !expr.right) {
      node.parent.removeChild(node);
      return;
    }

    const term = expr.left || expr.right;
    if (!term.left && !term.right) {
      if (term.value instanceof ValueBase) {
        this._moveUpNode(term, term);
        const subExpr = term.expression.subExpressions;
        const idx = subExpr.indexOf(term);
        if (idx > -1) subExpr.splice(idx,1);
      } else
        node.parent.removeChild(node);
      return;
    }

    if ((term.left && !term.right) ||
        (!term.left && term.right))
    {
      this._moveUpNode(term, term);
      return;
    }
  }
}
allMathRules.push(RemoveUnnecessaryGroups);


export class ChangeSignOnTerms extends MathRuleBase {
  constructor() {
    super(`
    Changes sign on any terms with +-
    `, precedence.TidyUp, ['add', 'sub']);
  }

  run(node, args) {
    if (args.changes.length) return;
    const opposite = node.type === 'add' ? 'sub' : 'add';
    const t = getTr(this);

    const terms = this._nodesOnDepth(node, node.depth, [node.type]);
    for (const term of terms) {
      if (term.right?.type === 'signed') {
        if (node.type === 'add')
          this._swapNode(term, t("Uneven signs becomes '-'"), opposite, args);
        else if (term.right?.type)
          this._swapNode(term, t("Equal signs becomes '+'"), opposite, args);
      }
    }
  }

  _swapNode = (term, desc, opposite, args) => {
    const newSub = term.clone();
    newSub.type =  opposite;
    if (term.left) newSub.addLeft(term.left);
    if (term.right) newSub.addRight(term.right);
    newSub.addRight(term.right.left); // remove signed node
    this._replaceNode(
      newSub, term, args, "Uneven signs becomes '-'", opposite);
  }
}
allMathRules.push(ChangeSignOnTerms);
