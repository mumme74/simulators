"use strict";
import { SolveTreeNode, SolveChange, SolveVisitArgs } from "./math_solutions.mjs";


import { MathEngine, precedence} from "./math_engine.mjs";
import { ValueBase, Fraction } from "./math_values.mjs";
import { MathRuleBase, allMathRules } from "./math_rule_base.mjs";
import { getTr } from "../translations/translations.mjs";

class FractionRuleBase extends MathRuleBase {
  _replaceFraction(args, newFrac, oldFracNodes, description, operator) {
    const oldNode = Array.isArray(oldFracNodes) ? oldFracNodes[0] : oldFracNodes;
    const oldFracNodesCopy = // take copy before it gets parent unset
      Array.isArray(oldFracNodes) ?
        oldFracNodes.map(f=>
          args.engine.cloneTree(
            f, f.depth, f.expression, f.equation))
        :
          args.engine.cloneTree(oldFracNodes);

    const newChild = new SolveTreeNode(
      oldNode.astNode, 'fraction', newFrac, oldNode.depth,
      oldNode.expression, oldNode.equation);
    oldNode.parent.replaceChild(newChild, oldNode);

    SolveChange.push(
      args, description, newChild, this, oldFracNodesCopy, operator);

    return newChild;
  }
}

class SimplifyFractions extends FractionRuleBase {
  constructor() {
    super(`
    Simplifies fractions in additions and subtractions
    ie: 2/6 -> 1/3`,
    precedence.MulAndDiv,
    ['mul','div','expression']);
  }

  run(node, args) {
    // wait to simplify until all add/sub done on fractions
    // are done
    if (!node.left) return;
    const addAndSubInExpr = this._nodesOfTypeInExpr(
      node.left, ['add','sub']);

    const fractionNodes = this._nodesOfTypeInExpr(node.left, ['fraction']);

    if (!fractionNodes.length)
      return false;

    for (const addSubNode of addAndSubInExpr) {
      if (fractionNodes.find(f=>f.isChildOf(addSubNode)))
        return false; // wait until all add/subtracts are done on fractions
    }

    const desc = getTr(this)('Shrink fractions');
    const fractions = fractionNodes.map(f=>{
      const frac = f.value.shrinkTo();
      if (f.value.denominator.value() > frac.denominator.value()) {
        this._replaceFraction(
          args, frac, [args.engine.cloneTree(f)], desc, 'shrink');
        f.value = frac;
      }
    });

    return true;
  }
}
allMathRules.push(SimplifyFractions);



class MulDivFractionConstants extends FractionRuleBase {
  constructor() {
    super(`
    Multiplies or divides fractions.
    ie frac 1/2 * frac 3/4 = 3/8
    `, precedence.MulAndDiv, ['mul','div']);

    this.typeChk = this._createTypeCheck(['fraction']);
  }
  /*
  input expression: 1/2 * 3/4 -> 3/8
  input:
  term -> mul -> frac 1/2
            \
             \ -> frac 3/4
  output:
  term -> frac 3/8
  */
  run(node, args) {
    return this._runBinary(node, args, null, this._operCb);
  }

  _operCb(lNode, rNode, node, args) {
    const t = getTr(this);
    const nodeParent = node.parent,
          dir = nodeParent.childDirection(node);

    const changeCb = (description, operator, resultArr, affectedArr) => {
      if (operator === 'div') {
        const rNodeClone = node.right.clone();
        rNodeClone.value = resultArr[0];
        rNodeClone.type = resultArr[0].type;
        this._replaceNode(
          rNodeClone, rNode, args, description, operator);
        const nodeClone = node.clone();
        nodeClone.left = node.left;
        nodeClone.right = rNodeClone;
        nodeClone.type = 'mul';
        this._replaceNode(
          nodeClone, node, args, t('divToMul','Change / to *'), operator);

      } else {
        const n = nodeParent[dir];
        const nNode = n.clone();
        const oldNode = args.engine.cloneTree(nNode);
        nNode.value = resultArr[0];
        nNode.type = nNode.value.type;
        nNode.removeChild(nNode.left);
        nNode.removeChild(nNode.right);
        SolveChange.push(args, description, nNode, this,[n.left, n.right], operator);
        this._replaceNode(
          nNode, n, args, description, operator);
      }
    }

    const newFrac = lNode.value[node.type](rNode.value, changeCb);
    return true;
  }
}
allMathRules.push(MulDivFractionConstants);


class AddSubFractions extends FractionRuleBase {
  constructor() {
    const operCb = {
      add: null,
      sub: null
    }
    super(`
    Add or subtract fractions
    ie 1/2 + 4/5 = 13/10 or 1/2 - 1/3 = 1/6
    `, precedence.AddAndSub, Object.keys(operCb));

    this.typeChk = this._createTypeCheck(['fraction']);
    this.operCb = operCb;
    //operCb.add = operCb.sub = this._expand;
  }
  /*
  input expression: 1/2 + 4/5 = 13/10
  input:
  term -> add -> frac 1/2
            \
             \ -> frac 4/5
  output:
  term -> 13/10
  */
  run(node, args) {
    return this._runBinary(node, args, null, this._operate);
  }

  _operate(lChild, rChild, node, args) {// eslint-disable-line unused-variable
    const lChildParent = lChild.parent,
          rChildParent = rChild.parent;
    const rChildDir = rChildParent.childDirection(rChild),
          lChildDir = lChildParent.childDirection(lChild);
    this._expand(lChild, args);
    const lFrac = lChildParent.left.value, // expand have replace nodes in the tree
          rFrac = rChildParent.right.value;

    const newFrac = lFrac[node.type](rFrac);

    const newNode = new SolveTreeNode(
      node.astNode, 'fraction', newFrac, node.depth,
      node.expression, node.equation);
    node.parent.replaceChild(newNode, node);

    const oldNodes = [
      // we need to look up child of parent agin here as expand maight
      // have replace lChild or rChild in tree
      lChildParent[lChildDir], rChildParent[rChildDir]]

    SolveChange.push(
      args, 'Sum fractions', newNode, this, oldNodes, node.type);

    return true
  }

  _expand(factNode1, args) {
    const fractionNodes = this._nodesOfTypeInExpr(factNode1, ['fraction']);
    const fractions = fractionNodes.map(f=>f.value);
    const comDenom = Fraction.leastCommonDenominator(fractions);
    if (fractions.find(f=>f.denominator.value() !== comDenom)) {
      const desc = getTr(this)('Expanding fractions');
      for (const fracNode of fractionNodes) {
        if (fracNode.value.denominator.value() !== comDenom) {
          const newFrac = fracNode.value.expandTo(comDenom);
          this._replaceFraction(args, newFrac, fracNode,
            desc, 'expand');
        }
      }
    }
  }
}
allMathRules.push(AddSubFractions);
