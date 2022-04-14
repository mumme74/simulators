"use strict";

import {
  ParseInfo, GrammarSyntaxError, Lexer
} from "../../parser/parser.mjs"

registerTestSuite("test_ParseInfo", ()=>{
  describe("ParseInfo test", ()=>{
    it("should contruct empty", ()=>{
      const pNfo = new ParseInfo();
      expect(pNfo.line).toBe(-1);
      expect(pNfo.col).toBe(-1);
    });
    it("should contruct line", ()=>{
      const pNfo = new ParseInfo(10);
      expect(pNfo.line).toBe(10);
      expect(pNfo.col).toBe(-1);
    });
    it("should contruct line and col", ()=>{
      const pNfo = new ParseInfo(10,20);
      expect(pNfo.line).toBe(10);
      expect(pNfo.col).toBe(20);
    });
  })
});

registerTestSuite("test_GrammarSyntaxError", ()=>{
  describe("GrammarSyntaxError test", ()=>{
    it("should construct empty", ()=>{
      const err = new GrammarSyntaxError()
      expect(err.toString()).toBe("GrammarSyntaxError:  at line -1 pos -1");
    });
    it("should construct with msg", ()=>{
      const err = new GrammarSyntaxError("*test*")
      expect(err.message).toBe("*test* at line -1 pos -1");
    });
    it("should construct with msg and parseInfo", ()=>{
      const pNfo = new ParseInfo(10,20);
      const err = new GrammarSyntaxError("*test*", pNfo);
      expect(err.message).toBe("*test* at line 10 pos 20");
    });
  });
});

registerTestSuite("test_Lexer", ()=>{
  const source =
     `#comment first
      digit = "0" | "1" | "2" ;
      abc = 'a', 'b' ,"c";\r
      (* comment row 3 *)
      number = digit,[ { digit } ] ;\\

      ident  = "def", ( number | abc ) ;`;
  const tokenMatches = {
    comment: /^(?:\(\*.*\*\)|#.*(?=\n))/gm,
    string: /^(?:"([^"]+)"|'([^']+)')/,
    equal: '=', comma: ',' , bar: '|', semicolon: ';',
    lparen: '(', rparen: ')',
    lbracket: '[', rbracket: ']',
    lbrace: '{', rbrace: '}',
    litteral: /^\w+/
  };

  describe("test tokenizing src", ()=>{
    it("Should tokenize with default lineEnds", ()=>{
      const lex = new Lexer({tokenMatches, source});
      expect(lex.lines.length).toBe(6);
      expect(lex.lines[2]).toBe(source.split('\n')[2].replace('\r', ''));
      expect(lex.tokens.length).toBe(38);
      expect(lex.tokens[0]).toBeObj({str:'#comment first', type:'comment'});
      expect(lex.tokens[0].parseInfo).toBeObj({line:1, col:0});
      expect(lex.tokens[1]).toBeObj({str:'digit', type:'litteral'});
      expect(lex.tokens[2]).toBeObj({str:'=', type:'equal'});
      expect(lex.tokens[3]).toBeObj({str:'0', type:'string'});
      expect(lex.tokens[4]).toBeObj({str:'|', type:'bar'});
      expect(lex.tokens[4].parseInfo).toBeObj({line:2, col:18});
      expect(lex.tokens[8]).toBeObj({str:';', type:'semicolon'});
      expect(lex.tokens[12]).toBeObj({str:',', type:'comma'});
      expect(lex.tokens[21]).toBeObj({str:',', type:'comma'});
      expect(lex.tokens[22]).toBeObj({str:'[', type:'lbracket'});
      expect(lex.tokens[23]).toBeObj({str:'{', type:'lbrace'});
      expect(lex.tokens[24]).toBeObj({str:'digit', type:'litteral'});
      expect(lex.tokens[25]).toBeObj({str:'}', type:'rbrace'});
      expect(lex.tokens[26]).toBeObj({str:']', type:'rbracket'});
      expect(lex.tokens[30]).toBeObj({str:'def', type:'string'});
      expect(lex.tokens[32]).toBeObj({str:'(', type:'lparen'});
      expect(lex.tokens[36]).toBeObj({str:')', type:'rparen'});
      expect(lex.tokens[lex.tokens.length-1]).toBeObj({str:';', type:'semicolon'});
    });

    it("Should tokenize with custom lineEnds", ()=>{
      const lex = new Lexer({tokenMatches, source, newRowRegex:/^\n/});
      expect(lex.lines.length).toBe(6);
      expect(lex.lines[2]).toBe(source.split('\n').slice(2,4).join('\n'));
      expect(lex.tokens.length).toBe(38);
      expect(lex.tokens[0]).toBeObj({str:'#comment first', type:'comment'});
      expect(lex.tokens[0].parseInfo).toBeObj({line:1, col:0});
      expect(lex.tokens[1]).toBeObj({str:'digit', type:'litteral'});
      expect(lex.tokens[2]).toBeObj({str:'=', type:'equal'});
      expect(lex.tokens[3]).toBeObj({str:'0', type:'string'});
      expect(lex.tokens[4]).toBeObj({str:'|', type:'bar'});
      expect(lex.tokens[4].parseInfo).toBeObj({line:2, col:18});
      expect(lex.tokens[8]).toBeObj({str:';', type:'semicolon'});
      expect(lex.tokens[12]).toBeObj({str:',', type:'comma'});
      expect(lex.tokens[21]).toBeObj({str:',', type:'comma'});
      expect(lex.tokens[22]).toBeObj({str:'[', type:'lbracket'});
      expect(lex.tokens[23]).toBeObj({str:'{', type:'lbrace'});
      expect(lex.tokens[24]).toBeObj({str:'digit', type:'litteral'});
      expect(lex.tokens[25]).toBeObj({str:'}', type:'rbrace'});
      expect(lex.tokens[26]).toBeObj({str:']', type:'rbracket'});
      expect(lex.tokens[30]).toBeObj({str:'def', type:'string'});
      expect(lex.tokens[32]).toBeObj({str:'(', type:'lparen'});
      expect(lex.tokens[36]).toBeObj({str:')', type:'rparen'});
      expect(lex.tokens[lex.tokens.length-1]).toBeObj({str:';', type:'semicolon'});
    });

    it("Should throw SyntaxError and GrammarSyntaxError", ()=>{
      expect(()=>{new Lexer({tokenMatches, source:`%`})}).toThrow(SyntaxError);
      expect(()=>{
        new Lexer({tokenMatches, source:`%`,
              errorType:GrammarSyntaxError})
        }).toThrow(GrammarSyntaxError);
      expect(()=>{
        new Lexer({tokenMatches, source: " \t", ignoreRegex:/^ /});
      }).toThrow();
    });
  });

  describe("test curTok(), nextTok() and peekTok()", ()=>{
    it("Should move token +1", ()=>{
      const lex = new Lexer({tokenMatches, source});
      expect(lex.curTok()).toBe(lex.tokens[0]);
      expect(lex.nextTok()).toBe(lex.tokens[0]);
      expect(lex.nextTok()).toBe(lex.tokens[1]);
      expect(lex.nextTok()).toBe(lex.tokens[2]);
      expect(lex.peekTok()).toBe(lex.tokens[4]);
      expect(lex.peekTok(2)).toBe(lex.tokens[5]);
      expect(lex.peekTok(-1)).toBe(lex.tokens[2]);
      expect(lex.curTok()).toBe(lex.tokens[3]);
      expect(lex.nextTok()).toBe(lex.tokens[3]);
      expect(lex.nextTok()).toBe(lex.tokens[4]);
      expect(lex.nextTok()).toBe(lex.tokens[5]);
    });
  });

  describe("test curTok(), nextTok() and peekTok()", ()=>{
    it("Should move token +1", ()=>{
      const lex = new Lexer({tokenMatches, source});
      expect(lex.tryPos()).toBeObj(lex.tokens[0]);
      expect(lex.nextTok()).toBeObj(lex.tokens[0]);
      expect(lex.nextTok()).toBeObj(lex.tokens[1]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[0]);

      expect(lex.tryPos()).toBeObj(lex.tokens[0]);
      expect(lex.nextTok()).toBeObj(lex.tokens[0]);
      expect(lex.nextTok()).toBeObj(lex.tokens[1]);

      expect(lex.tryPos()).toBeObj(lex.tokens[2]);
      expect(lex.nextTok()).toBeObj(lex.tokens[2]);
      expect(lex.nextTok()).toBeObj(lex.tokens[3]);
      expect(lex.curTok()).toBeObj(lex.tokens[4]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[2]);
      expect(lex.acceptPos()).toBeObj(lex.tokens[2]);

      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[2]);
    });
  });

})
