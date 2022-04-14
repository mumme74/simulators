"use strict";

// this parser follows extended backus naur form
// https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

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

export class Lexer {
  constructor({
     tokenMatches, source,
     newRowRegex = /^[^\\ \t]?\n/,
     ignoreRegex = /^\s+/})
  {
    this.tokenMatches = tokenMatches;
    this.source = source;
    this.lines = [];
    this.tokens = [];
    this._pos = 0;

    const tokenMatchEntries = Object.entries(this.tokenMatches);

    const addToken = (token, tokStr, b) => {
      this.tokens.push({
        str:tokStr, type:token,
        parseInfo: new ParseInfo(this.lines.length+1, b - beginLine)
      });
    }

    // tokenize
    let tokStr = "", beginLine = 0, res;
    for (let i = 0, b = 0; i < source.length; ++i) {
      const dbgStr = this.source.substring(b-1, i);

      const matched = tokenMatchEntries.find(([token, m])=>{
              if (m instanceof RegExp) {
                res = m.exec(this.source.substr(b));
                if (res) {
                  if (res.length > 1)
                    tokStr = res.slice(1).find(r=>r);
                  else
                    tokStr = res[0];
                  addToken(token, tokStr, b);
                  b += res[0].length; i = b-1;
                  return true;
                }
              } else if (m === this.source.substr(b, m.length)) {
                tokStr = this.source.substr(b, m.length);
                addToken(token, tokStr, b);
                b += tokStr.length; i = b-1;
                return true;
              }
            });
      if (matched) {
        continue;
      } else if (res = newRowRegex.exec(this.source.substr(b))) {
        this.lines.push(this.source.substring(beginLine, b));
        b += res[0].length; i = b -1;
        beginLine = b;
      } else if (res = ignoreRegex.exec(this.source.substr(b))) {
        b += res[0].length; i = b -1;
      } else
        throw SyntaxError(`'${this.source.substring(b,i)}' at line ${this.lines.length} col ${i - beginLine}`);
    }

    this.lines.push(this.source.substring(beginLine, this.source.length));
  }

  nextTok() {
    return this.tokens[++this._pos];
  }

  peekTok() {
    return this.tokens[this._pos+1];
  }

  tryPos() {
    this._stackPos.push(this._pos);
    return this.tokens[this._pos];
  }

  rejectPos() {
    this._pos = this._stackPos.pop();
    return false;
  }

  acceptPos() {
    this._stackPos.pop();
    return this.tokens[this._pos];
  }

}


// from https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
const ebnfGrammar = `
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
grammar = { rule } ;
`;

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
class EbnfParser {
  rules = {};
  constructor() {
    const tokenMatches = {
      comment: /^\(\*.*\*\)/gm,
      string: /^(?:"([^"]+)"|'([^']+)')$/,
      equal: '=',
      comma: ',', dot: '.',
      semicolon: ';', bar: '|',
      lt: '<', gt: '>',
      lparen: '(', rparen: ')',
      lbracket: '[', rbracket: ']',
      lbrace: '{', rbrace: '}',
      identifer: /^[a-zA-Z][\w\d]+$/,
    };

    this.lexer = new Lexer({
      tokenMatches, source: ebnfGrammar, newRowRegex: /\n+(?=\n*\b)/m
    });



    //const ruleRows = grammar.split(/\w.+(?:\n[ \t]+[^\n]+)*/gm);
    /*for (const row of ruleRows) {
      const parts = row.split(/(?:=|::=)=/gm);
      const identifier = parts[0].trimmed();
      let production = parts[1];

      rules[name] = new Rule(this, identifier);
    }*/
  }

}