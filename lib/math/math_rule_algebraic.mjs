"use strict";

import { MathEngine, precedence, SolveChange, SolveTreeNode, Value} from "./math_engine.mjs";

import { MathRuleBase, createTypeCheck,
        getValue, allMathRules  } from "./math_rule_base.mjs";



class AlgebraicBase extends MathRuleBase {

  _isAlgebraicFactor(node) {
    if (node.type === 'signed')
      node = node.left;
    return node.type === 'variable' ||
           node.left?.type === 'variable' ||
           node.right?.type === 'variable';
  }

  /*
  scans a node, returns all variables
  walk left to find coeficient 2a or 2ab

  2a = mul -> a
        \ --> 2

  2abc mul -> mul -> mul -> c
        \      \      \ --> b
         \      \ --> a
          \ --> 2
   */
  _scanNodeFactor(node, vars = {}) {
    if (node.type === 'signed') {
      vars._negative = true;
      vars._negativeNode = node;
      node = node.left;
    }
    let firstVarNode;

    const walk = (n)=>{
      let res;
      if (!n || n.expression !== node.expression ||
          ['variable','mul','integer','float','fraction']
            .indexOf(n.type) < 0)
      {
        return;
      }
      res = walk(n.left);
      res = walk(n.right);
      if (n.type === 'variable') {
        const name = n.value.value();
        if (vars[name] === undefined) {
          vars[name] = {node: n, cnt:0};
          if (!firstVarNode) firstVarNode = n;
        }
        vars[name].cnt++;
        return name;

      } else if (n.parent.type === 'mul' &&
                 ['integer','float','fraction'].indexOf(n.type) > -1)
      {
        const vlu = n.value.value();
        vars._coeficient = vars._negative ? -vlu : vlu;
        vars._coeficientNode = n;
      }
      return res;
    }
    walk(node);

    vars.firstVarNode = firstVarNode;
    if (!vars._coeficient)
      vars._coeficient = vars._negative ? -1 : 1;

    return vars;
  }
}

class AddSubAlgebraicTerms extends AlgebraicBase {
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

    const factors = [];

    const addSubTerms = this._nodesOfTypeInExpr(node, ['add','sub']);

    for (const term of addSubTerms) {
      for (const node of [term.left, term.right]) {
        if (node && this._isAlgebraicFactor(node)) {
          const factor = this._scanNodeFactor(node);
          factors.push({vars: factor,
            node, coef: factor._coeficient || 1,
            name: Object.keys(factor).filter(k=>k.length===1).join('')
          });
        }
      }
    }

    factors.reduce((arr, vlu)=>{
      const o = arr.find(id=>id.name === vlu.name && id !== vlu);
      if (!o) return;
      if (o.cntMul) o.cntMul++;
      else o.cntMul = o.vars[vlu.name].cnt;
      return arr;
    }, factors);

    this._doAllWithSamefactor(factors.filter(f=>f.cntMul > 0), args);
  }

  _doAllWithSamefactor(matchingFactors, args) {
    while (matchingFactors.length) {
      const left = matchingFactors.shift();
      if (!left.node.parent?.parent)
        continue;

      const idx = matchingFactors.findIndex(f=>f.name===left.name);
      const right = matchingFactors[idx];
      if (!right) {
        this._removeNode(left.node.parent, args);
      } else {

        if (--right.cnt === 0) matchingFactors.splice(idx,1);

        const newOper = this._exec(left, right, args);
        if (!newOper) // when it has canceled out
          matchingFactors.reduce((arr, vlu, i)=>{
            if (vlu===left.name) arr.splice(i,1);
          });

      }
    }
  }

  _calcCoeficient(leftScan, rightScan) {
    const rightOperNode = rightScan.node.parent;

    let shouldAdd = rightOperNode.type === 'add';

    return shouldAdd ? leftScan.coef + rightScan.coef:
      leftScan.coef - rightScan.coef;
  }

  _exec(leftScan, rightScan, args) {
    const coef = this._calcCoeficient(leftScan, rightScan);

    this._removeNode(rightScan.node, args);
    if (coef === 0) { // they cancel each other out
      this._removeNode(leftScan.node.parent, args);
      return;
    }

    let newOper = leftScan.node.parent.clone();
    newOper.type = 'mul';
    const oldBranch = args.engine.buildSolveTree(leftScan.node);
    args.changes.push(new SolveChange(newOper, this, oldBranch));
    leftScan.node.parent.parent.replaceChild(
      newOper, leftScan.node.parent);

    newOper = this._signedNode(newOper, coef, leftScan);

    this._coeficientNode(newOper, leftScan, coef);
    return newOper;
  }

  _signedNode(newOper, coef, leftScan) {
    const varNode = leftScan.vars.firstVarNode;
    if (coef < 0 && !leftScan.vars._negative) {
      const sign = new SolveTreeNode(
        varNode.astNode, '-', varNode.depth,
        varNode.expression, varNode.equation);
      sign.type = 'signed';
      sign.addLeft(varNode);
      newOper.addLeft(sign);
      newOper = sign;
    } else if (coef >= 0 && leftScan.vars._negative) {
      newOper.addLeft(varNode);
    }
    return newOper;
  }

  _coeficientNode(newOper, leftScan, coef) {
    let varNode = leftScan.vars.firstVarNode;
    let coefNode = leftScan.vars._coeficientNode;
    if (coef !== 1 && coef !== -1) {
      coefNode = new SolveTreeNode(
        coefNode?.astNode || varNode,
        Value.create(coef < 0 ? -coef : coef),
        newOper.depth+1, varNode.expression, varNode.equation);
      coefNode.type = coefNode.value.type;
      if (leftScan.vars._negative) {
        newOper = new SolveTreeNode(
          varNode.astNode, '*', varNode.depth,
          varNode.expression, varNode.equation);
        newOper.type = 'mul';
      }
      newOper.addLeft(coefNode);
      newOper.addRight(varNode);
      this._moveDepth(varNode, -1 + !!leftScan.vars._negative);
    } else if (coefNode && coef === 1) {
      varNode = coefNode.parent.right;
      newOper.addLeft(varNode);
      coefNode.parent.parent.removeChild(coefNode.parent);
    }
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
