"use strict";

// this parser follows extended backus naur form
// https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

export class SyntaxTreeNode {
  constructor(parent, children = []) {
    this.parent = parent;
    this.children = children;
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
  _pos = 0;
  _stackPos = [];

  /**
   * @breif Constructor for Lexer class
   * @param {Array.<{key:string|RegExp} >} tokenMatches match against these, Token gets the name of key, matches against value of key
   * @param {string} source The source code to tokenize
   * @param {Error} [errorType=SyntaxError] The type error to throw when syntax error occurs
   * @param {string} [commentToken="comment"] The name of a commenttoken
   * @param {RegExp} [newRowRegex] A custom new line regexp matcher, default unescaped newline
   * @param {RegExp} [ignoreRegex] A custom ignore char regexp, default whitespace
   */
  constructor({
     tokenMatches, source,
     errorType = SyntaxError,
     commentToken = "comment",
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
        if (m instanceof RegExp) {
          res = m.exec(this.source.substr(b));
          if (res) {
            if (res.length > 1)
              tokStr = res.slice(1).find(r=>r);
            else
              tokStr = res[0];
            addToken(token, tokStr, b);
            b += res[0].length; i = b - 1;
            return true;
          }
        } else if (m === this.source.substr(b, m.length)) {
          tokStr = this.source.substr(b, m.length);
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
    } while (tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Gets current token and advance internal pointer +1
   * @returns {token} current token
   */
  nextTok() {
    let tok;
    do {
      tok = this.tokens[this._pos++];
    } while (tok.type === this.commentToken);
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
    } while (tok.type === this.commentToken);
    return tok;
  }

  /**
   * @brief Starts a transaction, is reentant.
   * @returns {token} current token
   */
  tryPos() {
    let tok = this.tokens[this._pos];
    while (tok.type === this.commentToken)
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


// from https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
export const ebnfGrammar = `
letter = "A" | "B" | "C" | "D" | "E" | "F" | "G"
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
rhs = identifier
     | terminal
     | "[" , rhs , "]"
     | "{" , rhs , "}"
     | "(" , rhs , ")"
     | rhs , "|" , rhs
     | rhs , "," , rhs ;

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
  constructor(source) {
    const tokenMatches = {
      comment: /^\(\*.*\*\)/gm,
      string: /^(?:"([^"]+)"|'([^']+)')/,
      equal: '=',
      comma: ',', dot: '.',
      semicolon: ';', bar: '|',
      lt: '<', gt: '>',
      lparen: '(', rparen: ')',
      lbracket: '[', rbracket: ']',
      lbrace: '{', rbrace: '}',
      identifier: /^[a-zA-Z][\w\d]+/,
    };

    this.lexer = new Lexer({tokenMatches, source});

    this.cstRoot = new SyntaxTreeNode(null);
    this._grammar(this.cstRoot)
  }

  _grammar(cstNode) {
    let tok = this.lexer.nextTok();
  }

}