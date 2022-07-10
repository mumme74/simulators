"use strict";

import { precedence} from "./math_engine.mjs";

import { MathRuleBase, createTypeCheck,
        getValue, allMathRules  } from "./math_rule_base.mjs";



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
allMathRules.push(AddSubAlgebraicTerms);



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
allMathRules.push(MulAlgebraicTerms);
