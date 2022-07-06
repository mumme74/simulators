"use strict";

/**
 * @module Parser
 */

// this parser follows extended backus naur form
// https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

/**
 * @typedef {Object} Token
 * @property {string} str The string value this token represents
 * @property {string} type The type of token
 * @property {ParseInfo} parseInfo Position in source where this token comes from
 */

/**
 * TreeNode for CST tree.
 * A Complex Syntax Tree represents the source code as is, with all tokens left in.
 * Such as all ',' '(', ')' etc.
 * It is used to later create a Abstract Syntax Tree (AST)
 * @property {SyntaxTreeNode} parent the parent to this node
 * @property {string} type The type of node
 * @property {Token} tok The token from the lexer
 * @property {Array.<SyntaxTreeNode>} children All childnodes
 */
export class SyntaxTreeNode {
  /**
   * Construct a new CST TreeNode
   * @param {string} type The type of node
   * @param {Token} tok The token from the lexer
   */
  constructor(type, tok) {
    this.parent = null;
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
   * Show current tree branch as a javascript object, usefull when debugging
   * @returns A JS object representation of this branch
   */
  asObject() {
    return {
      type:this.type, value: this.tok?.str, tok:this.tok,
      ch:[...this.children.map(c=>c.asObject())]
    }
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

//--------------------------------------------------

/**
 * A node in a AST tree.
 * An Abstract Syntax Tree contains only the necessary information.
 * Stuff that is't strictly needed any more is taken out such as ',', '(' or ')'
 * @prop {AstTreeNode}    parent  The parentnode in tree to this node
 * @prop {string}         type    The type of this node, ie rulename in grammar
 * @prop {string}         value   The value of the node, retrived from token str. If applicable, else empty string.
 * @prop {ActionBase}     action  The action attahed to this node.
 * @prop {SyntaxTreeNode} cstNode The Complex Syntax Tree node that created this AST node
 * @example
 *   // walk the tree after parser has created it:
 *   .... create parser above
 *
 *   const root = parser.prgAstRoot;
 *   root.action.visit(); // visit root and all subnodes
 *                        // Your custom Actions must delegate
 *                        // or visit left and right child automatically
 * @see ActionBase
 */
export class AstTreeNode {
  /**
   * Construct a new AST node
   * @param {SyntaxTreeNode} cstNode The syntax node for this node
   * @param {ActionBase}     action  Object that is associated with this node, action to call
   * @param {string}         type    The name of this type
   * @param {string}        [value]  The value of this node in source such as strings, identifier or numbers.
   */
  constructor(cstNode, action, type, value = '') {
    this.parent = null;
    this.type = type;
    this.value = value;
    this.cstNode = cstNode;
    this.action = action;
    if (action && !action.astNode)
      action.astNode = this;
  }

  /**
   * Add leftNode to this at left pos
   * @param   {AstTreeNode} leftNode
   * @returns {AstTreeNode} returns self, allows chaining
   */
  addLeft(leftNode) {
    leftNode.parent = this;
    this.left = leftNode;
    return this; // allow chaining
  }

  /**
   * Add rightNode to this at right pos
   * @param   {AstTreeNode} rightNode
   * @returns {AstTreeNode} returns self, allow chaining
   */
  addRight(rightNode) {
    rightNode.parent = this;
    this.right = rightNode;
    return this; // allow chaining
  }

  /**
   * Returns an array with all nodes connected to the dir direction
   * @param   {string} dir Direction to walk to, must be 'left' or 'right'
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
  * A object with this and all child nodes in a hierachial object structure.
  * Mainly used to debug tree generation
  * @typedef  {Object} AstAsObject
  * @property {string} type The name of this type
  * @property {string} [value] The value of this node in source such as strings, identifier or numbers.
  * @property {AstAsObject|undefined} left The left child obj
  * @property {AstAsObject|undefined} right The right child obj
  */

  /**
   * Returns this node and children as a javascript object
   * Mainly used to debug tree generation
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

  /**
   * Returns this node and children as a JSON string
   * Mainly used to debug tree generation
   * @param {number} indent How many indents the json should have
   */
  asJson(indent = 2) {
    return JSON.stringify(this.asObject(), null, indent);
  }
}

// ------------------------------------------------

/**
 * Base class for all actions (Things that nodes should do.)
 * This gets visited when each node is visited in the tree
 * You should subclass this to get the functionality out of your program
 * @param {Parser} parser Reference to the parser that generated this action
 * @param {AstTreeNode} astNode Reference to the astNode this action belongs to
 * @example
 * class AddExpr extends ActionBase {
 *   visit() {
 *     const left  = this.astNode.left.visit(),
 *           right = this.astNode.right.visit();
 *     return left + right;
 *   }
 * }
 * @see AstTreeNode
 */
 export class ActionBase {
  /**
   * Create a new Action for the AST node
   * @param {Parser} parser Reference to the parser that generated this action
   * @param {AstTreeNode} astNode Reference to the astNode this action belongs to
   */
  constructor(parser, astNode) {
    this.parser = parser;
    this.astNode = astNode;
  }

  /**
   * Walk the tree, subclasses should invoke this one to continue walking the program
   * @returns {*} Implementation specific, subclasses micght return there value
   */
  visit() {
    let resL, resR;
    if (this.astNode.left)
      resL = this.astNode.left.action.visit.apply(
        this.astNode.left.action, arguments);
    if (this.astNode.right)
      resR = this.astNode.right.action.visit.apply(
        this.astNode.right.action, arguments);
    if (resL !== undefined) return resL;
    if (resR !== undefined) return resR;
    return this.astNode;
  }
}

// -----------------------------------------------

/**
 * Contains Parse info from lexical scan. Is a property of Token
 * @prop {number} line The line in source.
 * @prop {number} col  The column from source file.
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
 * Identifies a Token
 * @typedef {Object.<string, regex|string>} TokenMatch
 * @prop {string}  [s] The string to match against
 * @prop {regex}   [r] Regex to match against
 * @prop {boolean} [ignore] Match but dont store. Whitespace for example.
 * @prop {string}  [state] Match only when lexer is in this state. Controlchars in a string for example
 */

/**
 * @typedef {Object.<string, TokenMatch>} TokenMatches
 * @example
 *  {
 *    LPAREN: {s: '('},
 *    whitespace: {r: /^[ \t\n]/, ignore:true,},
 *    controlchar: {r: /^[\f\n\r\t]/, state: 'stringState'}
 *  }
 */

/**
 * A special SyntaxError for grammar files
 * @property {ParseInfo} [parseInfo] The parseInfo where this error occured
 * @property {string}     name       The name of this error (GrammarSyntaxError)
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
 * Tokenizes a source string with given tokens.
 * This class is called implcitly from Parser and GrammarParser.
 * You most will likely not have to call it directly.
 * The tokens produced as a result of this operation is used by Parser
 * @property {Array.<string>} lines  The source lines detected during scan
 * @property {Array.<Token>}  tokens The tokens created by the scan
 */
export class Lexer {
  lines = [];
  tokens = [];
  _pos = -1;
  _biggestAcceptPos = -1;
  _stackPos = [];

  /**
   * Constructor for Lexer class
   * @param {TokenMatches} tokenMatches match against these, Token gets the name of key, matches against value of key
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
    this.newRowRegex = newRowRegex;
    this.source = source;
    this.errorType = errorType;
    this.filterOutTokens = filterOutTokens;
    let tokStr, beginLine = 0, res = null, escaped = false,
        i = 1, b = 0;

    const tokenMatchEntries = Object.entries(this.tokenMatches);

    const addToken = (token, tokStr, b) => {
      const line = this.lines.length+1, col = b - beginLine;
      if (newRowRegex.test(tokStr) &&
          curStates[curStates.length-1] != 'stringState') {
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

    const checkStates = (b) => {
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
    }

    // tokenize
    const curStates = [];
    for (i = 1, b = 0; i <= source.length; ++i) {
      const dbgStr = this.source.substring(b, i);
      checkStates(b);

      if (tokenMatchEntries.find(([token, m])=>{
        if (m.state && !curStates.find(s=>s.n===m.state))
          return; // handles states such as open and close string ' '
        if (token === 'special_sequence' && Array.isArray(m)) {
          for (const ss of m) {
            const res = ss.cb(this.source.substr(b));
            if (res !== undefined) {
              addToken(ss.n, res, b);
              b += res.length; i = b - 1;
              checkStates(b); // might need to end current state
              break;
            }
          }
        } else if (m.r) {
          res = m.r.exec(this.source.substr(b));
          if (res && res.index === 0) {
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
   * @returns {Token} current token
   */
  curTok() {
    return this._navTokens[this._pos];
  }

  /**
   * Advances internal pointer +1 and returns that token
   * @returns {Token} next token
   */
  nextTok() {
    return this._navTokens[++this._pos];
  }

  /**
   * Reverse internal point -1 and returns that pointer
   * @returns {Token} previous token
   */
  prevTok() {
    return this._navTokens[--this._pos];
  }

  /**
   * Get the very first token among all tokens
   * @returns {Token} the first token in scanned tokens
   */
  firstToken() {
    return this._navTokens[0];
  }

  /**
   * Get the very last token among tokens
   * @returns {Token} The last token in scanned tokens
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
   * @returns {Token} The token at pos
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
    return this._pos >= this._navTokens.length;
  }

  /**
   * Returns the last token that parser has accpted
   * Usefull in error messages
   * @returns {Token} The last token that has gotten accepted
   */
  lastAcceptedTok() {
    return this._navTokens[this._biggestAcceptPos];
  }

  /**
   * Peek into tokens list forward or reverse
   * @param {number} [steps=1] How many steps from current we want to peek, may be negative, default +1
   * @returns {Token} The token at steps pos or undefined
   */
  peekTok(steps = 1) {
    return this._navTokens[this._pos + steps];
  }

  /**
   * Starts a transaction, is reentant.
   * @returns {Token} current token
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
 * All terminals found at each rule in grammar
 * @typedef {Object.<string, Array.<string>>} RuleTerminals
 * @example
 * {
 *   symbol:['(',')','[',']','{','}','<','>',',','.','!'],
 *   switch:['switch','case','default']
 * }
 */


/**
 * The root parser for the extended backus naur format.<br/>
 * Converts grammar source to grammar AST.
 * Parser then uses the grammar tree, produced here, to build a CST of your program source code.
 * @prop {SyntaxTreeNode}      cstRoot The CST tree root node
 * @prop {AstTreeNode}         astNode The AST tree root node
 * @prop {Array.<AstTreeNode>} rules   All syntax rules optained from grammar
 * @prop {Object.<string>}     opposites  opening chars matching closing char, ie '(' -> ')'
 * @prop {TokenMatches}        ebnfTokenMatches The tokens needed to parse EBNF grammar
 * @prop {RuleTerminals}       terminals All terminals found at each token in grammar source
 * @example
 *   // se below for grammar examples
 *   const grmParser = new GrammarParser(grammar, 'start');
 *   grmParser.checkGrammar(); // optionally check that grammar is valid
 *   ...
 *   const parser = new Parser({grmParser, source:"text to parse as string"});
 *
 * @example
 *   const source = `
 *     var id = 123;
 *     if (id>0) {id=321;}
 *   `;
 *   const grammar = `
 *     start  = {stmt};
 *     stmt   = decl | ifStmt;
 *     decl   = 'var', assign;
 *     assign = ident, '=', number, ';';
 *     ifStmt = 'if', '(', compar, ')', '{', assign, '}';
 *     compar = vlu, ('<'|'>'|'=='), vlu;
 *     vlu    = ( ident | number );
 *     (* match id, di, i or d *)
 *     ident  = {'i'|'d'};
 *     (* match 1,2,3,12,13,21,23,31,32,123,321,132,312 *)
 *     number = {'0'|'1'|'2'|'3'};
 *    `;
 */
export class GrammarParser {
  // Used as lookup table on how to name a terminal found in grammar
  // token gets this typename when program source is lexically scanned
  static defaultTokenNames = {
    '...':'ellipsis','==':'dblequal','<=':'lteq','>=':'gteq',
    '!=':'excleq','≠':'noteq',
    '{':'lbrace', '}':'rbrace','[':'lbracket',']':'rbracket',
    '(':'lparen',')':'rparen','=':'equal','!':'exclamation',
    '?':'question',':':'colon',';':'semicolon',',':'comma',
    '.':'period','+':'plus','-':'minus','*':'star','/':'slash',
    '\\':'backslash','\'':'sglquote','"':'dblqote','^':'caret',
    '~':'tilde','@':'at','•':'bullet','%':'percent','‰':'permille',
    '&':'ampersand','|':'bar','_':'underscore','<':'lt','>':'gt',
    '÷':'division','≈':'approx','≠':'notequal','≥':'gtorequal',
    '≤':'ltorequal','√':'sqroot','°':'degree','π':'pi','∞':'infinity',
    '≡':'equivalence','∆':'delta','∑':'sigma','φ':'goldenratio'
  };
  opposites = {'[':']', '{':'}', '(':')'};

  ebnfTokenMatches = {
    comment: {r:/^\(\*(?:\n|\r|[^*]|\*[^\)])*\*\)/m, ignore: true},
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
   * @param  {string}  source The EBNF grammar to parse
   * @param  {string}  entryPointRule The program entrypoint
   * @param  {boolean} [ignoreNewline=true] Ignore newlines when tokenMatches are generated
   * @throws {GrammarSyntaxError} When a syntax error in grammar occurs
   */
  constructor(
    source,
    entryPointRule,
    ignoreNewline=true,
    defaultTokenNames=GrammarParser.defaultTokenNames
  ) {
    this.entryPointRule = entryPointRule;
    this.ignoreNewline = ignoreNewline;
    this._defaultTokenNames = defaultTokenNames;

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

    // check that we dont declare a rule twice with same name
    const rules = [];
    for(const rule of this.rules) {
      if (rules.indexOf(rule.value)>-1)
        throw new GrammarSyntaxError(`Rule ${rule.value} declared twice`, rule.cstNode.tok?.parseInfo);
      rules.push(rule.value);
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

  _keyForTerminal(n, ruleName) {
    if (n.cstNode.type === 'special_sequence')
      return 'special_sequence';

    // if rule has a single child name it after rulename, else after default rules
    return !this.rules.find(r=>r==ruleName)?.left.right ?
              this._defaultTokenNames[n.value] || ruleName :
                ruleName;
  }

  _findTerminalInRule(n, ruleName, cache) {
    if (n.type === 'terminal') {
      const key = this._keyForTerminal(n, ruleName);

      if (!cache[n.value]) {
        cache[n.value] = key;
        if(!this.terminals[key])
          this.terminals[key] = [];
        const vlu = key === 'special_sequence' ?
          n.cstNode.tok?.str : n.value;
        this.terminals[key].push(vlu);
        if (this.lexer.newRowRegex.test(n.value) || n.value === ' ')
          this.terminals[key].state = "stringState";
      }
    }
    // check children
    if (n.left) this._findTerminalInRule(n.left, ruleName, cache);
    if (n.right) this._findTerminalInRule(n.right, ruleName, cache);
  }

  _sortAndMergeTerminalCache(cache) {
    // sort them on length, longest first
    const cacheKeysArr = Object.keys(cache).sort((a,b)=>
      a.length < b.length ? 1 : a.length > b.length ? -1 : 0);

    const cacheRulesSorted = cacheKeysArr.map(idx=>cache[idx]);
    const cache2Arr =  cacheRulesSorted.reduce((arr,c,i)=>{
    const needleIdx = cacheRulesSorted.findIndex(itm=>itm.substring(0,c.length)===c);
    const rule = cacheRulesSorted[needleIdx];
    if (needleIdx != i && needleIdx>-1) {
      // found another entry which matches,
      // as it is sorted longest first it should already be in arr
      // make sure we don't ha another rule above us, then we must introduce a new rule
      const entries = arr.map((itm, i)=>{
        if (itm.n.substring(0, rule.length)===rule)
          return i;
      }).filter(e=>e);
      const entryIdx = entries[entries.length-1];
      if (entryIdx=== arr.length -1) {
        arr[entryIdx].v.push(cacheKeysArr[i]);
      } else { // we have a entry with higher precedence
        const entries = arr.filter(e=>e.n.substring(0, c.length)===c);
        arr.push({n:rule+'_'+entries.length, v:[cacheKeysArr[i]], o:c});
      }
      return arr;
    }
    arr.push({n:rule, v:[cacheKeysArr[i]]});
    return arr;
    },[]);
    return cache2Arr;
  }

  _retrieveTerminalsFromGrammar() {
    // store all possible terminals
    this.terminals = {};
    const cache = {};

    // walk the ast tree to find terminals
    for (let n = this.astRoot; n = n.right;)
      this._findTerminalInRule(n.left, n.value, cache);

    // automatically create tokenmatches from these terminals
    this.tokenMatches = {};
    for(const entry of this._sortAndMergeTerminalCache(cache)) {
      const key = entry.n, vlu = entry.v;
      let tokenMatch = {};
      if (key === 'special_sequence')
        tokenMatch = vlu;
      else if (vlu.length > 1) {
        const mustEscape = ".\\+*?[^]$(){}=!<>|:-";
        const v = vlu.map(c=>c && mustEscape.indexOf(c) > -1 ? `\\${c}` : c).join('|');
        tokenMatch.r = new RegExp(`^(?:${v})`);
      } else
        tokenMatch.s = vlu[0];
      if (this.terminals[key]?.state)
        tokenMatch.state = this.terminals[key].state;
      else if (this.terminals[entry.o]?.state)
        tokenMatch.state = this.terminals[entry.o].state;
      const postfix = Object.keys(this.tokenMatches)
        .filter(m=>m.substring(0,key.length)===key).length;
      const matchKey = key + (postfix?`_${postfix}`:'');
      this.tokenMatches[matchKey] = tokenMatch;
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
    this.cstRoot = new SyntaxTreeNode("grammar");

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
    const equalSymbol = new SyntaxTreeNode("symbol", tok);

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

    const semiColon = new SyntaxTreeNode("symbol", tok);

    this.lexer.acceptPos();

    const rule = new SyntaxTreeNode("rule");
    return rule.addChild([lhs, equalSymbol, rhs, semiColon]);
  }

  _rhs() {
    let tok = this.lexer.tryPos(), optpart;
    const children = [];

    const createRhs = () => {
      this.lexer.acceptPos();
      const rhs = new SyntaxTreeNode("rhs");
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
              alternationSep = new SyntaxTreeNode(tok.type, tok)
              alternationSep.addChild(children.pop()); // insert first required part as child to alternation
              children.push(alternationSep);
            }
            // prepare for next concat
            concatSep = null;
            alternationSep.addChild(optpart);
          } else if (tok.str === ',') {
            if (!concatSep) {
              const prev = (alternationSep?.children||children).pop();
              concatSep = new SyntaxTreeNode(tok.type, tok);
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
    const lhs = new SyntaxTreeNode("lhs");
    return lhs.addChild([identifier])
  }

  _rhspart() {
    let tok = this.lexer.tryPos();

    const createRhsPart = (child)=>{
      this.lexer.acceptPos();
      const rhspart = new SyntaxTreeNode("rhspart");
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
        const openNode = new SyntaxTreeNode(tok.type, tok);
        tok = this.lexer.nextTok();
        const rhs = this._rhs();
        if (rhs) {
          tok = this.lexer.nextTok();
          if (tok.str !== this.opposites[openCh]) {
            this._setError(`Expected '${this.opposites[openCh]}'`, tok);
            return this.lexer.rejectPos();
          }
          const closeNode = new SyntaxTreeNode(tok.type, tok);

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
    if (tok.type !== 'special_sequence')
    {
      if (tok.str !== '"' && tok.str !== "'")
        return this.lexer.rejectPos();
      children.push(new SyntaxTreeNode(tok.type, tok));

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
        children.push(new SyntaxTreeNode(tok.type, tok));
        tok = this.lexer.nextTok();
      }

      if (!tok || tok.str !== openCh)
        this._throwError(`Expected matching '${openCh}'`, tok);

      if (children.length < 2)
        this._throwError(`Expected litteral before ${openCh}`, tok);

    }

    children.push(new SyntaxTreeNode(tok.type, tok));
    this.lexer.acceptPos();

    const terminal = new SyntaxTreeNode('terminal');
    return terminal.addChild(children);
  }

  _identifier() {
    let tok = this.lexer.tryPos();

    if (tok.type !== 'litteral')
      return this.lexer.rejectPos();

    const required = new SyntaxTreeNode(tok.type, tok);

    this.lexer.tryPos();
    const optional = [];
    tok = this.lexer.nextTok();
    while (tok && ['litteral','number','underscore'].indexOf(tok.type) > -1) {
      optional.push(new SyntaxTreeNode(tok.type, tok));
      tok = this.lexer.nextTok();
    }

    optional.length ?
      this.lexer.prevTok() && this.lexer.acceptPos() :
        this.lexer.rejectPos();

    this.lexer.acceptPos();
    const identifier = new SyntaxTreeNode("identifier");
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
       new AstTreeNode(this.cstRoot, new ProdProgramRoot(this));
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
      const ast = new AstTreeNode(rule, new ProdRule(this), 'rule', ruleName);
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
      const ast = new AstTreeNode(cstNode, action,
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
    case 'special_sequence':
      return this._toAst_specialsequence(firstCh);
    case 'symbol':
      const ch = firstCh.tok.str;
      const action = (ch === '[') ? new ProdOptional(this) :
                       (ch === '{') ? new ProdRepetition(this) :
                        new ProdGrouping(this);

      let ast;
      const chNode = this._toAst_rhs(rhspart.children[1]);
      if (chNode) {
        ast = new AstTreeNode(firstCh,
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
    if (terminal.children[0].tok.type === 'special_sequence')
      return this._toAst_specialsequence(terminal.children[0]);

    const str = this._getTerminalStr(terminal);
    return new AstTreeNode(
      terminal, new ProdTerminal(this), "terminal", str);
  }

  _toAst_specialsequence(sequence) {
    const name = sequence.tok.str;
    return new AstTreeNode(
      sequence, new ProdSpecialSequence(this), "terminal", name);
  }

  _toAst_identifier(identifier) {
    const str = this._getIdentifierStr(identifier);
    return new AstTreeNode(
      identifier, new ProdIdentifier(this), "identifier", str);
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
Object.freeze(GrammarParser.defaultTokenNames);

// ----------------------------------------
/**
 * Parser specific actions/productions. GrammarParser produces these.
 * They parses your program into a Complex syntax tree.
 */

class ProdBase {
  constructor(grmParser, astNode /*= undefined*/) {
    this.grmParser = grmParser;
    this.astNode = astNode // if undefined here, set by AstTreeNode constructor
  }

  _throwSyntaxError(lex, tok) {
    if (!tok)
      tok = lex.tokens[lex._biggestAcceptPos];
    if (!tok) tok = lex.curTok();
    const pNfo = !tok ? new ParseInfo(1,0) : tok.parseInfo;
    const errLine = lex.lines[pNfo.line-1]?.substr(0, pNfo.col);
    throw new SyntaxError(`Syntax error near '${errLine}' at line: ${pNfo.line} col: ${pNfo.col}`);
  }
}


class ProdProgramRoot extends ProdBase {
  name = 'root';
  check(lex, parser) {
    lex.nextTok();
    const entryPoint = this.astNode.right;

    const rootNode = entryPoint.action.check(lex, parser);
    if (rootNode) return rootNode;
    return null;
  }
}

// rule = .....
class ProdRule extends ProdBase {
  name = 'rule';
  check(lex, parser) {
    const chNode = this.astNode?.left.action.check(lex, parser);
    if (chNode) {
      const pgmCst =  new SyntaxTreeNode(this.astNode.value);
      return pgmCst.addChild(chNode);
    }
    return null;
  }
}

// ( id1, id2 ...)
class ProdGrouping extends ProdBase {
  name = 'grouping';
  check(lex, parser) {
    const chNode = this.astNode?.left.action.check(lex, parser);
    if (chNode) {
      return chNode;
    }
    return null;
  }
}

// one or more { needle ... }
class ProdRepetition extends ProdBase {
  name = 'repetition';
  check(lex, parser) {
    let n = this.astNode, chNode;
    const childs = [];
    if (n.left) {
      let lastGoodTok = lex.tryPos();
      for(; !lex.isAtEnd() && n?.left &&
           (chNode = n.left.action.check(lex, parser));)
      {
        if (lex.curTok() !== lastGoodTok){
          Array.isArray(chNode) ? childs.push(...chNode) : childs.push(chNode);
          lastGoodTok = lex.curTok();
        } else {
          break; // prevent endless loop with optional inside a repetition
        }
      }

      if (!childs.length)
        return lex.rejectPos();

      lex.acceptPos();
      return childs;
    }
    // return from endles loop;
    return childs;
  }
}

// [option...]
class ProdOptional extends ProdBase {
  name = 'optional';
  check(lex, parser) {
    const chNode = this.astNode.left.action.check(lex, parser);
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
    let n = this.astNode;
    const childs = [];
    for(; n && n.left; n = n.right) {
      lex.tryPos();
      const chNode = n.left.action.check(lex, parser)
      if (!chNode) {
        lex.rejectPos();
        return null;
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
    let n = this.astNode;
    for(; n && n.left; n = n.right) {
      const chNode = n.left.action.check(lex, parser);
      if (chNode) {
        lex.acceptPos();
        return chNode;
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

    const value = children.reduce((vlu, ch)=>vlu+ch.tok?.str, "");
    const synthTok = {...children[0].tok, str:value, type:'terminal'};
    pgmCst.children.splice(0);
    pgmCst.addChild(new SyntaxTreeNode(synthTok.type, synthTok));
  }

  _accept(lex, parser, chNode) {
    const pgmCst = new SyntaxTreeNode(this.astNode.value);
    pgmCst.addChild(chNode);
    lex.acceptPos();
    if (parser.flattenRules.indexOf(this.astNode.value)>-1)
      this._flatten(pgmCst);
    return pgmCst;
  }

  check(lex, parser) {
    const entryTok = lex.tryPos();

    let chNode;
    const cached = parser._prodIdentifierCache[this.astNode.value];
    if (cached) {
      parser.traceTry(this.astNode, entryTok);
      if (chNode = cached.action.check(lex, parser)) {
        parser.traceAccept(this.astNode, entryTok);
        return this._accept(lex, parser, chNode);
      }
      parser.traceReject(this.astNode, entryTok);
      return lex.rejectPos();
    } else {
      // lookup the rule for this identifier
      let n = this.grmParser.astRoot;
      while (n = n.right) {
        if (n.value === this.astNode.value) {
          parser.traceTry(this.astNode, entryTok);
          parser._prodIdentifierCache[n.value] = n.left;
          if (chNode = n.left.action.check(lex, parser)) {
            parser.traceAccept(this.astNode, entryTok);
            return this._accept(lex, parser, chNode);
          }

          parser.traceReject(this.astNode, entryTok);
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
          escNodevlu = `${this.astNode.value}`;
    if (tok && escTokStr === `${escNodevlu}`) {
      const pgmCst = new SyntaxTreeNode(this.astNode.type, tok);
      lex.nextTok();

      return pgmCst;
    }
    return null;
  }
}

class ProdSpecialSequence extends ProdBase {
  name = 'special_sequence';
  check(lex, parser) {
    const tok = lex.curTok();
    if (tok?.type === this.astNode.value) {
      const pgmCst = new SyntaxTreeNode(this.astNode.type, tok);
      lex.nextTok();
      return pgmCst;
    }
    return null;
  }
}

// --------------------------------------------

/**
 * Drop these terminals (char sequences) from tree when creating Ast nodes.
 * Drop from rule given by object key name.
 * @typedef {Object.<string, Array.<string>>} TerminalsOnRules
 * @example
 * {
 *   // drops ',' from tree, but only directly under rule arguments
 *   arguments:[','],
 *   assignment:['='], // likewise but under assignment
 *   ignore:['\\n']
 * }
 */

/**
 * Attach Action to all rules of type. For every ifStatment for example.
 * @typedef {Object.<string, ActionBase>} ActionForRules
 * @example
 * {
 *   // attach MyFuncAction to all ifStmt rules
 *   ifStmt: MyFuncAction,
 *   // likewise for whileStmt
 *   whileStmt: MyWhileAction
 * }
 */

/**
 * Delegate AST generation to this callback
 * @callback GenerateFunc
 * @prop   {SyntaxTreeNode} cst The CST to generate
 * @prop   {Parser} parser The parser that calls this callback
 * @returns {AstTreeNode} The AST node generated (And all subnodes to this node)
 * @see Parser.generateNode(cstNode)
 */

/**
 * Delegate AST generation for a specific rule to this function
 * @typedef {Object.<string, GenerateFunc>} GenerateFuncs
 * @example
 * {
 *   callExpr: (cst, parser) => {
 *      const newAst = parser.createAstNode(cst);
 *      // do stuff with newAst
 *      ....
 *      return newAst;
 *   },
 *   compareExpr: (cst, parser) => {
 *      // create explicitly
 *      const newAst = new AstSyntaxTree(cst, 'specialtype');
 *      ... do stuff with our astNode
 *      return newAst;
 *   }
 * }
 */

/**
 * Parses a programs source text based of the grammar in GrammarParser
 * This class parser your program
 * @prop {GrammarParser}  grmParser  Reference to the GrammarParser used to parse source code.
 * @prop {SyntaxTreeNode} prgCstRoot The root node in CST tree of your parsed source.
 * @prop {AstTreeNode}    prgAstRoot The root node in AST tree of your parsed source. With this tree you can build your VM to run your program.
 * @example
 *  const grammar = `
 *    (* entrypoint for your program *)
 *    start={stmt};
 *    stmt=.....;
 * `;
 *  const grmParser = new GrammarParser(grammar, 'start');
 *  const parser = new Parser({
 *    grmParser, // need to have a parsed grammar to use when parsing
 *    source: ...text you want to parse...,
 *    // ignore these when building AST
 *    dropTerminalsOnAllRules:[',','{','}','(',')'....],
 *    // attach These actions to a specific rule.
 *    // Should inherit from ActionBase
 *    actionForRules:{
 *      stmt: MyStmtAction, expr: MyExprAction,....
 *    },
 *  });
 *
 * @example
 *  // if using special_sequence, same as above up to Parser constructor
 *    const grammar = `
 *      .....
 *      string=? string_sequence ?;
 *    `;
 *
 *    .....
 *
 *      stmt: MyStmtAction, expr: MyExprAction,....
 *    },
 *    tokenMatches:{
 *      // spread default tokenMatches retrieved from grammar
 *      ...grmParser.tokenMatches,
 *      special_sequence:[
 *        // matches ? string_sequence ?  in grammar
 *        {n:'string_sequence', cb:(str)=>{
 *           const res = /^(?:(")(?:\\\1|[^"])*\1|(?:(')(?:\\\2|[^'])*\2))/um.exec(str);
 *           if (res) return res[0];
 *        }}
 *      ]
 *    }
 *
 * @example
 *   // walk the tree after parser has created it:
 *   .... create parser as above
 *
 *   const root = parser.prgAstRoot;
 *   root.action.visit(); // visit root and all subnodes
 *                        // Your custom Actions must delegate
 *                        // or visit left and right child automatically
 * @see ActionBase
 * @see AstTreeNode
 * @see SyntaxTreeNode
 * @see GrammarParser
 */
export class Parser {
  _prodIdentifierCache = {};
  _traceIndent = 0;
  /**
   * Constructs a new Parser instance
   * @param {Object} arg - The args object
   * @param {GrammarParser}   arg.grmParser The grammar for this source text
   * @param {string}          arg.source The program source text
   * @param {TokenMatches}    arg.tokenMatches The tokens to match against
   * @param {Array.<string>}  [arg.flattenRules] Join all subgroups that is't terminal under this node
   * @param {Array.<string>}  [arg.dropTerminalsAllRules] Drop all of these terminals ie ['{','}',';']
   * @param {TerminalsOnRules} [arg.dropTerminalsOnRules] Remove terminals from specific rule, overrides dropTerminalsOnAllRules
   * @param {ActionBase}       [arg.defaultAction=ActionBase] Attach this action to all rules
   * @param {ActionForRules}   [arg.actionForRules] Overrides default action for these rules
   * @param {Array.<string>|boolean} [arg.bypassRules] Bypasses node when AST is generated, rule must not have more than one child
   * @param {GenerateFuncs}   [arg.generateFuncs] Delegate AST generation for these rules
   * @param {boolean}         [arg.trace=false] Activate tracing (Used when debugging)
   * @throws {SyntaxError}  When it is't possible to parse the complete source
   */
  constructor({
    grmParser,
    source,
    tokenMatches = {...grmParser.tokenMatches},
    flattenRules = [],
    trace=false,
    dropTerminalsOnAllRules=[],
    dropTerminalsOnRules={},
    defaultAction=ActionBase,
    bypassRules=false,
    actionForRules={},
    generateFuncs={}
  }) {
    this.grmParser = grmParser;
    this.lexer = new Lexer({tokenMatches, source});

    this.flattenRules            = flattenRules;
    this.dropTerminalsOnAllRules = dropTerminalsOnAllRules;
    this.dropTerminalsOnRules    = dropTerminalsOnRules;
    this.defaultAction           = defaultAction;
    this.bypassRules             = bypassRules;
    this.actionForRules          = actionForRules;
    this.generateFuncs           = generateFuncs;

    let startPoint = this.grmParser.astRoot.action;
    this.grmAstNode = this.grmParser.astRoot;

    if (trace) { // reroute tracerfunctions
      this.trace       = this._trace;
      this.traceTry    = this._traceTry;
      this.traceReject = this._traceReject;
      this.traceAccept = this._traceAccept;
      this.tracePush   = this._tracePush;
      this.tracePop    = this._tracePop;
      this._traceStack = [];
    } else {
      this.trace = this.traceAccept = this.traceReject =
      this.tracePush = this.tracePop = this.traceTry = ()=>{};
    }

    // walk grammar production tree to produce as CST tree of source
    this.prgCstRoot = startPoint.check(this.lexer, this);

    if (!this.prgCstRoot || !this.lexer.isAtEnd())
      startPoint._throwSyntaxError(this.lexer);

    // walk the tree to generate AST
    this.prgAstRoot = this.generateNode(
      this.prgCstRoot, this);
  }

  /**
   * Generates to AST tree branch for cstNode.
   * If called on root it generates the complete tree, obviously...
   * @param {SyntaxTreeNode} cstNode The CST to create and iterate over it's children
   * @param {Parser} parser Reference to this parser
   * @returns {AstTreeNode} The treeBranch created by cstNode
   * @example
   *   // example using generateFuncs option in constructor
   *
   *   // special case all nodes that must have an operator
   *   // ie: : '+', '-', '*', '/'
   *   function genInfix(cst, parser) {
   *     const ast = parser.generateNode(cst);
   *     ast.action.operator = cst.children[1]?.tok?.str;
   *     return ast;
   *   }
   *
   *   ...
   *
   *   const parser = new Parser({
   *     grmParser, source: "your text to parse as string",
   *     ...
   *     generateFuncs:{
   *       add: genInfix,      subtract: genInfix,
   *       multiply: genInfix, divide: genInFix,
   *     }
   *   })
   *
   */
  generateNode(cstNode, parser) {
    if ((Array.isArray(this.bypassRules) &&
         this.bypassRules.indexOf(cstNode.type)>-1) ||
        (this.bypassRules===true && cstNode.children.length < 2 &&
         cstNode.parent)) // dont remove entrypoint
    {
      if (cstNode.children.length > 1)
        throw new GrammarSyntaxError(
          `Can't bypass rule '${cstNode.type}', it has more than one child`);
      if (cstNode.children.length === 1)
        return this.generateNode(cstNode.children[0]);
      // else generate this node
    }

    if (this.generateFuncs[cstNode.type])
      return this.generateFuncs[cstNode.type](cstNode, this);

    const root = this.createAstNode(cstNode);
    let ast = root, chNode;
    for (const ch of cstNode.children) {
      if (this._shouldDrop(cstNode, ch)) continue;
      if (ch.type === 'terminal') {
        chNode = this.createAstNode(ch);
      } else {
        const genFunc = this.generateFuncs[ch.type] ||
                          this.generateNode.bind(this);
        chNode = genFunc(ch, this);
      }

      if (ast.right) {
        // more then 2 children, add a subnode at the right
        // effectivy treat node.right as a linked list
        const newAst = this.createAstNode(cstNode);
        newAst.addLeft(ast.right);
        ast.addRight(newAst);
        ast = newAst;
      }

      ast.left ?
        ast.addRight(chNode) :
        ast.addLeft(chNode);
    }
    return root;
  }

  /**
   * Creates a new AST node from cstNode
   * @param   {SyntaxTreeNode} cstNode The CSTnode to create from
   * @returns {AstTreeNode}    The created AST node
   */
  createAstNode(cstNode) {
    const actionType = this.actionForRules[cstNode.type] || this.defaultAction;
    const action = new actionType(this);
    return new AstTreeNode(cstNode, action, cstNode.type, cstNode.tok?.str);
  }

  lookupTokForNode(node) {
    if (node instanceof AstTreeNode)
      node = node.cstNode;
    if (node.tok) return node.tok;
    for (const c of node.children) {
      const t = this.lookupTokForNode(c);
      if (t) return t;
    }
  }

  _trace(text, node, tok) {
    if (!this.trace) return
    if (!tok) {
      if (this.lexer.isAtEnd())
        tok = this.lexer.lastToken();
      else
        tok = this.lookupTokForNode(node);
    }
    const pos = `ln:${tok?.parseInfo.line||-1}`+
                `,cl:${tok?.parseInfo.col >=-1 ? tok.parseInfo.col :-1}`;
    let p = node.parent
    for (; p && p.type != 'rule'; p = p.parent)
      ;
    const vlu = node.value || node.type || node.action?.type,
          pvlu = p?.value || p?.type || p?.action?.type;
    const tokVlu = `'${tok.str.substr(0,3).replace('\n', '\\n')}` +
                   `${(tok.str.length>3 ? ".." : "")}'`;

    const chainStr = this._traceStack.join(' ')
      .replace(/^(.{20}).*(.{50})$/, "$1...$2");

    console.log(`${tokVlu.padEnd(7)} |${text} ${vlu}(${pvlu})`
                  .padEnd(60)+`${pos.padEnd(15)}`+
                  `${chainStr}`);
  }

  _traceTry(node, tok) {
    this._tracePush(node.value || tok?.str)
    const str = "".padStart(this._traceIndent,'.') + "try ".padEnd(8);
    this._trace(str, node, tok);
    this._traceIndent++;
  }

  _traceAccept(node, tok) {
    const str = "".padStart(this._traceIndent,'.') + "accept ".padEnd(8);
    this._traceIndent--;
    this._trace(str, node, tok);
    this._tracePop();
  }

  _traceReject(node, tok) {
    const str = "".padStart(this._traceIndent,'.') +  "reject ".padEnd(8);
    this._traceIndent--;
    this._trace(str, node, tok);
    this._tracePop();
  }

  _tracePush(name) {
    this._traceStack.push(name);
  }

  _tracePop() {
    this._traceStack.pop();
  }

  _shouldDrop(cstNode, ch) {
    return ch.type === 'terminal' &&
      (this.dropTerminalsOnAllRules.indexOf(ch.tok?.str) > -1 ||
       this.dropTerminalsOnRules[cstNode.type]?.indexOf(ch.tok?.str) > -1);
  }
}

