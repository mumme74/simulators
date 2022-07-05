// a test implementation of parser
// implements a langage VM

import {
  Parser, GrammarParser,
  AstTreeNode, SyntaxTreeNode,
  ActionBase
} from './parser.mjs';

export const simpleLangGrammar =
`keyword     = 'var' | 'if' | 'else' | 'or' | 'and' | 'true'
             | 'false' | 'null' | 'while' | 'function' | 'return';
letter      = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
            | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p'
            | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x'
            | 'y' | 'z' ;
digit       = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7'
            | '8' | '9' ;
fillch      = '_' ;
controlchar = '\\0' | '\\r' | '\\n' | '\\t' | '\\f' ;
symbol      = '(' | ')' | '{' | '}' | '[' | ']' | ';' ;
operator    = '==' | '!=' | '<=' | '>=' | '<' | '>'
            | '!' | '+' | '-' | '*' | '/' | ';' ;
litteral     = { letter | digit | '_' | controlchar } ;
identifier  = ('_' | letter) , [{ letter | digit | '_' }] ;
number      = digit , [{ digit }] ;
whitespace  = ' ' | '\\t' | '\\b';
string      = ? string_sequence ?;

primary     = "true" | "false" | "null"
            | number | string | grouping
            | identifier ;
arguments   = [expression, [{"," , expression }]];
call        = primary, '(', arguments, ')' ;

unary       = [ '-' | '!' ], (call | primary) ;
factor      = unary , [{ ('*'|'/') ,  unary }] ;

(* minus must be checked first because of unary *)
term        = factor , [{ ('-'|'+') , factor}] ;

grouping    = '(', expression , ')' ;

logic_or    = logic_and, [ "or", logic_and ] ;
logic_and   = equality, [ "and", equality ] ;
equality    = comparison, [ ("!=" | "=="), comparison ] ;
comparison  = term, [ ("<" | ">" | "<=" | ">=" ), term ] ;

assignment  = (identifier, '=', expression) ;
parameters  = [ identifier, [{ ',', identifier }]] ;

expression  = assignment | logic_or;
declaration = 'var', (assignment | identifier), [';'];
funcStmt    = 'function', identifier,'(', parameters,')', block ;
retStmt     =  'return', expression, [';'];
ifStmt      = 'if' , grouping, (block | statement), [ elseStmt ] ;
elseStmt    = 'else', (block | statement) ;
whileStmt   = 'while' , grouping, (block|statement) ;
block       = '{', [{ statement }], '}' ;

statement   = declaration | funcStmt | ifStmt | whileStmt
              | retStmt | grouping | (expression, [';']);

ignore      = '\\n' | ';' ;
program     = { ignore | statement } ;
`;

class RuntimeError extends Error {
  constructor(msg, astNode) {
    super(msg);
    this.name = 'RuntimeError';
    this.stack += `\n${this.name}: ${this.message}`;
    for (let n = astNode;  n; n = n.left) {
      if (n.tok?.parseInfo)
        this.stack += ` at line: ${n.tok.parseInfo.line} ` +
                      `col: ${n.tok.parseInfo.col}`;
    }
    let pNfo = astNode?.tok?.parseInfo;

    for(let i = currentFn; i >= 0; --i) {
      const fn = functionStack[i];
      pNfo = fn.declAstNode?.left.left.cstNode.tok?.parseInfo;
      this.stack += `\nat ${fn.name}`
      if (pNfo) this.stack += `, line: ${pNfo.line} col: ${pNfo.col}`;
    }
  }
}

class VMError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'VMError';
  }
}

class Constant {
  constructor(declAstNode, value) {
    switch (declAstNode.type) {
    case 'number':
      this.type = 'number';
      this.value = +value;
      break;
    case 'string':
      this.type = 'string';
      this.value = value.substring(1, value.length-1);
      break;
    default: throw new VMError(
      `Unhandled type: ${declAstNode.type}`);
    }
    this.declAstNode = declAstNode;
  }
}

class Variable {
  constructor(declAstNode, value, type) {
    this.type = type || 'null';
    this.declAstNode = declAstNode;
    this.value = value !== undefined ? value : null;
  }

  assignValue(value) {
    if (value instanceof Variable || value instanceof Constant) {
      this.type = value.type;
      this.value = value.value;
    }else {
      this.type = typeof value;
      this.value = value;
    }
    return this;
  }
}

class NativeFn {
  constructor(parentFn, name, params=[]) {
    this.parentFn = parentFn
    this.name = name;
    this.params = params;
    this.returnVlu = new Variable(null, null, null);
  }

  callFunc(callAstNode) {
    this._readArgs(callAstNode);
  }

  _readArgs(callAstNode){
    const args = [];
    for(let n = callAstNode.right; n; n = n.right) {
      args.push(n.action.visit());
    }
    if (args.length !== this.params.length)
      throw new RuntimeError(`Expected ${this.params.length} arguments`,
                             callAstNode);
    this.caller = functionStack[currentFn];
    args.forEach((a,i)=>this.params[i].assignValue(a));
    this.returnVlu.assignValue(null);
  }
}

class Func extends NativeFn {
  constructor(parentFn, declAstNode, variables=[]) {
    let params = [];
    if (parentFn && declAstNode.right.left.type === 'parameters') {
      for (let n = declAstNode.right.left; n; n = n.right) {
        const node = n.type === 'parameters' ? n.left : n;
        params.push({name:node.left.value, variable:new Variable(node)});
      }
    }

    super(parentFn, declAstNode?.left.left.value, params.map(p=>p.variable));
    this.returnVlu.declAstNode = declAstNode || null;

    // set pointer to block node
    this.blockStart = parentFn ? declAstNode.right.right :declAstNode;

    // push params and variables on this stack
    this.stack = [...params, ...variables];
    this.declAstNode = declAstNode || null;
    this.blockTop = [this.stack.length];
    this.stackStart = this.blockTop[0];
  }

  lookupVariable(name) {
    const top = this.blockTop[this.blockTop.length-1];
    for (let i = top; i >= 0; --i) {
      if (this.stack[i]?.name === name)
        return this.stack[i].variable;
    }

    if (this.parentFn)
      return this.parentFn.lookupVariable(name);
  }

  declareVariable(name, declAstNode, value = null, type = null) {
    const variable = new Variable(declAstNode, value, type);
    this.stack.push({name, variable});
    this.blockTop[this.blockTop.length-1] += 1;
  }

  assignToVariable(name, value, setAstNode) {
    const variable = this.lookupVariable(name);
    if (!variable)
      throw new RuntimeError(`Variable ${name} not found.`, setAstNode);
    return variable.assignValue(value);
  }

  callFunc(callAstNode) {
    super._readArgs(callAstNode);
    functionStack.push(this);
    currentFn++;
    this.blockTop.length = 1;
    this.blockTop[0] = this.stackStart;
    try {
      this.blockStart.action.visit();
    } catch(e) {
      if (e !== 'return_from_function')
        throw e;
    }
  }
}

const functionStack = [];
let currentFn = -1;


// string litteral or number litteral in source
class ConstantExpr extends ActionBase {
  visit() {
    if (this.constant) return this.constant;
    return this.constant = new Constant(
      this.astNode, this.astNode.left.value);
  }
}
class PrimaryExpr extends ActionBase {
  visit() {
    if (this.astNode.left.type === 'terminal') {
      switch(this.astNode.left.value) {
      case 'true': return true;
      case 'false': return false;
      case 'null': return null;
      default:
        throw new VMError('Unhandled terminal type: '+this.astNode.value);
      }
    } else if (this.astNode.left.type === 'identifier') {
      const ident = this.astNode.left.action.visit();
      const curFn = functionStack[currentFn];
      const variable = curFn.lookupVariable(ident.value);
      if (!variable)
        throw new RuntimeError(
          `Variable ${ident.value} not found in current context.`,
          this.astNode);
      return variable;
    }
    return super.visit();
  }
}
class FactorExpr extends ActionBase {
  visit() {
    const lVlu = this.astNode.left.action.visit();
    if (!this.astNode.right) return lVlu;
    const rVlu = this.astNode.right.action.visit();
    const tmp = new Variable(this.astNode);
    switch (this.operator) {
    case '*': return new Variable(this.astNode, lVlu.value * rVlu.value);
    case '/': return new Variable(this.astNode, lVlu.value / rVlu.value);
    default: throw new VMError(
               `Unhandled factor operator ${this.astNode.value}`);
    }
  }
}
class TermExpr extends ActionBase {
  visit() {
    const lVlu = this.astNode.left.action.visit();
    if (!this.astNode.right) return lVlu;
    const rVlu = this.astNode.right.action.visit();
    const tmp = new Variable(this.astNode);
    switch (this.operator) {
    case '+': return new Variable(this.astNode, lVlu.value + rVlu.value);
    case '-': return new Variable(this.astNode, lVlu.value - rVlu.value);
    default: throw new VMError(
               `Unhandled term operator ${this.astNode.value}`);
    }
  }
}
class UnaryExpr extends ActionBase {
  visit() {
    let vlu;
    switch (this.astNode.left.value) {
    case '!':
      vlu = this.astNode.right.action.visit();
      return new Variable(this.astNode, !vlu);
    case '-':
      vlu = this.astNode.right.action.visit();
      return new Variable(this.astNode, -vlu);
    case '+': return this.astNode.right.action.visit();
    default: return this.astNode.left.action.visit();
    }
  }
}
class LogicOrExpr extends ActionBase {
  visit() {
    const left = this.astNode.left.action.visit();
    if (left?.value || !this.astNode.right) return left;
    return this.astNode.right.action.visit();
  }
}
class LogicAndExpr extends ActionBase {
  visit() {
    const left = this.astNode.left.action.visit();
    if (!this.astNode.right) return left;
    const right = this.astNode.right.action.visit();
    return left.value && right.value;
  }
}
class EqualityExpr extends ActionBase {
  visit() {
    const left = this.astNode.left.action.visit();
    if (!this.astNode.right) return left;
    if (this.operator === '==')
      return left.value == this.astNode.right.action.visit().value;
    return left
  }
}
class ComparisonExpr extends ActionBase {
  visit() {
    const left = this.astNode.left.action.visit();
    if (!this.astNode.right) return left;

    const right = this.astNode.right.action.visit();
    switch(this.operator) {
    case '<': return left.value < right.value;
    case '>': return left.value > right.value;
    case '<=': return left.value <= right.value;
    case '>=': return left.value >= right.value;
    default: throw new VMError(`Unknown comparison operator: ${this.astNode.value}`);
    }
  }
}
class AssignmentExpr extends ActionBase {
  visit() {
    const ident = this.astNode.left.action.visit(),
          value = this.astNode.right.action.visit();
    const curFn = functionStack[currentFn];
    return curFn.assignToVariable(ident.value, value.value, this.astNode);
  }
}
class CallExpr extends ActionBase {
  visit() {
    const left = this.astNode.left.action.visit();
    if (!this.astNode.right) return left;
    // it's a function call
    if (left?.type !== 'function')
      throw new RuntimeError(
        `No function named ${left?.value?.value} in scope.`,
        this.astNode);
    left.value.callFunc(this.astNode);
    return left.value.returnVlu;
  }
}
class DeclarationStmt extends ActionBase {
  visit() {
    const identifier = this.astNode.left.left.left.value;
    const curFn = functionStack[currentFn];
    curFn.declareVariable(identifier, this.astNode);
    super.visit();
  }
}
class BlockStmt extends ActionBase {
  visit() {
    const curFn = functionStack[currentFn];
    const top = curFn.blockTop[curFn.blockTop.length-1];
    curFn.blockTop.push(top);
    super.visit();
    curFn.blockTop.pop();
  }
}
class FuncStmt extends ActionBase {
  visit() {
    const curFn = functionStack[currentFn];
    const fn = new Func(curFn, this.astNode, []);
    curFn.declareVariable(fn.name, this.astNode, fn, 'function');
  }
}
class RetStmt extends ActionBase {
  visit() {
    const curFn = functionStack[currentFn];
    if (!curFn.caller)
      throw new RuntimeError("Can't return from script.", this.astNode);
    const retVlu = this.astNode.left?.action.visit();
    curFn.returnVlu.assignValue(retVlu);
    throw "return_from_function";
  }
}
class IfStmt extends ActionBase {
  visit() {
    const compareNode = this.astNode.left,
          statementNode = this.astNode.right.left,
          elseNode = this.astNode.right.right;
    let compare = compareNode.action.visit();
    if (compare instanceof ActionBase)
      compare = compare.value;

    if (compare)
      statementNode.action.visit();
    else if (elseNode.value==='else')
      elseNode.action.visit();
  }
}
class ElseStmt extends ActionBase {
  visit() {
    this.astNode.right.right.left.action.visit();
  }
}
class WhileStmt extends ActionBase {
  visit() {
    const compareNode = this.astNode.left,
          statementNode = this.astNode.right;
    while (compareNode.action.visit()) {
      statementNode.action.visit();
    }
  }
}

// --------------------------------------------

/**
 * Prints to console
 */
class Print extends NativeFn {
  constructor(){
    const params = [new Variable(null, null, 'null')];
    super(functionStack[currentFn], 'print', params);
  }

  callFunc(callAstNode) {
    super._readArgs(callAstNode);
    console.log(this.params[0].value);
  }
}

/**
 * Stores a value in log, can later be used to retrieve program state at this point.
 * Intended use is mostly for testing framework.
 */
class LogVlu extends NativeFn {
  constructor(logStore) {
    const params = [
      new Variable(null, null, 'null'),
      new Variable(null, null, 'null')
    ];
    super(functionStack[currentFn], 'log', params);
    this.logStore = logStore;
  }

  callFunc(callAstNode) {
    super._readArgs(callAstNode);
    this.logStore.push({
      caller:this.caller,
      parseInfo:callAstNode.left.left.left.cstNode.tok.parseInfo,
      key:   this.params[0].value,
      value: this.params[1].value
    })
  }
}

//---------------------------------------------

export class SimpleLang {
  constructor(source) {
    this.logEntries = [];
    this.grmParser = new GrammarParser(simpleLangGrammar, 'program');
    if (source) {
      this.parse(source);
      this.run();
    }
  }

  parse(source) {
    const genInfix = (cst, parser)=>{
      const ast = parser.generateNode(cst);
      ast.action.operator = cst.children[1]?.tok?.str;
      return ast;
    }
    this.parser = new Parser({
      grmParser:this.grmParser,
      source,
      tokenMatches: {
        ...this.grmParser.tokenMatches,
        special_sequence: [
          {n:'string_sequence', cb: (str)=>{
              const res = /^(?:(")(?:\\\1|[^"])*\1|(?:(')(?:\\\2|[^'])*\2))/um.exec(str);
              if (res) return res[0];
          }}
        ]
      },
      dropTerminalsOnAllRules:[
        'var','if','else','or','and','true',
        'false','null','while','function','return',
        '(',')','{','}','*','=','/','+','-','!','==','!=',
        '<','>','<=','>=',';',','
      ],
      flattenRules:['number','identifier','string'],
      actionForRules:{
        string: ConstantExpr, number: ConstantExpr,
        primary: PrimaryExpr, call: CallExpr,
        unary: UnaryExpr, factor:FactorExpr,
        term:TermExpr, logic_or:LogicOrExpr,
        logic_and:LogicAndExpr, equality: EqualityExpr,
        comparison: ComparisonExpr, assignment: AssignmentExpr,
        declaration: DeclarationStmt, retStmt: RetStmt,
        funcStmt: FuncStmt, ifStmt: IfStmt, elseStmt: ElseStmt,
        whileStmt: WhileStmt, block: BlockStmt,
      },
      generateFuncs:{
        term:genInfix, factor:genInfix,
        comparison:genInfix, equality:genInfix
      }
    });
  }

  run() {
    this._initEnvironment();
    this.parser.prgAstRoot.action.visit();
  }

  _initEnvironment() {
    // insert root function
    functionStack.length = 0;
    const rootFn = new Func(null, this.parser.prgAstNode);
    rootFn.name = "<script>";
    functionStack.push(rootFn);
    currentFn = 0;
    // insert builtins

    rootFn.declareVariable(
      'log', null, new LogVlu(this.logEntries), 'function');
    rootFn.declareVariable(
      'print', null, new Print(), 'function');
  }
}
