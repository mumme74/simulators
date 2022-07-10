"use strict";

//import { allMathRules } from "./math_allrules.mjs";

import { MathEngine, SolveChange,
  SolveTreeNode, Value, Fraction,
  precedence} from "./math_engine.mjs";

import { MathRuleBase, createTypeCheck,
         getValue, allMathRules } from "./math_rule_base.mjs";


class FractionRuleBase extends MathRuleBase {
  _replaceFraction(args, newFrac, oldFracNode) {
    const newChild = new SolveTreeNode(
      oldFracNode.astNode, newFrac, oldFracNode.depth,
      oldFracNode.expression, oldFracNode.equation);
    newChild.type = 'fraction';
    oldFracNode.parent.replaceChild(newChild, oldFracNode);

    const change = new SolveChange(
      newChild, this, oldFracNode, null, null);
    args.changes.push(change);

    return newChild;
  }
}

class SimplifyMulDivFractions extends FractionRuleBase {
  constructor() {
    super(`
    Simplifies fractions in multiplications and divisions
    ie: 2/6 -> 1/3`,
    precedence.MulAndDiv,
    ['mul','div','expression']);
  }

  run(node, args) {
    let hasChanged = false;
    const fractions = [];
    if (node.left?.type === 'fraction') fractions.push(node.left);
    if (node.right?.type === 'fraction') fractions.push(node.right);

    for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
      fractions.forEach((frac, i, arr) => {
        if ((frac.value.value().denominator % prime) === 0 &&
            (frac.value.value().numerator % prime) === 0)
        {
          hasChanged = true;
          arr[i] = this._replaceFraction(args, frac, prime);
        }
      });
    }

    return hasChanged;
  }

  _replaceFraction(args, fracNode, prime) {
    const newFrac = new Fraction(
      fracNode.value.value().numerator / prime,
      fracNode.value.value().denominator / prime);
    return super._replaceFraction(args, newFrac, fracNode)
  }
}
allMathRules.push(SimplifyMulDivFractions);


class MulDivFractionConstants extends FractionRuleBase {
  constructor() {
    const operCb = {
      div: null,
      mul: (lVlu, rVlu) => new Fraction(
        lVlu.numerator * rVlu.numerator,
        lVlu.denominator * rVlu.denominator)
    }
    super(`
    Square root a constant √xx or nthRoot ie: 3√xx.
    ie: √25 = 5 or 3√75 = 5
    `, precedence.MulAndDiv, Object.keys(operCb));

    this.typeChk = createTypeCheck(['fraction']);
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
    if (node.type === 'div')
      return this._runBinary(node, args, null, this._div.bind(this));
    return this._runBinary(node, args, this._operCb, null);
  }

  _div(lChild, rChild, node, args) { // eslint-disable-line unused-variable
    // flip num. and denom. and convert to multiplication

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

class SimplifyAddSubFractions extends FractionRuleBase {
  constructor() {
    super(`
    Simplifies fractions in additions and subtractions
    ie: 2/6 -> 1/3`,
    precedence.AddAndSub,
    ['add','sub']);
  }

  run(node, args) {
    const fractions = [], originals = [];
    // scan all of expression children to find all fractions
    const walk = (n) => {
      if (n.type === 'expression') return;
      if (n.left) walk(n.left);
      if (n.right) walk(n.right);
      if (n.type === 'fraction') {
        fractions.push(n);
      }
    }
    walk(node.left);
    if (node.right) walk(node.right);

    let usePrime = 0, hasChanged = false;
    do {
      usePrime = 0;
      for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
        fractions.forEach((frac, i, arr) => {
            console.log(frac.value, prime)
          if ((frac.value.value().denominator % prime) === 0 &&
              (frac.value.value().numerator % prime) === 0)
          {
            usePrime = prime;
            hasChanged = true;
            arr[i] = this._replaceFraction(args, frac, prime);
            originals[i] = frac;
          }
        });
      }
    } while(usePrime);

    /*if (hasChanged) {
      fractions.forEach((f, i)=> {
        args.changes.push(new SolveChange(f, this, originals[i]));
      });
    }*/
    return hasChanged;
  }

  _replaceFraction(args, fracNode, prime) {
    const newFrac = new Fraction(
      fracNode.value.value().numerator / prime,
      fracNode.value.value().denominator / prime);
    return super._replaceFraction(args, newFrac, fracNode)
  }
}
//allMathRules.push(SimplifyAddSubFractions);
