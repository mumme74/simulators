"use strict";

//import { allMathRules } from "./math_allrules.mjs";

import { MathEngine, SolveChange,
  SolveTreeNode, Value, Fraction,
  precedence} from "./math_engine.mjs";

import { MathRuleBase, createTypeCheck,
         getValue, allMathRules } from "./math_rule_base.mjs";

import { toFraction } from "../helpers/index.mjs";

class FractionRuleBase extends MathRuleBase {
  _replaceFraction(args, newFrac, oldFracNode) {
    const newChild = new SolveTreeNode(
      oldFracNode.astNode, newFrac, oldFracNode.depth,
      oldFracNode.expression, oldFracNode.equation);
    newChild.type = 'fraction';
    oldFracNode.parent.replaceChild(newChild, oldFracNode);

    const change = new SolveChange(
      newChild, this, oldFracNode, oldFracNode.left, oldFracNode.right);
    args.changes.push(change);

    return newChild;
  }

  // simplifies fractions individually
  // ie not a good option for add/sub fractions
  _simplifyFractions(fractions, cb) {
    let hasChanged = false, shouldContinue;

    do {
      shouldContinue = false;
      for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
        fractions.forEach((frac, i, arr) => {
          if ((frac.denominator % prime) === 0 &&
              (frac.numerator % prime) === 0)
          {
            hasChanged = true;
            shouldContinue = true;
            const newFrac = frac.clone();
            newFrac.denominator /= prime;
            newFrac.numerator /= prime;
            arr[i] = newFrac;
            if (cb) cb(i, newFrac, frac);
          }
        });
      }
    } while(shouldContinue);

    return hasChanged;
  }

  // simplifies fractions together
  // for add/sub fractions
  _simplifyFractionsTogether(fractions, cb) {
    let hasChanged = false,
        shouldContinue = false,
        usePrime = 0;

    const oldFractions = [...fractions];

    do {
      for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
        let frac;
        usePrime = prime;
        for (let i = 0; i < fractions.length; ++i) {
          frac = fractions[i];
          if ((frac.denominator % prime) !== 0 ||
              (frac.numerator % prime) !== 0 ||
              frac.numerator < prime || frac.denominator < prime)
          {
            usePrime = 0;
            break;
          }
        }

        if (usePrime && frac) {
          // if we get here all fractions passed this prime test
          fractions.forEach((frac, i, arr)=>{
            hasChanged = true;
            shouldContinue = true;
            const newFrac = frac.clone();
            newFrac.denominator /= usePrime;
            newFrac.numerator /= usePrime;
            arr[i] = newFrac;
          });
        }
      }
    } while(usePrime);

    if (hasChanged && cb) {
      oldFractions.forEach((old, i)=>{
        cb(i, fractions[i], old);
      });
    }

    return hasChanged;
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
    const addAndSubInExpr = this._nodesOfTypeInExpr(
      node.left, ['add','sub']);
    const allFractions = this._nodesOfTypeInExpr(node.left, ['fraction']);
    for (const addSubNode of addAndSubInExpr) {
      if (allFractions.find(f=>f.isChildOf(addSubNode)))
        return false; // wait until all add/subtracts are done on fractions
    }

    const depth = node.left?.depth || node.right?.depth;
    const fractions = this._nodesOfTypeInExpr(node.left, ['fraction']);

    return this._simplifyFractions(
      fractions.map(f=>f.value), (idx, frac)=>{
        return this._replaceFraction(args, frac, fractions[idx]);
    });
  }
}
allMathRules.push(SimplifyFractions);



class MulDivFractionConstants extends FractionRuleBase {
  constructor() {
    const operCb = {
      div: null,
      mul: (lVlu, rVlu) => new Fraction(
        lVlu.numerator * rVlu.numerator,
        lVlu.denominator * rVlu.denominator)
    }
    super(`
    Multiplies or divides fractions.
    ie frac 1/2 * frac 3/4 = 3/8
    `, precedence.MulAndDiv, Object.keys(operCb));

    this.typeChk = createTypeCheck(['fraction']);
    this._operCb = operCb;
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
    if (node.type === 'div')
      return this._runBinary(node, args, null, this._div.bind(this));
    return this._runBinary(node, args, this._operCb, null);
  }

  _div(lChild, rChild, node, args) { // eslint-disable-line unused-variable


    const divNode = rChild.parent;

    const newParent = new SolveTreeNode(
      divNode.astNode, null, divNode.depth,
      divNode.expression, divNode.equation);
    newParent.type = 'mul';

    const newRValue = new Fraction(
      rChild.value.denominator, rChild.value.numerator);
    const newRChild = super._replaceFraction(args, newRValue, rChild);

    divNode.parent.replaceChild(newParent, divNode);
    newParent.addLeft(lChild);
    newParent.addRight(newRChild);

    const change = new SolveChange(
      newParent, this, args.engine.buildSolveTree(divNode, divNode.depth),
      null, null);
    args.changes.push(change);


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

    this.typeChk = createTypeCheck(['fraction']);
    this.operCb = operCb;
    operCb.add = operCb.sub = this._expand;
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
    this._expand(lChild, args);
    const lFrac = lChild.parent.left.value, // expand have replace nodes in the tree
          rFrac = rChild.parent.right.value;

    const numerator = node.type === 'add' ?
      lFrac.numerator + rFrac.numerator :
      lFrac.numerator - rFrac.numerator;

    const newFrac = new Fraction(
      numerator, lFrac.denominator);

    const newNode = this._replaceFraction(args, newFrac, node);
    if (this._isSingleInSubExpression(newNode)) {
      this._simplifyFractions([newNode.value]);
      this._moveUpNode(newNode, node);
    }

    return true
  }

  _expand(factNode1, args) {
    const fractionNodes = this._nodesOnDepth(
      factNode1.parent, factNode1.depth, ['fraction']);
    const denominators = [];
    const fractions = fractionNodes.map(n=>{
      if (denominators.indexOf(n.value.denominator))
        denominators.push(n.value.denominator);
      return n.value.clone();
    });

    if (denominators.length < 2)
      return;

    // calculate a common denominator
    const commonDenom = denominators.reduce((vlu, den)=>
      vlu*den, denominators[0]);

    fractions.forEach(frac=>{
      const factor = commonDenom / frac.denominator;
      frac.numerator *= factor;
      frac.denominator *= factor;
    });

    this._simplifyFractionsTogether(fractions,
      (idx, frac)=>{
        const oldFrac = fractionNodes[idx];
        if (oldFrac.value.denominator != frac.denominator)
          this._replaceFraction(args, frac, oldFrac);
    });

  }
}
allMathRules.push(AddSubFractions);
