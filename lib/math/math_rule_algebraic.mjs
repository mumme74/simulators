"use strict";

import { MathEngine, precedence, SolveChange, SolveTreeNode, Value} from "./math_engine.mjs";

import { MathRuleBase, createTypeCheck,
        getValue, allMathRules  } from "./math_rule_base.mjs";

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
        //case 'mul':
        //case 'div':
        default: return false;
        }

        return true;
      }
    }
    return false;
  }

  removeFromTree(rule, args) {
    const change = new SolveChange(
      this.rootNode, rule, this.rootNode);
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
    if (this.coeficient !== 1 && this.coeficient !== -1) {
      const vlu = Value.create(this.coeficient < 0 ?
        -this.coeficient: this.coeficient);
      node.addLeft(
        new SolveTreeNode(
          (this.coeficientNode||this.mulNode).astNode,
          vlu.type, vlu, atDepth+1, this.mulNode.expression,
          this.equation));
    }
    // a single 'x' should not have a mul
    const vars = Object.keys(this.variables);
    if (!node.left && vars.length === 1) {
      root.removeChild(node);
      node = root;
    }

    // add the variables
    for(const v of vars) {
      const n = this.variables[v];
      const varNode = new SolveTreeNode(
        n.node.astNode, 'variable', n.node.value.clone(),
        atDepth+1, n.node.expression, n.node.equation);
      if (!node.left) node.addLeft(varNode);
      else if (!node.right) node.addRight(varNode);
      else {
        const n = node.clone();
        n.addLeft(node.right);
        node.addLeft(n);
        node = n;
      }
    }
    return root;
  }
}

// -----------------------------------------------------


class AlgebraicBase extends MathRuleBase {
  _isAlgebraicFactor(node) {
    if (node.type === 'signed')
      node = node.left;
    return node.type === 'variable' ||
           node.left?.type === 'variable' ||
           node.right?.type === 'variable';
  }
}

// -----------------------------------------------------

/*
input 2a+3ab-4a+2ab
expr -> add -> sub -> sub -> mul -> mul -> b
          \      \      \      \      \ -> a
           \      \      \      \ -> 2
            \      \      \ -> mul -> a
             \      \            \ -> 4
              \     mul -> mul -> b
               \      \      \ -> a
                \      \ -> 4
                 mul -> a
                   \ -> 2

first step, pop first add and second sub
 replace add with result of 2a-4a = -2a
      replace.       pop 2nd sub:
expr -> ^ ˅ -> sub -> ^ -> mul -> mul -> b

tree now looks like this:
expr -> signed -> sub -> mul -> mul -> b
          \        \       \      \ -> a
           \        \       \ -> 2
            \       mul -> mul -> b
             \        \      \ -> a
              \        \ -> 4
              mul -> a
                \ -> 2

sec change: pop first sub first rightward mul
  replace sub with result of +3ab - 2ab = ab
                 +3ab  -2ab
expr -> signed -> ^ ˅ -> ^

tree now looks like:
expr -> signed -> mul -> b
           \        \ -> a
           mul -> a
             \ -> 2
not possible to reduce any further
*/

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

    let factors = [];

    const addSubTerms = this._nodesOfTypeInExpr(node, ['add','sub']);

    for (const term of addSubTerms) {
      for (const node of [term.left, term.right]) {
        if (node && this._isAlgebraicFactor(node))
          factors.push(new AlgebraicTerm(node));
      }
    }
    if (!factors.length) return;

    factors.reduce((arr, vlu)=>{
      const o = arr.find(id=>id.name === vlu.name && id !== vlu);
      if (!o) return;
      if (o.cntMul) o.cntMul++;
      else o.cntMul = 1;
      return arr;
    }, factors);

    factors = factors.filter(f=>f.cntMul>0);
    factors.sort((a,b)=>a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

    this._doAllWithSamefactor(factors, args);
  }

  _doAllWithSamefactor(matchingFactors, args) {
    while (matchingFactors.length) {
      const left = matchingFactors.shift();
      if (!left.rootNode.parent?.parent)
        continue;

      const idx = matchingFactors.findIndex(f=>f.name===left.name);
      const right = matchingFactors[idx];
      if (!right) {
        this._removeNode(left.rootNode.parent, args);
      } else {

        if (--right.cntMul === 0) matchingFactors.splice(idx,1);

        const newOper = this._exec(left, right, args);
        if (!newOper) // when it has canceled out
          matchingFactors.reduce((arr, vlu, i)=>{
            if (vlu===left.name) arr.splice(i,1);
            return arr;
          }, matchingFactors);

      }
    }
  }

  _exec(leftTerm, rightTerm, args) {
    if (leftTerm.operate(rightTerm)) {
      const rightRemove =
        rightTerm.rootNode.parent === leftTerm.rootNode.parent ?
          rightTerm.rootNode : rightTerm.rootNode.parent;
      this._removeNode(rightRemove, args);
      const oldBranch = args.engine.buildSolveTree(leftTerm.rootNode);
      const newTermNode = leftTerm.coeficient !==0 ?
        leftTerm.recreateBranch(leftTerm.rootNode.depth-1) : null;
      if (leftTerm.coeficient !== 0)
        this._replaceNode(newTermNode, leftTerm.rootNode.parent, args);
      else
        this._removeNode(leftTerm.rootNode.parent, args);

      return newTermNode;
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
