"use strict";

import { MathEngine, precedence } from "./math_engine.mjs";
import { SolveTreeNode, SolveChange, SolveVisitArgs } from "./math_solutions.mjs";
import { ValueBase } from "./math_values.mjs";


import { MathRuleBase, allMathRules  } from "./math_rule_base.mjs";

class AlgebraicTerm {
  constructor(rootNode) {
    this.rootNode = rootNode;
    this.mulNode = rootNode;
    this._scanRoot(rootNode);
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
  _scanRoot(node) {
    if (node.type === 'signed') {
      this.signedNode = node;
      this.mulNode = node = node.left;
    }
    this.variables = {};
    this.name = '';

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
        if (this.variables[name] === undefined) {
          this.variables[name] = {node: n, cnt:0};
          if (!this.firstVarNode)
            this.firstVarNode = n;
        }
        this.variables[name].cnt++;
        this.name += name;
        return name;

      } else if (n.parent.type === 'mul' &&
                  ['integer','float','fraction'].indexOf(n.type) > -1)
      {
        // read coeficient
        const vlu = n.value.value();
        this.coeficient = this.signedNode ? -vlu : vlu;
        this.coeficientNode = n;
      }
      return res;
    }
    walk(node);

    if (!this.coeficient)
      this.coeficient = this.signedNode ? -1 : 1;
  }

  isNegative() { return this.coeficient < 0; }

  operate(rightTerm) {
    if (rightTerm instanceof AlgebraicTerm) {
      if (rightTerm.name === this.name) {
        const operation = rightTerm.rootNode.parent.type;
        switch(operation) {
        case 'sub': this.coeficient -= rightTerm.coeficient; break;
        case 'add': this.coeficient += rightTerm.coeficient; break;
        case 'mul':
          Object.entries(rightTerm.variables).forEach(([v, vlu])=>{
            if (this.variables[v]) this.variables[v].cnt++;
            else this.variables[v] = {node:v.node, cnt:v.cnt};
          })
          this.coeficient *= rightTerm.coeficient;
          break;
        //case 'div':
        default: return false;
        }

        return true;
      }
    }
    return false;
  }

  removeFromTree(rule, args, operator) {
    const change = new SolveChange("Remove term",
      this.rootNode, rule, this.rootNode, operator);
    args.changes.push(change);
    this.rootNode.parent.removeChild(this.rootNode);
  }

  recreateBranch(atDepth) {
    let root, node;
    if (this.coeficient < 0) {
      node = root = new SolveTreeNode(
        (this.signedNode || this.rootNode).astNode,
        'signed', null, atDepth++, this.rootNode.expression,
        this.rootNode.equation);
    }
    // create the root mul node
    node = new SolveTreeNode(
      this.mulNode.astNode, 'mul', null, atDepth,
      this.mulNode.expression, this.mulNode.equation);
    if (!root) root = node;
    else root.addLeft(node);

    // add coefficient
    if (this.coeficient === 0)
      return null; // cancels out

    this._recreateCoeficient(node, atDepth);

    // a single 'x' should not have a mul unless it has a coenficient
    const vars = Object.keys(this.variables);
    if (!node.left && vars.length === 1) {
      root.removeChild(node);
      node = root;
    }

    // add the variables
    return this._recreateVars(node, atDepth) > 0 ? root : null;
  }

  _recreateCoeficient(node, atDepth) {
    if (this.coeficient !== 1 && this.coeficient !== -1) {
      const vlu = ValueBase.create(this.coeficient < 0 ?
        -this.coeficient: this.coeficient);
      node.addLeft(
        new SolveTreeNode(
          (this.coeficientNode||this.mulNode).astNode,
          vlu.type, vlu, atDepth+1, this.mulNode.expression,
          this.equation));
    }
  }

  _recreateVars(node, atDepth) {
    let varCnt = 0;
    for(const v of Object.keys(this.variables)) {
      const n = this.variables[v];
      if (n.cnt > 0) {
        varCnt++;
        const varNode = this._recreateVar(n, atDepth);
        if (!node.left) node.addLeft(varNode);
        else if (!node.right) node.addRight(varNode);
        else {
          const n = node.clone();
          n.addLeft(node.right);
          node.addLeft(n);
          node = n;
        }
      }
    }
    return varCnt;
  }

  _recreateVar(n, atDepth) {
    const varNode = new SolveTreeNode(
      n.node.astNode, 'variable', n.node.value.clone(),
      atDepth+1+(n.cnt > 1), n.node.expression, n.node.equation);
    if (n.cnt > 1) {
      const expNode = new SolveTreeNode(
        n.node.astNode, 'exp', null, atDepth+1,
        n.node.expression, n.node.equation);
      expNode.addLeft(varNode);

      const exponent = new SolveTreeNode(
        n.node.astNode, 'integer', ValueBase.create(n.cnt), atDepth+2,
        n.node.expression, n.node.equation);

      expNode.addRight(exponent);
      return expNode;
    }
    return varNode;
  }
}

// -----------------------------------------------------


class AlgebraicBase extends MathRuleBase {
  /*_isAlgebraicFactor(node) {
    if (node.type === 'signed')
      node = node.left;
    return node.type === 'variable' ||
           node.left?.type === 'variable' ||
           node.right?.type === 'variable';
  }*/

  _algebraicTermsOfTypeInExpr(node, termTypes) {
    const addSubTerms = this._nodesOnDepth(node, node.expression.depth+1, termTypes);
    const terms = [];

    for (const term of addSubTerms) {
      for (const node of [term.left, term.right]) {
        if (node && MathEngine.scanAlgebraicTerm(node))
          terms.push(new AlgebraicTerm(node));
      }
    }
    return terms;
  }

  _doAllWithSamefactor(matchingFactors, args, description, findIndexCb) {
    let prevTerm;
    while (matchingFactors.length) {
      const left = matchingFactors.shift();
      if (!left.rootNode.parent?.parent)
        continue;

      const idx = matchingFactors.findIndex(findIndexCb(left));
      const right = matchingFactors[idx];
      if (!right) {
        this._removeNode(left.rootNode.parent, args);
      } else {

        if (--right.cntMul === 0) matchingFactors.splice(idx,1);

        const newTerm = this._doChangesToTree(
          left, right, args, prevTerm);

        if (!newTerm) {// when it has canceled out
          matchingFactors.reduce((arr, vlu, i)=>{
            if (vlu===left.name)
              arr.splice(i,1);
            return arr;
          }, matchingFactors);
        }

        prevTerm = left;
      }
    }
    return prevTerm !== undefined;
  }

  _doChangesToTree(leftTerm, rightTerm, args, prevTerm, description) {
    if (leftTerm.operate(rightTerm)) {
      const oldLeft = args.engine.cloneTree(leftTerm.rootNode);
      const oldRight = args.engine.cloneTree(rightTerm.rootNode);

      const newTermNode =
        leftTerm.recreateBranch(leftTerm.rootNode.depth);//-1);
      let operator = rightTerm.rootNode.parent.type;
      if (operator.type === 'signed') operator = operator.parent;

      const desc = leftTerm.coeficient !== 0 ? description : "Terms cancel out";
      const right = rightTerm.rootNode.parent.parent.popChild(rightTerm.rootNode.parent);
      if (leftTerm.coeficient !== 0) {
        this._replaceNode(
          newTermNode, leftTerm.rootNode, args, desc,
          operator, prevTerm?.name !== leftTerm.name);
      } else { // it cancels out
        this._removeNode(leftTerm.rootNode, args, desc, operator);
      }
      SolveChange.push(args, desc, newTermNode, this, oldRight, operator);

      return newTermNode;
    }
  }
}

/*
it executes right to left
viewed as standing from root, down is always right here
'\' is right
'->' is left

RIGHT                                            LEFT
input 2a+3ab-4a+2ab
expr -> sub -> sub -> add -> mul -> 2
          \      \      \      \ -> a
           \      \     mul -> mul -> 3
            \      \      \     \ -> a
             \      \      \ -> b
              \     mul -> 4
               \      \-> a
               mul -> mul -> 2
                 \      \ -> a
                  \ -> b

˅ = insert
^ = pop
^˅ = replace

first step, pop  sub: 4a and replace 2a with -4a
 replace add with result of 2a-4a = -2a

expr -> sub -> ^ -> add -> ^˅signed -> mul -> 2

tree now looks like this:  (2a+3ab-2ab)
RIGHT                                           LEFT
expr -> sub -> add -> signed -> mul -> 2
          \      \                \ -> a
           \      \
            \     mul -> mul -> 3
             \      \      \ -> a
              \      \ -> b
              mul -> mul -> 2
                \      \ -> a
                 \ -> b

sec change: pop first sub
  replace sub with result of +3ab - 2ab = ab
      +3ab-2ab
expr  -> ^ -> add -> signed -> mul -> 2
               \
                \^˅ replace here

tree now looks like: (-2a+ab)
RIGHT                                    LEFT
expr -> add -> signed -> mul -> 2    it evals left to right
           \               \ -> a    is this diagram left and dight are reversed
           mul -> a
             \ -> b
not possible to reduce any further
*/

// -----------------------------------------------------

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
RIGHT                                         LEFT
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

    let factors = this._algebraicTermsOfTypeInExpr(node, ['add','sub']);

    if (!factors.length) return;

    factors = factors.reduce((arr, vlu)=>{
      const o = arr.find(id=>id.name === vlu.name && id !== vlu);
      if (!o) return arr;
      if (o.cntMul) o.cntMul++;
      else o.cntMul = 1;
      return arr;
    }, factors).filter(f=>f.cntMul > 0);

    const findIndexCb = (left)=>{
      return f=>f.name===left.name;
    }

    return this._doAllWithSamefactor(factors, args, "Sum terms", findIndexCb);
  }
}
allMathRules.push(AddSubAlgebraicTerms);


class MulDivAlgebraicTerms extends AlgebraicBase {
  constructor() {
    super(`
    Multiplies or divides 2 or more factors together.
    ie: x * 2x becomes 2x^2
    `,
    precedence.MulAndDiv,
    ['mul','div']);
  }
  /*
  input expression: 2x * 3x -> 6x^2
  input:
  factor -> mul -> mul -> 2
             \      \  -> x
             mul -> 3
               \ -> x

  output:
  factor -> mul -> 2
             \
             exp -> x
               \ -> 2
  */
  run(node, args) {
    if (!node.expression.isAlgebraic)
      return false;
    if (node.depth !== node.expression.depth+1)
      return false;

    let factors = this._algebraicTermsOfTypeInExpr(node, ['mul','div']);

    if (factors.length < 2) return;

    factors = factors.reduce((arr, vlu)=>{
      const o = arr.find(id=>id.name === vlu.name && id !== vlu);
      if (!o) return arr;
      if (o.cntMul) o.cntMul++;
      else o.cntMul = 1;
      return arr;
    }, factors).filter(f=>f.cntMul > 0);

    const findIndexCb = (left)=>{
      return f=>f.name===left.name;
    }

    return this._doAllWithSamefactor(factors, args, "Factor terms", findIndexCb);
  }
}
allMathRules.push(MulDivAlgebraicTerms);
