"use strict";

/**
 * @module Parser
 */

// this parser follows extended backus naur form
// https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

/**
 * TreeNode for CST tree
 */
export class SyntaxTreeNode {
  /**
   * Construct a new CST TreeNode
   * @param {SyntaxTreeNode} parent the parent to this node, automatically adds itself to parent.children
   * @param {string} type The type of node
   * @param {{str:string,type:string,parseInfo:ParseInfo}} tok The token from the lexer
   */
  constructor(parent, type, tok) {
    this.parent = parent;
    parent?.children.push(this);
    this.type = type;
    this.tok = tok;
    this.children = [];
  }

  /**
   * Adds child (or children) to self
   * @returns {SyntaxTreeNode} this
   */
  addChild(child) {
    const children = Array.isArray(child) ? child : [child];
    for (const ch of children) {
      if (ch && ch !== true) {
        this.children.push(ch);
        ch.parent = this;
      }
    }
    return this;
  }

  /**
   * Removes itself from parent
   * @returns {boolean} returns true for chaining things
   */
  remove() {
    const idx = this.parent?.children.indexOf(this);
    if (+idx > -1) this.parent?.children.splice(idx,1);
    return true;
  }

  /**
   * Returns this and all children as a flat array
   * @returns {Array.<SyntaxTreeNode>} this and all children as a flat array
   */
  flat() {
    return [this, ...this.children.flatMap(c=>c.flat())];
  }

  /**
   * Recreates source, combine all this and childrens tok.str as a javascript object
   * @param {string} [endStmtCh] The character that ends a statement
   * @returns {string} All childrens token strings combined
   */
  toSource(endStmtCh = ';') {
    return [
      this.tok?.str,
      this.tok?.str === endStmtCh ? '\n' : '', // new line onn endStmt
      ...this.children.map(c=>c.toSource(endStmtCh))
    ].join('');
  }

  /**
   *  Gets concatination of all this and childrens token string from source
   * @returns {string} the tokens strings combined
   */
  tokString() {
    return this.flat().map(c=>c?.tok?.str).join('');
  }
}

/**
 *  The Ast node in a AST tree
 */
export class AstTreeNode {
  /**
   * Construct a new AST node
   * @param {AstTreeNode} [parent] The parent this leaf belong to
   * @param {SyntaxTreeNode} cstNode The syntax node for this node
   * @param {Object} prod Object that is associated with this node, action to call
   * @param {string} type The name of this type
   * @param {string} [value] The value of this node in source such as strings, identifier or numbers.
   */
  constructor(parent, cstNode, prod, type, value = '') {
    this.parent = parent;
    this.type = type;
    this.value = value;
    this.cstNode = cstNode;
    this.prod = prod;
    if (prod && !prod.grmAstNode) prod.grmAstNode = this;
  }

  /**
   * Returns an array with all nodes connected to the dir direction
   * @param  {string} dir Direction to walk to, must be 'left' or 'right'
   * @returns {Array.<AstTreeNode>} Array with all nodes in dir direction
   */
  asList(dir) {
    const res = [];
    let n = this;
    do {
      res.push(n);
    } while(n = n[dir]);
    return res;
  }

 /**
  * @typedef {Object} AstAsObject
  * @property {string} type The name of this type
  * @property {string} [value] The value of this node in source such as strings, identifier or numbers.
  * @property {AstAsObject|undefined} left The left child obj
  * @property {AstAsObject|undefined} right The right child obj
  */

  /**
   * Returns this node and children as a javascript object
   * @returns {AstAsObject} This branch as js object
   */
  asObject() {
    const res = {};

    const recurse = (n)=>{
      if (!n) return;
      return {
        type: n.type,
        value: n.value,
        left: recurse(n.left),
        right: recurse(n.right)
      };
    }
    return recurse(this);
  }
}

/**
 * Parse info line and column from source file
 */
export class ParseInfo {
  /**
   *  Construct a new ParseInfo
   * @param {number} [line] The line that generated this
   * @param {number} [col] The column in the line that generated this
   */
  constructor(line = -1, col = -1) {
    this.line = line;
    this.col = col;
  }
}

// ---------------------------------------------

/**
 * A special SyntaxError for grammar files
 * @property {ParseInfo} [parseInfo] The parseInfo where this error occured
 * @property {string} name The name of this error (GrammarSyntaxError)
 */
export class GrammarSyntaxError extends SyntaxError {
  /**
   * Construct a new GrammarSyntaxError
   * @param {string} [message] The message for this error
   * @param {ParseInfo} [parseInfo] The parseInfo for this error
   */
  constructor(message = '', parseInfo = new ParseInfo()) {
    super(`${message} at line ${parseInfo.line} pos ${parseInfo.col}`);
    this.parseInfo = parseInfo;
    this.name = "GrammarSyntaxError";
  }
}

/**
 * Tokenizes a source string with given tokens,
 * result of this operation used by parser
 * @property {Array.<string>} lines The source lines detected during scan
 * @property {Array.<token>} tokens The tokens created by the scan
 */
export class Lexer {
  lines = [];
  tokens = [];
  _pos = -1;
  _biggestAcceptPos = -1;
  _stackPos = [];

  /**
   * @typedef {Object.<string, TokenSearch>} TokenMatch A object containing all Tokens and how to match them against source code
   *                   string key key The unique key (name) of the token
   * @typedef {Object} TokenSearch
   * @property {string} [s] Match against this string
   * @property {RegExp} [r] Matach agains this regex
   * @property {boolean} [ignore] If true this token is not inserted into tokens
   */

  /**
   * Constructor for Lexer class
   * @param {Array.<TokenMatch>} tokenMatches match against these, Token gets the name of key, matches against value of key
   * @param {string} source The source code to tokenize
   * @param {Error} [errorType=SyntaxError] The type error to throw when syntax error occurs
   * @param {Array.<string>} [filterOutTokens] When navigating, filter out these tokens. Tokens can still be accessed from this.tokens
   * @param {RegExp} [newRowRegex] A custom new line regexp matcher, default unescaped newline
   * @param {RegExp} [ignoreRegex] A custom ignore char regexp, default whitespace
   */
  constructor({
     tokenMatches, source,
     errorType = SyntaxError,
     filterOutTokens = [],
     newRowRegex = /^[^\\ \t\r\n]?\r?\n/,
     ignoreRegex = /^(?:[^\S\\]?(?:\r|[ \t\f]+)|\\)/},
     states = [{name: "stringState",
       open: /^['"]/, // /^(?:(?!\\)|(?:\\\\)|[^'"\\]*)['"]/,
       close: /^['"]/, // /^(?:(?!\\)|(?:\\\\)|[^'"\\]*)['"]/,
       len:1}]
  ) {
    this.tokenMatches = tokenMatches;
    this.source = source;
    this.errorType = errorType;
    this.filterOutTokens = filterOutTokens;

    const tokenMatchEntries = Object.entries(this.tokenMatches);

    const addToken = (token, tokStr, b) => {
      this.tokens.push({
        str:tokStr, type:token,
        parseInfo: new ParseInfo(this.lines.length+1, b - beginLine)
      });
    }

    // tokenize
    const curStates = [];
    let tokStr, beginLine = 0, res, escaped = false;
    for (let i = 1, b = 0; i <= source.length; ++i) {
      const dbgStr = this.source.substring(b, i);
      states.forEach(s=>{
        const cs = curStates[curStates.length-1];
        if (this.source[b] === '\\') {
          escaped != escaped;
        } else if (cs?.n === s.name) {
          if (cs.b <= b-s.len &&
              s.close.test(this.source.substring(b-s.len,b)))
            curStates.pop();
        } else if (!escaped &&
                   s.open.test(this.source.substring(b,b+s.len)))
          curStates.push({n:s.name,b:b+s.len}); // don't close on opener
      });

      if (tokenMatchEntries.find(([token, m])=>{
        if (m.state && !curStates.find(s=>s.n===m.state))
          return; // handles states such as open and close string ' '
        if (m.r) {
          res = m.r.exec(this.source.substr(b));
          if (res) {
            if (res.length > 1)
              tokStr = res.slice(1).find(r=>r);
            else
              tokStr = res[0];
            if (!m.ignore)
              addToken(token, tokStr||'', b);
            b += res[0].length; i = b - 1;
            return true;
          }
        } else if (m.s === this.source.substr(b, m.s.length)) {
          tokStr = this.source.substr(b, m.s.length);
          if (!m.ignore)
            addToken(token, tokStr, b);
          b += tokStr.length; i = b - 1;
          return true;
        }
      })) {
        continue;
      } else if (res = newRowRegex.exec(this.source.substr(b))) {
        this.lines.push(this.source.substring(beginLine, b));
        b += res[0].length; i = b - 1;
        beginLine = b;
      } else if (this.source[b] === '\\' && ['\r', '\n'].indexOf(this.source[b+1])>-1) {
        b +=2; i += 2;
      } else if (res = ignoreRegex.exec(this.source.substr(b))) {
        b += res[0].length; i = b - 1;
      } else if (i > b) {
        const parseInfo = new ParseInfo(this.lines.length+1, b - beginLine)
        throw new this.errorType(`'${this.source.substring(b,i)}' at line ${this.lines.length+1} col ${b - beginLine}`, parseInfo);
      }
    }

    this.lines.push(this.source.substring(beginLine, this.source.length));
    this._navTokens = this.tokens.filter(t=>
      this.filterOutTokens.indexOf(t.type) < 0);
  }

  /**
   * Get token at current position
   * @returns {token} current token
   */
  curTok() {
    return this._navTokens[this._pos];
  }

  /**
   * Advances internal pointer +1 and returns that token
   * @returns {token} next token
   */
  nextTok() {
    return this._navTokens[++this._pos];
  }

  /**
   * Revers internal point -1 and returns that pointer
   * @returns {token} previous token
   */
  prevTok() {
    return this._navTokens[--this._pos];
  }

  /**
   * Peek into tokens list forward or reverse
   * @param {number} [steps=1] How many steps from current we want to peek, may be negative, default +1
   * @returns {token} The token at steps pos or undefined
   */
  peekTok(steps = 1) {
    return this._navTokens[this._pos + steps];
  }

  /**
   * Starts a transaction, is reentant.
   * @returns {token} current token
   */
  tryPos() {
    if (this._pos < 0) this._pos = 0;
    this._stackPos.push(this._pos);
    return this._navTokens[this._pos];
  }

  /**
   * Revert transaction back to pos at last tryPos call.
   * @returns false (for chaining lines)
   */
  rejectPos() {
    if (this._stackPos.length)
      this._pos = this._stackPos.pop();
    return false;
  }

  /**
   * Accept transaction
   * @returns current position
   */
  acceptPos() {
    this._stackPos.pop();
    if (this._pos > this._biggestAcceptPos)
      this._biggestAcceptPos =
        this._pos < this.tokens.length ?
          this._pos : this.tokens.length-1;
    return this.curTok();;
  }
}

// -------------------------------------

// based from https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
export const ebnfGrammar =
`letter = "A" | "B" | "C" | "D" | "E" | "F" | "G"
        | "H" | "I" | "J" | "K" | "L" | "M" | "N"
        | "O" | "P" | "Q" | "R" | "S" | "T" | "U"
        | "V" | "W" | "X" | "Y" | "Z" | "a" | "b"
        | "c" | "d" | "e" | "f" | "g" | "h" | "i"
        | "j" | "k" | "l" | "m" | "n" | "o" | "p"
        | "q" | "r" | "s" | "t" | "u" | "v" | "w"
        | "x" | "y" | "z" ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
symbol = "[" | "]" | "{" | "}" | "(" | ")" | "<" | ">"
       | "'" | '"' | "=" | "|" | "." | "," | ";" ;
character = letter | digit | symbol | "_"
          | ? printable_character ? ;

identifier = letter , { letter | digit | "_" } ;
terminal = "'" , character , { character } , "'"
         | '"' , character , { character } , '"' ;

lhs = identifier ;
rhspart = identifier
        | terminal
        | "[" , rhs , "]"
        | "{" , rhs , "}"
        | "(" , rhs , ")" ;

rhs = rhspart , { "|" , rhspart }
    | rhspart , { "," , rhspart }
    | rhspart ;

rule = lhs , "=" , rhs , ";" ;
grammar = { rule } ;`;


/**
 * The root parser for the extended backs naur format.\n
 * Converts source to AST
 * @property {SyntaxTreeNode} cstRoot The CST tree root node
 * @property {AstTreeNode} astNode The AST tree root node
 * @property {Array.<AstTreeNode>} rules All syntax rules optained from grammar
 */
export class GrammarParser {
  opposites = {'[':']', '{':'}', '(':')'};

  ebnfTokenMatches = {
    comment: {r:/^\(\*.*\*\)/gm, ignore: true},
    litteral: {r:/^[a-zA-Z]+/},
    number: {r:/^[0-9]+/},
    underscore: {s:'_'},
    space: {r:/^[ ]+/, state:"stringState"},
    symbol: {r:/^[\[\]{}()<>'"=|.,;]/},
    special_sequence: {r:/^\?[ \t]*((?:\w+|\s*(?!\?))+)[ \t]*\?*/},
    whitespace: {r:/^[ \t]+/, ignore: true},
    printable_character:{r:/^\P{Cc}/u}
  }

  actions = {
    terminal: {
      name: 'terminal', action:(astNode, tok)=>{console.log(astNode)}
    },
    identifier: {
      name: 'identifier', action:(astNode, tok)=>{console.log(astNode)}
    },
    alternation: {
      name: 'alternation', action:(astNode, tok)=>{console.log(astNode)}
    },
    concatination: {
      name: 'concatination', action:(astNode, tok)=>{console.log(astNode)}
    },
    optional: {
      name: 'optional', action:(astNode, tok)=>{console.log(astNode)}
    },
    repetition: {
      name: 'repetition', action:(astNode, tok)=>{console.log(astNode)}
    },
    grouping: {
      name: 'grouping', action:(astNode, tok)=>{console.log(astNode)}
    },
    rule: {
      name: 'rule', action:(astNode, tok)=>{console.log(astNode)}
    }
  }

  _error = {message:'Unexpected error'};

  /**
   * Construct a new GrammarParser object
   * @param {string} source The EBNF grammar to parse
   * @param {string} entryPointRule The program entrypoint
   * @throws {GrammarSyntaxError} When a syntax error in grammar occurs
   */
  constructor(source, entryPointRule) {
    this.entryPointRule = entryPointRule;

    // scan source and create tokens
    this.lexer = new Lexer({
      tokenMatches: this.ebnfTokenMatches, source,
      errorType: GrammarSyntaxError});

    // parse tokens to CST (Complex Syntax Tree)
    this._grammar();

    // convert CST to AST (Abstract Syntax Tree)
    this._toAst();

    // reorder ast to have entrypoint first
    if (this.entryPointRule)
      this._lookupEntrypoint()

    // store all rules in a []
    this.rules = this.astRoot.right.asList('right');

    this._retrieveTerminalsFromGrammar();
  }

  /**
   * Tries to validate grammar for obvious errors
   * @throws {GrammarSyntaxError} When a error is detected
   */
  checkGrammar() {
    const recurseFindType = (n, findTypes, exclude) => {
      const arr = [];
      if (exclude && exclude.indexOf(n.type)>-1) return arr;
      if (!findTypes || findTypes.indexOf(n.type)>-1) arr.push(n);
      if (n.left) arr.push(...recurseFindType(n.left, findTypes, exclude));
      if (n.right) arr.push(...recurseFindType(n.right, findTypes, exclude));
      return arr;
    }

    // check that all identifiers exists
    const identifiers = recurseFindType(this.astRoot, ['identifier']);
    const ruleNames = this.rules.map(r=>r.value);
    const notFound = [];
    for(const ident of identifiers) {
      if (ruleNames.indexOf(ident.value) < 0)
        notFound.push(ident.value);
    }

    if (notFound.length)
      throw new GrammarSyntaxError(`${notFound.join(', ')} rules not found in grammar`);

    // check for cyclic dependancies
    // each rule chain must not call itself if it has not gotten a terminal in between
    const checkRule = (rule, checkFor, depth) => {
      const items = recurseFindType(rule.left, ['identifier', 'terminal'], ['optional']);
      for(const item of items) {
        if (item.type==='identifier'){
          if (checkFor.indexOf(item.value)>-1) {
            throw new GrammarSyntaxError(
              `Cyclic dependancy detected at:${item.value}`,
                 item.cstNode.flat().find(n=>n.tok).tok.parseInfo);
          } else {
            checkRule(this.rules.find(r=>r.value===item.value), [item.value, ...checkFor], ++depth);
          }
        } else { // must be a terminal
          return;
        }
      }
    }
    for (const rule of this.rules) {
      checkRule(rule, [rule.value], 0);
    }
  }

  _lookupEntrypoint() {
    let n = this.astRoot;
    const firstRule = n.right;
    while(n = n?.right) {
      if (n.value === this.entryPointRule) {
        if (firstRule === n) break;
        // remove from tree
        n.parent.right = n.right;
        if (n.right)
          n.right.parent = n.parent;
        // repoint the first rule, insert in first rules place
        n.parent = firstRule.parent;
        firstRule.parent = firstRule.parent.right = n;
        n.right = firstRule;
        break;
      }
    }
  }

  _retrieveTerminalsFromGrammar() {
    // store all possible terminals
    this.terminals = {};
    const cache = [];
    const findTerminal = (n, ruleName) => {
      if (n.type === 'terminal') {
        let key = n.cstNode.tok?.type === 'special_sequence' ?
                    'special_sequence' : ruleName;

        if (cache.indexOf(n.value) < 0) {
          if(!this.terminals[key])
            this.terminals[key] = [];
          this.terminals[key].push(n.value);
          cache.push(n.value);
        }
      }
      // check children
      if (n.left) findTerminal(n.left, ruleName);
      if (n.right) findTerminal(n.right, ruleName);
    }

    // walk the ast tree
    let n = this.astRoot;
    while(n = n.right)
      findTerminal(n.left, n.value);

    // automatically create tokenmatches from these terminals
    this.tokenMatches = {};
    for(const [key, vlu] of Object.entries(this.terminals)) {
      let tokenMatch = {};
      if (key === 'special_sequence')
        tokenMatch = vlu;
      else if (vlu.length > 1) {
        const mustEscape = ".\\+*?[^]$(){}=!<>|:-";
        const v = vlu.map(c=>c && mustEscape.indexOf(c) > -1 ? `\\${c}` : c).join('|');
        tokenMatch.r = new RegExp(`^(?:${v})`);
      } else
        tokenMatch.s = vlu[0];
      this.tokenMatches[key] = tokenMatch;
    }
  }

  _setError(message, tok) {
    this._error = {
      message,
      tok:tok || this.lexer.tokens[this.lexer.tokens.length-1]
    };
  }

  _throwError(message, tok) {
    this._setError(message, tok);
    const pNfoTok = this._error.tok,
          pNfoBigAccept = this.lexer.tokens[this.lexer._biggestAcceptPos];

    const parseInfo = pNfoBigAccept &&
      (pNfoTok.line <= pNfoBigAccept.line &&
       pNfoTok.col < pNfoBigAccept.col)
         ? pNfoBigAccept.parseInfo : pNfoTok.parseInfo;
    throw new GrammarSyntaxError(
      this._error.message, parseInfo
    );
  }

  _grammar() {
    this.cstRoot = new SyntaxTreeNode(null, "grammar");
    while(this.lexer.nextTok()) {
      if (!this._rule(this.cstRoot))
        throw new GrammarSyntaxError(
          this._error.message, this._error.tok?.parseInfo);
    }
  }

  _rule(parent) {
    const n = new SyntaxTreeNode(parent, "rule");
    let tok = this.lexer.tryPos();

    if (!this._lhs(n, tok))
      return n.remove();

    tok = this.lexer.nextTok();
    if (!tok || tok.str !== "=") {
      this._setError("Expected '='", tok);
      return n.remove() && this.lexer.rejectPos();
    }
    new SyntaxTreeNode(n, "symbol", tok);

    tok = this.lexer.nextTok();
    if (!this._rhs(n)) {
      if (!this._error)
        this._setError('Expected rhs value', tok);
      return n.remove() && this.lexer.rejectPos();
    }

    tok = this.lexer.nextTok();
    if (!tok || tok.str !== ";")
      this._throwError(
        `Expected ',', '|','[','{' or ';' near: '${tok?.str ||
          this.lexer.peekTok(-1).str}'`, tok);

    new SyntaxTreeNode(n, "symbol", tok);

    this.lexer.acceptPos();
    return true;
  }

  _rhs(parent) {
    const n = new SyntaxTreeNode(parent, "rhs");
    let tok = this.lexer.tryPos();

    // required part
    if (!this._rhspart(n))
      return n.remove() && this.lexer.rejectPos();

    // optional part
    this.lexer.tryPos();
    const optionalNodes = [];
    tok = this.lexer.nextTok();

    while (tok && [';','{','}','(',')','[',']'].indexOf(tok.str) < 0) {
      if (tok.str === '|' || tok.str === ',') {
        optionalNodes.push(new SyntaxTreeNode(n, tok.type, tok));
        this.lexer.nextTok();
        if (this._rhspart(n)) {
          tok = this.lexer.nextTok();
          continue;
        }
      }

      // failed if we get here
      optionalNodes.forEach(on=>on.remove());
      this.lexer.rejectPos();
      optionalNodes.splice(0, optionalNodes.length);
      break;
    }

    // the optional part
    optionalNodes.length ?
      this.lexer.prevTok() && this.lexer.acceptPos() :
        this.lexer.rejectPos();

    return this.lexer.acceptPos();
  }

  _lhs(parent) {
    const n = new SyntaxTreeNode(parent, "lhs");
    let tok = this.lexer.tryPos();

    if (!this._identifier(n))
      this._throwError('Expected identifier', tok, true);

    return this.lexer.acceptPos();
  }

  _rhspart(parent) {
    const n = new SyntaxTreeNode(parent, "rhspart");
    let tok = this.lexer.tryPos();

    // or'ed many alternatives
    if (this._identifier(n)) {
      return this.lexer.acceptPos();
    } else if (this._terminal(n)) {
      return this.lexer.acceptPos();
    } else {
      if (tok.str in this.opposites) {
        // | "[" , rhs , "]"
        // | "{" , rhs , "}"
        // | "(" , rhs , ")"
        const openCh = tok.str;
        new SyntaxTreeNode(n, tok.type, tok);
        tok = this.lexer.nextTok();
        if (this._rhs(n)) {
          tok = this.lexer.nextTok();
          if (tok.str !== this.opposites[openCh]) {
            this._setError(`Expected '${this.opposites[openCh]}'`, tok);
            return n.remove() && this.lexer.rejectPos();
          }
          new SyntaxTreeNode(n, tok.type, tok);
          return this.lexer.acceptPos();
        }
      }
    }

    // failed all check
    return n.remove() && this.lexer.rejectPos();
  }

  _terminal(parent) {
    const n = new SyntaxTreeNode(parent, "terminal");
    let tok = this.lexer.tryPos();

    if (!(tok.type === 'special_sequence' &&
          tok.str === "printable_character"))
    {
      // its not a printable_character
      if (tok.str !== '"' && tok.str !== "'")
        return n.remove() && this.lexer.rejectPos();
      new SyntaxTreeNode(n, tok.type, tok);

      const openCh = tok.str;
      tok = this.lexer.nextTok();
      while(tok && tok.str !== openCh &&
            (['litteral','number','symbol','underscore','space','printable_character']
              .indexOf(tok.type) > -1))
      {
        new SyntaxTreeNode(n, tok.type, tok);
        tok = this.lexer.nextTok();
      }

      if (!tok || tok.str !== openCh)
        this._throwError(`Expected matching '${openCh}'`, tok);

      if (n.children.length < 2)
        this._throwError(`Expected litteral before ${openCh}`, tok);
    }

    new SyntaxTreeNode(n, tok.type, tok);
    return this.lexer.acceptPos();
  }

  _identifier(parent) {
    const n = new SyntaxTreeNode(parent, "identifier");
    let tok = this.lexer.tryPos();

    if (tok.type !== 'litteral')
      return n.remove() && this.lexer.rejectPos();

    new SyntaxTreeNode(n, tok.type, tok);

    this.lexer.tryPos();
    const optional = [];
    tok = this.lexer.nextTok();
    while (tok && ['litteral','number','underscore'].indexOf(tok.type) > -1) {
      optional.push(new SyntaxTreeNode(n, tok.type, tok));
      tok = this.lexer.nextTok();
    }

    optional.length ?
      this.lexer.prevTok() && this.lexer.acceptPos() :
        this.lexer.rejectPos();

    return this.lexer.acceptPos();
  }

  // evaluate left to right
  // When we exhausted left, we do right
  // rows are always attached to the right, as we should goto next row when we are done at left
  // example:
  //   id1=("1");
  //   id2=id1,";";
  //   id3=id2,{other|next}
  //
  //          1 < row1
  //         /
  // root  ()    id1 < row2
  //    \  /    /
  //    id1   ','
  //       \  / \     id2    other
  //       id2  ';'   /     /
  //         \      ','   '|'
  //          \    /  \  /  \
  //           id3     {}   next
  //      rows ^     ^ belong to row3
  _toAst() {
    let ast = this.astRoot =
       new AstTreeNode(null, this.cstRoot, new ProdProgramRoot(this));
    const rules = this.cstRoot.children.filter(ch=>ch.type==='rule');
    for(const rule of rules) {
      this._toAst_rule(ast, rule);
      ast = ast.right;
    }
  }

  _toAst_rule(parent, rule) {
    // lhs is always child[0]
    const ruleName = this._getIdentifierStr(rule.children[0].children[0]);
    parent.right = new AstTreeNode(
      parent, rule, new ProdRule(this), 'rule', ruleName);
    // rhs is always at pos2 according to grammar
    this._toAst_rhs(parent.right, rule.children[2]);
  }

  _toAst_rhs(parent, rhs) {
    if (rhs.children.length > 1) {
      // many rhspart's
      const alternationIdxs = rhs.children.reduce((arr, ch, i)=>{
        if (ch.tok?.str==='|') arr.push(i);
        return arr;
      }, []);
      let first = 0;
      let prev = parent, branch = 'left', sepCst;

      const newAlternationNode = (sepCst)=>{
        const action = new ProdAlternation(this);
        // create a new AstNode and add as leftchild to prev
        const sepAst = new AstTreeNode(
          prev, sepCst, action, action.name, '|');
        prev[branch] = sepAst;
        prev = sepAst;
        branch = 'right';
      }

      for (const alIdx of alternationIdxs) {
        newAlternationNode(rhs.children[alIdx]);
        this._toAst_rhs_items(prev, rhs.children.slice(first, alIdx));
        first = alIdx+1;
      }
      // handle trailing
      if (first > 0)
        newAlternationNode(rhs.children[first]);
      this._toAst_rhs_items(prev, rhs.children.slice(first));

    } else {
      // a single rhspart
      parent.left = this._toAst_rhspart(parent, rhs.children[0]);
    }
  }

  // add 'one , two' or simply 'one' to rhs
  _toAst_rhs_items(parent, nodes) {

    if (nodes.length < 2)
      return parent.left = this._toAst_rhspart(parent, nodes[0])

    let prev = parent, branch = 'left', sepCst;
    // iterate over all
    for(let i = 0; i < nodes.length; i+=2) { // one | three | five ...

      if (i < nodes.length-1)
        sepCst = nodes[i+1];

      const action = new ProdConcatination(this);

      // create a new AstNode and add as leftchild to prev
      const sepAst = new AstTreeNode(
        prev, sepCst, action, action.name, ',');
      prev[branch] = sepAst;
      prev = sepAst;
      branch = 'right';

      // add left leafe
      prev.left = this._toAst_rhspart(prev, nodes[i]);
    }
    return prev;
  }

  _toAst_rhspart(parent, rhspart) {
    const firstCh = rhspart?.children[0];
    switch(firstCh?.type) {
    case 'identifier':
      return this._toAst_identifier(parent, firstCh);
    case 'terminal':
      return this._toAst_terminal(parent, firstCh);
    case 'symbol':
      const ch = firstCh.tok.str;
      const action = (ch === '[') ? new ProdOptional(this) :
                       (ch === '{') ? new ProdRepetition(this) :
                        new ProdGrouping(this);

      const ast = new AstTreeNode(
                       parent, firstCh,
                       action, action.name, `${ch}...${this.opposites[ch]}`);

      this._toAst_rhs(ast, rhspart.children[1])
      return ast;
    default:
      //throw new Error("CstTree invalid during ast creation in rhspart");
      return undefined;
    }
  }

  _toAst_terminal(parent, terminal) {
    const str = this._getTerminalStr(terminal);
    return new AstTreeNode(parent, terminal,
                       new ProdTerminal(this), "terminal", str);
  }

  _toAst_identifier(parent, identifier) {
    const str = this._getIdentifierStr(identifier);
    return new AstTreeNode(parent, identifier,
                       new ProdIdentifier(this), "identifier", str);
  }

  _getTerminalStr(terminal) {
    // terminal can be of many parts ignore '"' and "'"
    const parts = terminal.children.slice(1,-1).map(n=>
      n.type === 'underscore' ?
        '_' : n.tok.str);
    return parts.join('');
  }

  _getIdentifierStr(identifier) {
    // terminal can be of many parts ignore '"' and "'"
    const parts = identifier.children.map(n=>
                    n.type === 'underscore' ?
                      '_' : n.tok.str);
    return parts.join('');
  }
}

// --------------------------------------

class ProdBase {
  constructor(grmParser, grmAstNode /*= undefined*/) {
    this.grmParser = grmParser;
    this.grmAstNode = grmAstNode // if undefined here, set by AstTreeNode constructor
  }

  _throwSyntaxError(lex, tok) {
    if (!tok)
      tok = lex.tokens[lex._biggestAcceptPos];
    if (!tok) tok = lex.curTok();
    const pNfo = tok.parseInfo;
    const errLine = lex.lines[pNfo.line-1].substr(0, pNfo.col);
    throw new SyntaxError(`Syntax error near '${errLine}' at line: ${pNfo.line} col: ${pNfo.col}`)

  }
}

class ProdProgramRoot extends ProdBase {
  name = 'root';
  check(lex, parser) {
    lex.nextTok();
    const entryPoint = this.grmAstNode.right;

    const rootNode = entryPoint.prod.check(lex, parser);
    if (rootNode) return rootNode;
    return null;
  }
}

/*
// rule = ... or ( ... )
class ProdGroupBase extends ProdBase {
  check(lex, parser, type) {
    const chNode = this.grmAstNode?.left.prod.check(lex, parser);
    if (chNode) {
      const pgmCst =  new SyntaxTreeNode(null, type);
      return pgmCst.addChild(chNode);
    }
    return null;
  }
}*/

// rule = .....
class ProdRule extends ProdBase {
  name = 'rule';
  check(lex, parser) {
    //return super.check(lex, parser, this.grmAstNode.value);
    const chNode = this.grmAstNode?.left.prod.check(lex, parser);
    if (chNode) {
      const pgmCst =  new SyntaxTreeNode(null, this.grmAstNode.value);
      return pgmCst.addChild(chNode);
    }
    return null;
  }
}

// ( id1, id2 ...)
class ProdGrouping extends ProdBase {
  name = 'grouping';
  check(lex, parser) {
    //return super.check(lex, parser, this.grmAstNode.type);
    const chNode = this.grmAstNode?.left.prod.check(lex, parser);
    if (chNode) {
      return chNode;
    }
    return null;
  }
}

// zero or more { needle ... }
class ProdRepetition extends ProdBase {
  name = 'repetition';
  check(lex, parser) {
    let n = this.grmAstNode, chNode;
    //const pgmCst =  new SyntaxTreeNode(null, this.grmAstNode.type);
    const childs = [];
    if (n.left) {
      lex.tryPos();
      for(; n?.left && (chNode = n.left.prod.check(lex, parser)); )
        //pgmCst.addChild(chNode);
        Array.isArray(chNode) ? childs.push(...chNode) : childs.push(chNode);

      if (!childs.length)
        return lex.rejectPos();

      lex.acceptPos();
      return childs;
    }

    return childs;
  }
}

// [option...]
class ProdOptional extends ProdBase {
  name = 'optional';
  check(lex, parser) {
    const chNode = this.grmAstNode.left.prod.check(lex, parser);
    if (chNode) {
      //const pgmCst =  new SyntaxTreeNode(null, this.grmAstNode.type);
      //return pgmCst.addChild(chNode);
      return chNode;
    }
    return []; // allow continue concatination
  }
}

// id1 , id2 ...
class ProdConcatination extends ProdBase {
  name = 'concatination';
  check(lex, parser) {
    let n = this.grmAstNode;
    //const pgmCst =  new SyntaxTreeNode(null, this.grmAstNode.type);
    const childs = [];
    for(;n && n.left; n = n.right) {
      lex.tryPos();
      const chNode = n.left.prod.check(lex, parser)
      if (!chNode)
      //  return pgmCst.children.length>1?pgmCst : pgmCst.children[0];
        return childs.length ? childs : null;
      //Array.isArray(chNode) ? pgmCst.addChild(...chNode) : pgmCst.addChild(chNode);
      Array.isArray(chNode) ? childs.push(...chNode) : childs.push(chNode);
      lex.acceptPos();
    }
    // if we only have one item don't go through a concatination
    return childs.length ? childs : null;
    //return pgmCst.children.length>1 ? pgmCst : pgmCst.children[0];
  }
}

// id1 | id2 ...
class ProdAlternation extends ProdBase {
  name = 'alternation';
  check(lex, parser) {
    lex.tryPos();
    let n = this.grmAstNode;
    //const pgmCst =  new SyntaxTreeNode(null, this.grmAstNode.type);
    for(; n && n.left; n = n.right) {
      const chNode = n.left.prod.check(lex, parser);
      if (chNode) {
        //pgmCst.addChild(chNode);
        lex.acceptPos();
        return chNode;//pgmCst;
      }
    }
    return lex.rejectPos();
  }
}

class ProdIdentifier extends ProdBase {
  name = 'identifier_rule';

  _flatten(pgmCst) {
    const children = [];
    const recurse = (cst)=>{
      if (cst.type === 'terminal') {
        children.push(cst);
        return;
      }

      for (const ch of cst.children)
        recurse(ch);
    }

    for (const ch of pgmCst.children)
      recurse(ch);

    pgmCst.children = children;
  }

  _accept(lex, parser, chNode) {
    const pgmCst = new SyntaxTreeNode(null, this.grmAstNode.value);
    pgmCst.addChild(chNode);
    lex.acceptPos();
    if (parser.flattenRules.indexOf(this.grmAstNode.value)>-1)
      this._flatten(pgmCst);
    return pgmCst;
  }

  check(lex, parser) {
    lex.tryPos();

    let chNode;
    const cached = parser._prodIdentifierCache[this.grmAstNode.value];
    if (cached) {
      if (chNode = cached.check(lex, parser))
        return this._accept(lex, parser, chNode);
      return lex.rejectPos();
    } else {
      // lookup the rule for this identifier
      let n = this.grmParser.astRoot;
      while (n = n.right) {
        if (n.value === this.grmAstNode.value) {
          if (chNode = n.left.prod.check(lex, parser)) {
            parser._prodIdentifierCache[n.value] = n.left.prod;
            return this._accept(lex, parser, chNode);
          }
          return lex.rejectPos();
        }
      }
    }

    throw new GrammarSyntaxError(`${this.astNode.value} not found in grammar rules`)
  }
}

class ProdTerminal extends ProdBase {
  name = 'terminal';
  check(lex, parser) {
    const tok = lex.curTok();
    const escTokStr = `${tok?.str}`;
    if (tok && escTokStr === this.grmAstNode.value) {
      const pgmCst = new SyntaxTreeNode(null, this.grmAstNode.type, tok);
      lex.nextTok();

      return pgmCst;
    }
    return null;
  }
}

// --------------------------------------------

/**
 * Parses a programs source text based of the grammar AST
 * previously produced by grmParser
 */
export class Parser {
  _prodIdentifierCache = {};
  /**
   * Constructs a new Parser instance
   * @param {GrammarParser} grmParser The grammar for this source text
   * @param {string} source The program source text
   */
  constructor(grmParser, source, flattenRules = []) {
    this.grmParser = grmParser;
    this.lexer = new Lexer({
      tokenMatches:grmParser.tokenMatches, source});

    this.flattenRules = flattenRules;
    this.traceStack = [];
    let startPoint = this.grmParser.astRoot.prod;
    this.grmAstNode = this.grmParser.astRoot;

    this.prgCstRoot = startPoint.check(this.lexer, this);

    if (!this.prgCstRoot) {
      //this.trace();
      startPoint._throwSyntaxError(this.lexer);
    }

  }

  toAst(reducerFunctions = []) {
    let cst = this.prgCstRoot;
    this.astNode = new AstTreeNode(undefined, cst)

    const recurse = (cst, ast) => {
      if (!cst) return;
      for (const n of cst.children) {
        // check if node only has terminals
      }
    }
  }
}