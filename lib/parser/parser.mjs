"use strict";

// this parser follows extended backus naur form
// https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

export class SyntaxTreeNode {
  constructor(parent, type, tok, children = []) {
    this.parent = parent;
    parent?.children.push(this);
    this.type = type;
    this.tok = tok;
    this.children = children;
  }

  remove() {
    const idx = this.parent?.children.indexOf(this);
    if (+idx > -1) this.parent?.children.splice(idx,1);
    return true;
  }

  flat() {
    return [this, ...this.children.flatMap(c=>c.flat())];
  }
}

export class ParseInfo {
  constructor(line = -1, col = -1) {
    this.line = line;
    this.col = col;
  }
}

export class GrammarSyntaxError extends SyntaxError {
  constructor(message = '', parseInfo = new ParseInfo()) {
    super(`${message} at line ${parseInfo.line} pos ${parseInfo.col}`);
    this.parseInfo = parseInfo;
    this.name = "GrammarSyntaxError";
  }
}

class ProdBase {
  list = [];
  constructor(ownerRule, parseInfo, separator = '') {
    this.ownerRule = ownerRule;
    this.parseInfo = parseInfo;
    this.separator = separator;
    this.lexer = ownerRule.parser.lexer;
  }
  accepts(tok) { return false; }
  init() {
    for (const prod of this.list)
      prod.init();
  }
  toString() {
    return this.list.map(p=>p.toString()).join(`${this.separator}`);
  }
}

class ProdAlternation extends ProdBase {
  constructor(matches, ownerRule, parseInfo) {
    super(ownerRule, parseInfo, ' | ');
    this.list = [...matches];
    this.grmLine = grmLine;
  }
  accepts(tok) {
   // accept one of
   if (this.list.indexOf(tok.str) > -1)
     return this.lexer.acceptPos();
   return false;
  }
}

class ProdConcatination extends ProdBase {
  constructor(concats, ownerRule, parseInfo) {
    super(ownerRule, parseInfo, ' , ');
    this.list = [...concats];
  }
  accepts(tok) {
    // in sequence
    this.lexer.tryPos();
    for(const prod of this.list) {
      if (!prod.accepts(tok))
        return this.lexer.popPos();
      tok = this.lexer.nextTok();
    }
    this.lexer.acceptPos();
    return tok;
  }
}

class ProdTermination extends ProdBase {
  constructor(ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
  }
  accepts(tok) {return tok; }
  toString() { return ';' }
}

class ProdOptional extends ProdBase {
  // may accept one
  constructor(optionalProduction, ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
    this.list.push(optionalProduction);
  }
  accepts(tok) {
    if (this.list[0].accepts(tok))
      this.lexer.acceptPos();
    return tok;
  }
  toString(){
    return `[${super.toString()}]`;
  }
}

class ProdRepetition extends ProdBase {
  constructor(repetitonProduction, ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
    this.list.push(repetitonProduction);
  }
  accepts(tok) {
    // one or more
    let resTok = false;
    while(tok = this.list[0].accepts(tok)) {
      this.lexer.tryPos();
      tok = this.lexer.nextTok();
    }
    if (resTok) this.lexer.acceptPos();
    return resTok;
  }
  toString(){
    return `{${super.toString()}}`;
  }
}

class ProdGrouping extends ProdBase {
  constructor(groupingProductions, ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
    this.list = [...groupingProductions];
  }
  accepts(tok) {
    this.lexer.tryPos()
    for (const prod of this.list) {
      if (!prod.accepts(tok))
        return this.lexer.rejectPos();
      tok = this.lexer.nextTok();
    }
    return this.lexer.acceptPos();
  }
}

class ProdIdentfier extends ProdBase {
  constructor(followRule, ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
    this.list = [...followRule];
  }
  accepts(tok) {
    return this.rule.accepts(tok);
  }
  init(){
    this.rule = this.ownerRule.parser.rules[this.list[0]];
    if (!this.rule)
      throw new GrammarSyntaxError(`Rule '${this.list[0]}' not found`);
  }
}

class ProdString extends ProdBase {
  constructor(string, ownerRule, parseInfo) {
    super(ownerRule, parseInfo);
    this.list[0] = string;
  }
  accepts(tok) {
    const match = this.list[0].replace(/^("|')(.*)(\1)$/gm,"$2")
    if (new RegExp(`^("|')${this.list[0]}(\\1)$`, gm).test(tok.str))
      return tok;
  }
}

export class Rule {
  constructor(parser, name, production) {
    this.parser = parser;
    this.name = name;
    this.prodGroup = production;
  }
}

/**
 * @breif Tokenizes a source string with given tokens,
 *        result of this operation used by parser
 * @property {Array.<string>} lines The source lines detected during scan
 * @property {Array.<token>} tokens The tokens created by the scan
 */
export class Lexer {
  lines = [];
  tokens = [];
  _pos = -1;
  _stackPos = [];

  /**
   * @breif Constructor for Lexer class
   * @param {Array.<{key:{s:string, r:RegExp, ignore:boolean}} >} tokenMatches match against these, Token gets the name of key, matches against value of key
   * @param {string} source The source code to tokenize
   * @param {Error} [errorType=SyntaxError] The type error to throw when syntax error occurs
   * @param {string} [commentToken] The name of a commenttoken
   * @param {RegExp} [newRowRegex] A custom new line regexp matcher, default unescaped newline
   * @param {RegExp} [ignoreRegex] A custom ignore char regexp, default whitespace
   */
  constructor({
     tokenMatches, source,
     errorType = SyntaxError,
     commentToken,
     newRowRegex = /^[^\\ \t\r\n]?\r?\n/,
     ignoreRegex = /^(?:[^\S\\]?(?:\r|[ \t\f]+)|\\)/})
  {
    this.tokenMatches = tokenMatches;
    this.source = source;
    this.errorType = errorType;
    this.commentToken = commentToken;

    const tokenMatchEntries = Object.entries(this.tokenMatches);

    const addToken = (token, tokStr, b) => {
      this.tokens.push({
        str:tokStr, type:token,
        parseInfo: new ParseInfo(this.lines.length+1, b - beginLine)
      });
    }

    // tokenize
    let tokStr, beginLine = 0, res;
    for (let i = 1, b = 0; i <= source.length; ++i) {
      const dbgStr = this.source.substring(b, i);

      if (tokenMatchEntries.find(([token, m])=>{
        if (m.r) {
          res = m.r.exec(this.source.substr(b));
          if (res) {
            if (res.length > 1)
              tokStr = res.slice(1).find(r=>r);
            else
              tokStr = res[0];
            addToken(token, tokStr, b);
            b += res[0].length; i = b - 1;
            return !m.ignore;
          }
        } else if (m.s === this.source.substr(b, m.s.length)) {
          tokStr = this.source.substr(b, m.s.length);
          addToken(token, tokStr, b);
          b += tokStr.length; i = b - 1;
          return !m.ignore;
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
      } else if (i > b)
        throw new this.errorType(`'${this.source.substring(b,i)}' at line ${this.lines.length} col ${i - beginLine}`);
    }

    this.lines.push(this.source.substring(beginLine, this.source.length));
  }

  /**
   * @breif Get token at current position
   * @returns {token} current token
   */
  curTok() {
    let tok, adv = 0;
    do {
      tok = this.tokens[this._pos + adv++];
    } while (tok && tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Advances internal pointer +1 and returns that token
   * @returns {token} next token
   */
  nextTok() {
    let tok;
    do {
      tok = this.tokens[++this._pos];
    } while (tok && tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Revers internal point -1 and returns that pointer
   * @returns {token} previous token
   */
  prevTok() {
    let tok;
    do {
      tok = this.tokens[--this._pos];
    } while (tok && tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Peek into tokens list forward or reverse
   * @param {number} [steps=1] How many steps from current we want to peek, may be negative, default +1
   * @returns {token} The token at steps pos or undefined
   */
  peekTok(steps = 1) {
    let tok;
    do {
      tok = this.tokens[this._pos + steps];
      steps += steps > 0 ? 1 : -1;
    } while (tok && tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Starts a transaction, is reentant.
   * @returns {token} current token
   */
  tryPos() {
    if (this._pos < 0) this._pos = 0;
    let tok = this.tokens[this._pos];
    while (tok && tok.type === this.commentToken)
      tok = this.tokens[++this._pos];

    this._stackPos.push(this._pos);
    return tok;
  }

  /**
   * @brief Revert transaction back to pos at last tryPos call.
   * @returns false (for chaining lines)
   */
  rejectPos() {
    if (this._stackPos.length)
      this._pos = this._stackPos.pop();
    return false;
  }

  /**
   * @brief Accept transaction
   * @returns current position
   */
  acceptPos() {
    this._stackPos.pop();
    return this.curTok();
  }
}


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
character = letter | digit | symbol | "_" ;

identifier = letter , { letter | digit | "_" } ;
terminal = "'" , character , { character } , "'"
         | '"' , character , { character } , '"' ;

lhs = identifier ;
rhspart = identifier
        | terminal
        | "[" , rhs , "]"
        | "{" , rhs , "}"
        | "(" , rhs , ")" ;

rhs = rhspart , { ( "|" , "," ) , rhspart } ;
rule = lhs , "=" , rhs , ";" ;
grammar = { rule } ;`;

/*const ebnfTokens = {
  exception: 0,    // -
  concat: 1,       // ,
  termination: 2,  // ;
  alternation: 3,  // |
  lbracket: 4,     // [
  rbracket: 5,     // ]
  question: 6,     // ?
  commentOpen: 7,  // (*
  commentClose: 8, // *)
  string: 9,       // '..' or ".."
  identifer: 10    // abcd
}*/

/**
 * @brief The root parser for the extended backs naur format
 *     Singleton
 */
export class GrammarParser {
  rules = {};
  _error = {message:'Unexpected error'};

  constructor(source) {
    const tokenMatches = {
      comment: {r:/^\(\*.*\*\)/gm, ignore: true},
      litteral: {r:/^[a-zA-Z]+/},
      number: {r:/^[0-9]+/},
      underscore: {s:'_'},
      symbol: {r:/^[\[\]{}()<>'"=|.,;]/},
    };

    this.lexer = new Lexer({tokenMatches, source, errorType: GrammarSyntaxError});

    this._grammar()
  }

  _setError(message, tok) {
    this._error = {
      message,
      tok:tok || this.lexer.tokens[this.lexer.tokens.length-1]
    };
  }

  _throwError(message, tok) {
    this._setError(message, tok);
    throw new GrammarSyntaxError(
      this._error.message, this._error.tok.parseInfo
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
      this._throwError("Expected ';'", tok);

    new SyntaxTreeNode(n, "symbol", tok);

    return this.lexer.acceptPos();
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
      const opposite = {'[':']', '{':'}', '(':')'};
      if (tok.str in opposite) {
        // | "[" , rhs , "]"
        // | "{" , rhs , "}"
        // | "(" , rhs , ")"
        const openCh = tok.str;
        new SyntaxTreeNode(n, tok.type, tok);
        tok = this.lexer.nextTok();
        if (this._rhs(n)) {
          tok = this.lexer.nextTok();
          if (tok.str !== opposite[openCh]) {
            this._setError(`Expected '${opposite[openCh]}'`, tok);
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

    if (tok.str !== '"' && tok.str !== "'")
      return n.remove() && this.lexer.rejectPos();
    new SyntaxTreeNode(n, tok.type, tok);

    const openCh = tok.str;
    tok = this.lexer.nextTok();
    while(tok && tok.str !== openCh &&
          ['litteral','number','symbol','underscore']
              .indexOf(tok.type) > -1)
    {
      new SyntaxTreeNode(n, tok.type, tok);
      tok = this.lexer.nextTok();
    }

    if (!tok || tok.str !== openCh)
      this._throwError(`Expected matching '${openCh}'`, tok);

    if (n.children.length < 2)
      this._throwError(`Expected litteral before ${openCh}`, tok);


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
}