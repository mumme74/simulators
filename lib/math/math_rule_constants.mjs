"use strict";

import { MathEngine, Value, Fraction, fpRound,
         precedence} from "./math_engine.mjs";

import { SolveTreeNode, SolveChange, SolveVisitArgs } from "./math_solutions.mjs";


import { MathRuleBase, createTypeCheck,
         getValue, allMathRules} from "./math_rule_base.mjs";


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
allMathRules.push(AddSubConstants);

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
    return this._runBinary(node, args, this._operCb, null, "Factor");
  }
}
allMathRules.push(MulDivConstants);

class ExpConstants extends MathRuleBase {
  constructor() {
    const operCb = {
      exp: (lVlu, rVlu) =>
        fpRound(Math.pow(lVlu, rVlu)),
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
    return this._runBinary(node, args, this._operCb, null, "Exponent");
  }
}
allMathRules.push(ExpConstants);

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
      return this._runBinary(node, args, this._operCb, null, "xRoot of");
    return this._runUnary(node, args, this._operCb, null, "root of");
  }
}
allMathRules.push(RootConstants);


