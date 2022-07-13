import { AstTreeNode } from "../parser/parser.mjs";
import { Value } from "./math_engine.mjs";
import { MathRuleBase } from "./math_rule_base.mjs";

/**
 * This is a node in a Solve tree. initially it is a copy of the AST
 * During solving it can shrink with the reductions we have made
 * Or it can grow, if we are factorizing an expression
 */
 export class SolveTreeNode extends AstTreeNode {
  /**
   * @param {AstTreeNode} ast The Ast treenode that constructed this node
   * @param {string|null} type The type of this node, if null use astNode.type
   * @param {Value | null} value The value this node has, if not a value node it has no value
   * @param {number} depth The distance from root this node has
   * @param {SolveTreeNode | null} expression The expression this node belongs to
   * @param {SolveTreeNode | null} equation The equation this node belongs to, in case of equation system we might have more than one
   */
  constructor(ast, type,  value, depth, expression, equation) {
    super(ast?.cstNode, null, type || ast?.type, ast?.cstNode?.tok,);
    this.astNode = ast;
    this.depth = depth;
    this.equation = equation;
    this.expression = expression;
    this.value = value || null;
  }

  runStep(args, prec) {
    if (this.subExpressions) {
      for (const subExpr of this.subExpressions) {
        subExpr.left.runStep(args, prec);
        if (subExpr.right) subExpr.right.runStep(args, prec);
      }
    }
    const isSubExpr = this.expression?.subExpressions.indexOf(this) > -1;
    if (this.left && !isSubExpr)
      this.left.runStep(args, prec);
    if (this.right && !isSubExpr)
      this.right.runStep(args, prec);
    args.engine.runRulesOnNode(this, prec, args);
  }

  asObject() {
    const superAsObject = super.asObject();
    if (this.value instanceof Value)
      superAsObject.value = this.value.toString();
    return {
      depth:this.depth, ...superAsObject,
    };
  }

  clone() {
    const node = new SolveTreeNode(
      this.astNode, null, this.value, this.depth,
      this.expression, this.equation);
    node.parent = this.parent;
    // we don't want to copy left and right
    return node;
  }

  toString() {
    const ops = {
      eq:'=',sub:'-',add:'+',div:'/',root:'√',
      nthRoot:'√',exp:'^'};
    const pre = { group: '(', signed:'-', equal: '=' },
          post = { group: '}' };
    const res = [];
    if (pre[this.type])  res.push(pre[this.type]);
    if (this.type === 'mul') {
      if (this.left) res.push(this.left.toString());
      if (this.left?.type !== 'variable' ||
          this.right?.type !== 'variable')
        res.push(this.value);
      if(this.right) res.push(this.right.toString());
    } else {
      if (this.left)       res.push(this.left.toString());
      if (this.value?.value) res.push(this.value?.value().toString());
      else if (ops[this.type])
        res.push(ops[this.type]);
      if (this.right)      res.push(this.right.toString());
    }

    if (post[this.type]) res.push(post[this.type]);
    return res.join('');
  }
}


// ------------------------------------------

/**
 * Stores info about a change done during this step
 * A single change can be 1a-2a+3a it has 3 input nodes,
 *  'add' as operator and a result of 2a
 * @prop {string}        description What this change is about
 * @prop {SolveTreeNode} resultNode The node that triggered this change
 * @prop {MathRuleBase}  changeRule The math rule that did this change
 * @prop {Array.<SolveTreeNode>} inputNodes The nodes used as input to this change
 * @prop {string}        operator The operator used to calculate resultNode
 */
export class SolveChange {
  /**
   * Store the changes made by one rule on one step on one node
   * @param {string}        description What this change is about
   * @param {SolveTreeNode} resultNode The node that triggered this change
   * @param {MathRuleBase}  changeRule The Math rule that did the change
   * @param {Array.<SolveTreeNode> | SolveTreeNode} inputNodes The original node
   * @param {string}        operator The Operator used to calculate resultNode
   */
  constructor(description, resultNode, changeRule, inputNodes, operator)
  {
    this.resultNode = resultNode;
    this.operator = operator;
    this.description = description;
    this.changeRule = changeRule;
    this.inputNodes = Array.isArray(inputNodes) ?
      [...inputNodes] : [inputNodes];
  }

  /**
   * Pushes new inputNodes onto last change or create a new Change if
   * any of description, operator or changeRule differ.
   * @param {SolveVisitArgs} args The argument passed to rule
   * @param {string}         description A descption of what this change is about
   * @param {SolveTreeNode}  resultNode The result of operation is in this node, subsequent calls replaces this node
   * @param {MathRuleBase}   changeRule The rule that created this change
   * @param {Array.<SolveTreeNode> | SolveTreeNode} inputNodes The node/s to push onto change
   * @param {string}         operator The operator that created this change, such as add or subtract
   * @param {boolean}       [forceNew] If true it creates a new SolveChange regardless
   * @returns {SolveChange} The last SolveChange that recieved these inputnodes
   */
  static push(args, description, resultNode, changeRule, inputNodes, operator, forceNew = false) {
    const lastChange = args.changes[args.changes.length-1];
    if (lastChange) {
      if (lastChange.description === description &&
          lastChange.operator === operator &&
          lastChange.changeRule === changeRule &&
          !forceNew)
      {
        lastChange.resultNode = resultNode;
        inputNodes = Array.isArray(inputNodes) ? inputNodes : [inputNodes];
        lastChange.inputNodes.push(...inputNodes);

        return lastChange;
      }
    }

    const change = new SolveChange(
      description, resultNode, changeRule, inputNodes, operator);
    args.changes.push(change);
    return change;
  }
}

/**
 * A class that gets passed to MathRules, rules can append changes and ref Math engine
 * @prop {MathEngine} engine The MathEngine instance
 * @prop {Array.<SolveChange>} changes The chnages currently done in this step
 */
export class SolveVisitArgs {
  /**
   * Passed as argument to all math rules, stores all changes made during one step
   * @param {MathEngine} engine Reference to the math engine that owns this tree
   * @param {Array.<SolveChange>} changes Changes made during this step
   */
  constructor(engine, changes){
    this.engine = engine;
    this.changes = changes;
  }

  /**
   * Checks if we have changes
   * @returns {boolean} True if we have changes done already in this step
   */
  hasChanges() {
    return this.changes.length > 0;
  }
}

