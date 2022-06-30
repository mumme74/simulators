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
   * Add left node to this at left pos
   * @param {AstTreeNode} leftNode
   * @returns {AstTreeNode} returns self, allows chaining
   */
  addLeft(leftNode) {
    leftNode.parent = this;
    this.left = leftNode;
    return this; // allow chaining
  }

  /**
   * Add right node to this at right pos
   * @param {AstTreeNode} rightNode
   * @returns {AstTreeNode} returns self, allow chaining
   */
  addRight(rightNode) {
    rightNode.parent = this;
    this.right = rightNode;
    return this; // allow chaining
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
    let tokStr, beginLine = 0, res = null, escaped = false,
        i = 1, b = 0;

    const tokenMatchEntries = Object.entries(this.tokenMatches);

    const addToken = (token, tokStr, b) => {
      const line = this.lines.length+1, col = b - beginLine;
      if (newRowRegex.test(tokStr)) {
        addLine(tokStr);
      }
      this.tokens.push({
        str:tokStr, type:token,
        parseInfo: new ParseInfo(line, col)
      });
    }

    const addLine = (tokStr) => {
      this.lines.push(this.source.substring(beginLine, b));
      beginLine = b + tokStr.length;
    }

    // tokenize
    const curStates = [];
    for (i = 1, b = 0; i <= source.length; ++i) {
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
        addLine(res[0]);
        b += res[0].length; i = b - 1;
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
   * Reverse internal point -1 and returns that pointer
   * @returns {token} previous token
   */
  prevTok() {
    return this._navTokens[--this._pos];
  }

  /**
   * Get the very first token among all tokens
   * @returns {token} the first token in scanned tokens
   */
  firstToken() {
    return this._navTokens[0];
  }

  /**
   * Get the very last token among tokens
   * @returns {token} The last token in scanned tokens
   */
  lastToken() {
    return this._navTokens[this._navTokens.length -1];
  }

  /**
   * Return the pos of the internal iterator
   * @returns {number} The number of internal pointer
   */
  pos() {
    return this._pos;
  }

  /**
   * Scroll internal pointer to pos
   * @param {number} pos The pos to go back to
   * @returns {token} The token at pos
   */
  revertTo(pos) {
    this._pos = pos;
    return this._navTokens[this._pos];
  }

  /**
   * Checks wheather we have passed the last token
   * @returns {boolean} true if at end
   */
  isAtEnd() {
    return this._pos === this._navTokens.length;
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
    printable_character: {
      r:/^(?:\\(?:[nfrtsSvbBdDwW0]|x[0-9a-zA-Z]{2}|u[0-9a-zA-Z]{4})|\P{Cc})/u,
      state: "stringState"
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
    for (let n = this.astRoot; n = n.right;)
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
    // entry point to parse grammar
    this.cstRoot = new SyntaxTreeNode(null, "grammar");

    while(this.lexer.nextTok()) {
      const chNode = this._rule(this.cstRoot);
      if (chNode) {
        this.cstRoot.addChild(chNode);
      } else
        throw new GrammarSyntaxError(
          this._error.message, this._error.tok?.parseInfo);
    }
  }

  _rule() {
    let tok = this.lexer.tryPos();

    const lhs = this._lhs(tok);
    if (!lhs) return null;

    tok = this.lexer.nextTok();
    if (!tok || tok.str !== "=") {
      this._setError("Expected '='", tok);
      return this.lexer.rejectPos();
    }
    const equalSymbol = new SyntaxTreeNode(null, "symbol", tok);

    tok = this.lexer.nextTok();
    const rhs = this._rhs();
    if (!rhs) {
      if (!this._error)
        this._setError('Expected rhs value', tok);
      return this.lexer.rejectPos();
    }

    tok = this.lexer.nextTok();
    if (!tok || tok.str !== ";")
      this._throwError(
        `Expected ',', '|','[','{' or ';' near: '${tok?.str ||
          this.lexer.peekTok(-1).str}'`, tok);

    const semiColon = new SyntaxTreeNode(null, "symbol", tok);

    this.lexer.acceptPos();

    const rule = new SyntaxTreeNode(null, "rule");
    return rule.addChild([lhs, equalSymbol, rhs, semiColon]);
  }

  _rhs() {
    let tok = this.lexer.tryPos(), optpart;
    const children = [];

    const createRhs = () => {
      this.lexer.acceptPos();
      const rhs = new SyntaxTreeNode(null, "rhs");
      return rhs.addChild(children);
    }

    // required part
    const firstCh = this._rhspart();
    if (!firstCh)
      return this.lexer.rejectPos();
    children.push(firstCh);

    // optional part
    const revertTo = this.lexer.pos();
    tok = this.lexer.nextTok();

    /*... = one , two | three , four | five;
      becomes:
        rhs -- alternation -- concatination -- one
                    |               |
                    |               ---------- two
                    |
                    ----------concatination --three
                    |               |
                    |               ---------- four
                    ----------five    */
    let concatSep, alternationSep;
    while (tok && [';','{','}','(',')','[',']'].indexOf(tok.str) < 0) {
      if (['|',','].indexOf(tok.str)>-1) {
        this.lexer.nextTok();
        if (optpart = this._rhspart()) {
          // store in correct bucket
          if (tok.str === '|') {
            if (!alternationSep) {
              alternationSep = new SyntaxTreeNode(null, tok.type, tok)
              alternationSep.addChild(children.pop()); // insert first required part as child to alternation
              children.push(alternationSep);
            }
            // prepare for next concat
            concatSep = null;
            alternationSep.addChild(optpart);
          } else if (tok.str === ',') {
            if (!concatSep) {
              const prev = (alternationSep?.children||children).pop();
              concatSep = new SyntaxTreeNode(null, tok.type, tok);
              if (alternationSep) alternationSep.addChild(concatSep);
              else children.push(concatSep);
              prev.remove();
              concatSep.addChild(prev);
            }
            concatSep.addChild(optpart);
          }
        }
        tok = this.lexer.nextTok();
        continue;
      }

      // failed if we get here
      this.lexer.revertTo(revertTo);
      children.splice(1,-1,firstCh);
      return createRhs();
    }

    // we might have one or more items in rhs
    if (alternationSep||concatSep) this.lexer.prevTok();
    else this.lexer._pos = revertTo;
    return createRhs();
  }

  _lhs() {
    let tok = this.lexer.tryPos();

    const identifier = this._identifier();
    if (!identifier)
      this._throwError('Expected identifier', tok, true);

    this.lexer.acceptPos();
    const lhs = new SyntaxTreeNode(null, "lhs");
    return lhs.addChild([identifier])
  }

  _rhspart() {
    let tok = this.lexer.tryPos();

    const createRhsPart = (child)=>{
      this.lexer.acceptPos();
      const rhspart = new SyntaxTreeNode(null, "rhspart");
      return rhspart.addChild(child);
    }

    let chNode;

    // or'ed many alternatives
    if (chNode = this._identifier()) {
      return createRhsPart(chNode);
    } else if (chNode = this._terminal()) {
      return createRhsPart(chNode);
    } else {
      if (tok.str in this.opposites) {
        // | "[" , rhs , "]"
        // | "{" , rhs , "}"
        // | "(" , rhs , ")"
        const openCh = tok.str;
        const openNode = new SyntaxTreeNode(null, tok.type, tok);
        tok = this.lexer.nextTok();
        const rhs = this._rhs();
        if (rhs) {
          tok = this.lexer.nextTok();
          if (tok.str !== this.opposites[openCh]) {
            this._setError(`Expected '${this.opposites[openCh]}'`, tok);
            return this.lexer.rejectPos();
          }
          const closeNode = new SyntaxTreeNode(null, tok.type, tok);

          this.lexer.acceptPos();
          return createRhsPart([openNode, rhs, closeNode]);
        }
      }
    }

    // failed all check
    return this.lexer.rejectPos();
  }

  _terminal() {
    let tok = this.lexer.tryPos();
    const children = []
    if (!(tok.type === 'special_sequence' &&
          tok.str === "printable_character"))
    {
      // its not a printable_character
      if (tok.str !== '"' && tok.str !== "'")
        return this.lexer.rejectPos();
      children.push(new SyntaxTreeNode(null, tok.type, tok));

      const openCh = tok.str;
      tok = this.lexer.nextTok();
      while(tok && tok.str !== openCh &&
            (['litteral','number','symbol','underscore',
              'space','printable_character']
              .indexOf(tok.type) > -1))
      {
        if (tok.type==='printable_character') {
          if (tok.str === '\\0') tok.str = "\0x00";
          else tok.str = JSON.parse(`"${tok.str}"`); // Hack to convert back to what it was supposed to do
        }
        children.push(new SyntaxTreeNode(null, tok.type, tok));
        tok = this.lexer.nextTok();
      }

      if (!tok || tok.str !== openCh)
        this._throwError(`Expected matching '${openCh}'`, tok);

      if (children.length < 2)
        this._throwError(`Expected litteral before ${openCh}`, tok);
    }

    children.push(new SyntaxTreeNode(null, tok.type, tok));
    this.lexer.acceptPos();

    const terminal = new SyntaxTreeNode(null, "terminal");
    return terminal.addChild(children);
  }

  _identifier() {
    let tok = this.lexer.tryPos();

    if (tok.type !== 'litteral')
      return this.lexer.rejectPos();

    const required = new SyntaxTreeNode(null, tok.type, tok);

    this.lexer.tryPos();
    const optional = [];
    tok = this.lexer.nextTok();
    while (tok && ['litteral','number','underscore'].indexOf(tok.type) > -1) {
      optional.push(new SyntaxTreeNode(null, tok.type, tok));
      tok = this.lexer.nextTok();
    }

    optional.length ?
      this.lexer.prevTok() && this.lexer.acceptPos() :
        this.lexer.rejectPos();

    this.lexer.acceptPos();
    const identifier = new SyntaxTreeNode(null, "identifier");
    return identifier.addChild([required, ...optional]);
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
      ast.addRight(this._toAst_rule(rule));
      ast = ast.right;
    }
    return this.astRoot;
  }

  _toAst_rule(rule) {
    // lhs is always child[0]
    const ruleName = this._getIdentifierStr(rule.children[0].children[0]);
    // rhs is always at pos2 according to grammar
    const chNode = this._toAst_rhs(rule.children[2]);
    if (chNode) {
      const ast = new AstTreeNode(null, rule, new ProdRule(this), 'rule', ruleName);
      return ast.addLeft(chNode);
    }
  }

  _toAst_rhs(rhs) {

    const firstCh = rhs.children[0];
    if (['|',','].indexOf(firstCh?.tok?.str)>-1) {
      // many children
      const tokStr = rhs.children[0].tok?.str
      return this._toAst_rhs_multiple(rhs.children, tokStr);
    } else {
      // a single rhspart
      return this._toAst_rhspart(firstCh);
    }
  }

  _toAst_rhs_multiple(items, tokStr) {
    let prev = null, root = null;

    const ProdCls = tokStr === '|' ?
                     ProdAlternation :
                       ProdConcatination;

    const addItem = (cstNode, chNode, tokStr)=>{
      const action = new ProdCls(this);
      const ast = new AstTreeNode(prev, cstNode, action,
                                  action.name, tokStr);
      if (!root) root = ast;
      if (prev) prev.addRight(ast);
      prev = ast;
      ast.addLeft(chNode);
    }

    for (const cstNode of items) {
      if (cstNode.type === 'rhspart') {
        const chNode = this._toAst_rhspart(cstNode);
        addItem(cstNode, chNode, tokStr);
      } else {
        // else its many items iterate over them
        for (const ch of cstNode.children) {
          if (ch.type === 'rhspart') {
            const chNode = this._toAst_rhspart(ch);
            addItem(ch, chNode, tokStr);
          } else { // its a new sublist
            const tStr = ch.tok?.str || tokStr;
            const chNode = this._toAst_rhs_multiple(ch.children, tStr);
            addItem(ch, chNode, tokStr);
          }
        }
      }
    }

    return root;
  }

  _toAst_rhspart(rhspart) {
    if (!rhspart) return null;
    const firstCh = rhspart.children[0];
    switch(firstCh?.type) {
    case 'identifier':
      return this._toAst_identifier(firstCh);
    case 'terminal':
      return this._toAst_terminal(firstCh);
    case 'symbol':
      const ch = firstCh.tok.str;
      const action = (ch === '[') ? new ProdOptional(this) :
                       (ch === '{') ? new ProdRepetition(this) :
                        new ProdGrouping(this);

      let ast;
      const chNode = this._toAst_rhs(rhspart.children[1]);
      if (chNode) {
        ast = new AstTreeNode(null, firstCh,
          action, action.name,
          `${ch}...${this.opposites[ch]}`);
        ast.addLeft(chNode);
      }
      return ast;
    default:
      throw new Error("CstTree invalid during ast creation in rhspart");
      return null;
    }
  }

  _toAst_terminal(terminal) {
    const str = this._getTerminalStr(terminal);
    return new AstTreeNode(null, terminal,
                       new ProdTerminal(this), "terminal", str);
  }

  _toAst_identifier(identifier) {
    const str = this._getIdentifierStr(identifier);
    return new AstTreeNode(null, identifier,
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
    const childs = [];
    if (n.left) {
      let lastGoodTok = lex.tryPos();
      for(; n?.left && (chNode = n.left.prod.check(lex, parser)); ) {
        if (lex.curTok() !== lastGoodTok){
          Array.isArray(chNode) ? childs.push(...chNode) : childs.push(chNode);
          lastGoodTok = lex.curTok();
        } else
          break; // prevent endless loop with optional inside a repetition
      }

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
    const childs = [];
    for(;n && n.left; n = n.right) {
      lex.tryPos();
      const chNode = n.left.prod.check(lex, parser)
      if (!chNode) {
        lex.rejectPos();
        return childs.length ? childs : null;
      }
      Array.isArray(chNode) ? childs.push(...chNode) : childs.push(chNode);
      lex.acceptPos();
    }
    // if we only have one item don't go through a concatination
    return childs.length ? childs : null;
  }
}

// id1 | id2 ...
class ProdAlternation extends ProdBase {
  name = 'alternation';
  check(lex, parser) {
    lex.tryPos();
    let n = this.grmAstNode;
    for(; n && n.left; n = n.right) {
      const chNode = n.left.prod.check(lex, parser);
      if (chNode) {
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
      parser.trace("try", this.grmAstNode, lex.curTok());
      if (chNode = cached.prod.check(lex, parser)) {
        parser.trace("accept", this.grmAstNode, lex.peekTok(-1));
        return this._accept(lex, parser, chNode);
      }
      parser.trace("reject", this.grmAstNode, lex.peekTok(-1));
      return lex.rejectPos();
    } else {
      // lookup the rule for this identifier
      let n = this.grmParser.astRoot;
      while (n = n.right) {
        if (n.value === this.grmAstNode.value) {
          parser.trace("try", this.grmAstNode, lex.curTok());
          parser._prodIdentifierCache[n.value] = n.left;
          if (chNode = n.left.prod.check(lex, parser)) {
            parser.trace("accept", this.grmAstNode, lex.peekTok(-1));
            return this._accept(lex, parser, chNode);
          }

          parser.trace("reject", this.grmAstNode, lex.peekTok(-1));
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
    const escTokStr = `${tok?.str}`,
          escNodevlu = `${this.grmAstNode.value}`;
    if (tok && escTokStr === `${escNodevlu}`) {
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
   * @param {Array.<string>} [flattenRules] join all subgroups that is't terminal under this node
   * @param {boolean} [trace] Activate tracing (Used when debugging)
   */
  constructor({grmParser, source, flattenRules = [], trace=false}) {
    this.grmParser = grmParser;
    this.lexer = new Lexer({tokenMatches:grmParser.tokenMatches, source});

    this.flattenRules = flattenRules;
    this.traceStack = [];
    let startPoint = this.grmParser.astRoot.prod;
    this.grmAstNode = this.grmParser.astRoot;

    this.trace = trace ? this._trace : ()=>{};

    this.prgCstRoot = startPoint.check(this.lexer, this);

    if (!this.prgCstRoot) {
      //this.trace();
      startPoint._throwSyntaxError(this.lexer);
    }

  }

  _trace(text, node, tok) {
    if (!this.trace) return
    if (!tok && this.lexer.isAtEnd())
      tok = this.lexer.lastToken();
    const pos = `ln:${tok?.parseInfo.line||-1}`+
                `,cl:${tok?.parseInfo.col >=-1 ? tok.parseInfo.col :-1}`;
    let p = node.parent
    for (; p && p.type != 'rule'; p = p.parent)
      ;
    const vlu = node.value || node.type || node.prod.type,
          pvlu = p?.value || p?.type || p?.prod.type;
    console.log(`${text} ${vlu}(${pvlu})`.padEnd(40)+`${pos.padEnd(15)}`);
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

