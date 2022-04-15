"use strict";

import {
  ParseInfo, GrammarSyntaxError,
  Lexer, GrammarParser, ebnfGrammar
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
    comment: {r:/^(?:\(\*.*\*\)|#.*(?=\n))/gm},
    string: {r:/^(?:"([^"]+)"|'([^']+)')/},
    equal: {s:'='}, comma: {s:','} , bar: {s:'|'},
    semicolon: {s:';'},
    lparen: {s:'('}, rparen: {s:')'},
    lbracket: {s:'['}, rbracket: {s:']'},
    lbrace: {s:'{'}, rbrace: {s:'}'},
    litteral: {r:/^\w+/}
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
      expect(lex.lines[2]).toBe(source.split('\n')[2]);
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

    it("Should add empty line to lines", ()=>{
      const source = `line1=one\n\nline3=three`;
      const lex = new Lexer({tokenMatches, source});
      expect(lex.lines.length).toBe(3);
      expect(lex.lines[2]).toBe(source.split('\n')[2]);
      expect(lex.tokens.length).toBe(6);
    });

    it("Should not add escaped empty line to lines", ()=>{
      const source = `line1=one\\\n\nline3=three`;
      const lex = new Lexer({tokenMatches, source});
      expect(lex.lines.length).toBe(2);
      expect(lex.lines[1]).toBe(source.split('\n')[2]);
      expect(lex.tokens.length).toBe(6);
    });

    it("Should add line with \\r\\n to lines", ()=>{
      const source = `line1=one\r\n line2=two`;
      const lex = new Lexer({tokenMatches, source, newRowRegex:/^\n/});
      expect(lex.lines.length).toBe(2);
      expect(lex.lines[1]).toBe(source.split('\n')[1]);
      expect(lex.tokens.length).toBe(6);
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
      expect(lex.curTok()).toBe(undefined);
      expect(lex.nextTok()).toBe(lex.tokens[0]);
      expect(lex.nextTok()).toBe(lex.tokens[1]);
      expect(lex.nextTok()).toBe(lex.tokens[2]);
      expect(lex.peekTok()).toBe(lex.tokens[3]);
      expect(lex.peekTok(2)).toBe(lex.tokens[4]);
      expect(lex.peekTok(-1)).toBe(lex.tokens[1]);
      expect(lex.curTok()).toBe(lex.tokens[2]);
      expect(lex.nextTok()).toBe(lex.tokens[3]);
      expect(lex.nextTok()).toBe(lex.tokens[4]);
      expect(lex.nextTok()).toBe(lex.tokens[5]);
    });

    it("Should move token +1 with commentToken", ()=>{
      const lex = new Lexer({tokenMatches, source, commentToken:"comment"});
      expect(lex.curTok()).toBe(undefined); // 0 is a comment
      expect(lex.nextTok()).toBe(lex.tokens[1]);
      expect(lex.nextTok()).toBe(lex.tokens[2]);
      expect(lex.nextTok()).toBe(lex.tokens[3]);
      expect(lex.peekTok()).toBe(lex.tokens[4]);
      expect(lex.peekTok(2)).toBe(lex.tokens[5]);
      expect(lex.peekTok(-1)).toBe(lex.tokens[2]);
      expect(lex.curTok()).toBe(lex.tokens[3]);
      expect(lex.nextTok()).toBe(lex.tokens[4]);
      expect(lex.nextTok()).toBe(lex.tokens[5]);
      expect(lex.nextTok()).toBe(lex.tokens[6]);
    });
  });

  describe("test curTok(), nextTok(), prevTok and peekTok()", ()=>{
    it("Should move token +1", ()=>{
      const lex = new Lexer({tokenMatches, source});
      expect(lex.tryPos()).toBeObj(lex.tokens[0]); // 0 is a comment
      expect(lex.nextTok()).toBeObj(lex.tokens[1]);
      expect(lex.nextTok()).toBeObj(lex.tokens[2]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[0]);

      expect(lex.tryPos()).toBeObj(lex.tokens[0]);
      expect(lex.nextTok()).toBeObj(lex.tokens[1]);
      expect(lex.nextTok()).toBeObj(lex.tokens[2]);

      expect(lex.tryPos()).toBeObj(lex.tokens[2]);
      expect(lex.nextTok()).toBeObj(lex.tokens[3]);
      expect(lex.nextTok()).toBeObj(lex.tokens[4]);
      expect(lex.curTok()).toBeObj(lex.tokens[4]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[2]);
      expect(lex.acceptPos()).toBeObj(lex.tokens[2]);

      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[2]);

      expect(lex.prevTok()).toBeObj(lex.tokens[1]);
      expect(lex.curTok()).toBeObj(lex.tokens[1]);
    });

    it("Should move token +1 commentToken", ()=>{
      const lex = new Lexer({tokenMatches, source, commentToken: "comment"});
      expect(lex.tryPos()).toBeObj(lex.tokens[1]); // 0 is a comment
      expect(lex.nextTok()).toBeObj(lex.tokens[2]);
      expect(lex.nextTok()).toBeObj(lex.tokens[3]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[1]);

      expect(lex.tryPos()).toBeObj(lex.tokens[1]);
      expect(lex.nextTok()).toBeObj(lex.tokens[2]);
      expect(lex.nextTok()).toBeObj(lex.tokens[3]);

      expect(lex.tryPos()).toBeObj(lex.tokens[3]);
      expect(lex.nextTok()).toBeObj(lex.tokens[4]);
      expect(lex.nextTok()).toBeObj(lex.tokens[5]);
      expect(lex.curTok()).toBeObj(lex.tokens[5]);
      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[3]);
      expect(lex.acceptPos()).toBeObj(lex.tokens[3]);

      expect(lex.rejectPos()).toBeObj(false);
      expect(lex.curTok()).toBeObj(lex.tokens[3]);
    });
  });
});

registerTestSuite("Test CST parser", ()=>{
  describe("Test GrammarParser's lexer", ()=>{
    it("Should scan EBNF grammar", ()=>{
      const grmParser = new GrammarParser(ebnfGrammar);
      expect(grmParser.lexer.lines.length).toBe(ebnfGrammar.split('\n').length);
      expect(grmParser.lexer.tokens.map(t=>t.type)
              .filter((t,i,s)=>s.indexOf(t) === i))
        .toContain([
          "litteral", "number", "underscore", "symbol",
        ]);
      expect(grmParser.lexer.lines).toBeObj(ebnfGrammar.split('\n'));
      console.log(grmParser.cstRoot.toSource(';'));
    });

    it("Should throw GrammarSyntaxError", ()=>{
      expect(()=>{
        new GrammarParser("%")
      }).toThrow(GrammarSyntaxError);
     });
  });

  describe("Test GrammarParser CST", ()=>{
    const throwParse = (obj) =>{
      try {
        obj.grmParser = new GrammarParser(obj.src);
      } catch(e) {
        obj.err = e;
        throw e;
      }
    }

    const treeDiffer = (tree, cmp)=>{
      if (tree.type!==cmp.tp)
        return `${tree.type}!==${cmp.tp} ${cmp.tp}`;
      if (tree.tok?.str !== cmp.str)
        return `${tree.tok?.str}!==${cmp.str} ${cmp.tp}`;
      if (!cmp.ch) return false;
      if (tree.children.length !== cmp.ch.length)
        return `child.length ${tree.children.length}!==${cmp.ch.length} ${cmp.tp}`;
      for (let i = 0; i < tree.children.length; ++i) {
        const res = treeDiffer(tree.children[i], cmp.ch[i]);
        if (res) return res;
      }
      return false;
    }

    it("Should parse litteral", ()=>{
      const grmParser = new GrammarParser(`id="A";`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(13);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','terminal','symbol','litteral','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('"');
      expect(flatTree[10].tok.str).toBe('A');
      expect(flatTree[11].tok.str).toBe('"');
      expect(flatTree[12].tok.str).toBe(';');
      const cmpObj = {
        tp:'grammar',ch:[{
          tp:'rule',ch:[{
            tp:'lhs',ch:[{
              tp:'identifier',ch:[{
                tp:'litteral',str:'id'
              }]
            }]
          }, {
            tp:'symbol',str:'='
          }, {
            tp:'rhs',ch:[{
              tp:'rhspart',ch:[{
                tp:'terminal',ch:[{
                  tp:'symbol',str:'"'
                },{
                  tp:'litteral',str:'A'
                },{
                  tp:'symbol',str:'"'
                }]
              }]
            }]
          },{
            tp:'symbol',str:';'
          }]
        }]
      }
      expect(treeDiffer(grmParser.cstRoot,cmpObj)).toBe(false);
    });

    it("Should throw no lhs", ()=>{
      let obj = {src:`="A`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,19)).toBe("Expected identifier");
      expect(obj.err.parseInfo).toBeObj({line:1,col:0});
    });
    it("Should throw no '='", ()=>{
      let obj = {src:`id"A`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,12)).toBe("Expected '='");
      expect(obj.err.parseInfo).toBeObj({line:1,col:2});
    });
    it("Should throw unclosed terminal \"A ", ()=>{
      let obj = {src:`id="A`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,21)).toBe("Expected matching '\"'");
      expect(obj.err.parseInfo).toBeObj({line:1,col:4});
    });
    it("Should throw no terminal ';'", ()=>{
      let obj = {src:`id="A"`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,12)).toBe("Expected ';'");
      expect(obj.err.parseInfo).toBeObj({line:1,col:5});
    });
    it("Should throw unclosed '{'", ()=>{
      let obj = {src:`id={rule;`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,12)).toBe("Expected '}'");
      expect(obj.err.parseInfo).toBeObj({line:1,col:8});
    });
    it("Should throw unclosed '['", ()=>{
      let obj = {src:`id=[rule;`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,12)).toBe("Expected ']'");
      expect(obj.err.parseInfo).toBeObj({line:1,col:8});
    });
    it("Should throw unclosed '('", ()=>{
      let obj = {src:`id=(rule;`};
      expect(()=>{throwParse(obj)}).toThrow(GrammarSyntaxError);
      expect(obj.err.message.substr(0,12)).toBe("Expected ')'");
      expect(obj.err.parseInfo).toBeObj({line:1,col:8});
    });

    it("Should not throw '{one,two}'", ()=>{
      let obj = {src:`id={one,two};`};
      expect(()=>{
        throwParse(obj)
      }).toNotThrow();
      const flatTree = obj.grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(19);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','symbol',
          'rhs',
            'rhspart','identifier','litteral',
            'symbol',
            'rhspart','identifier','litteral',
          'symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[8].tok.str).toBe('{');
      expect(flatTree[12].tok.str).toBe('one');
      expect(flatTree[13].tok.str).toBe(',');
      expect(flatTree[16].tok.str).toBe('two');
      expect(flatTree[17].tok.str).toBe('}');
    });

    it("Should parse identifier", ()=>{
      const grmParser = new GrammarParser("id=ident1_and_2;");
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(16);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','identifier',
          'litteral','number','underscore','litteral','underscore','number',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('ident');
      expect(flatTree[10].tok.str).toBe('1');
      expect(flatTree[11].tok.str).toBe('_');
      expect(flatTree[12].tok.str).toBe('and');
      expect(flatTree[13].tok.str).toBe('_');
      expect(flatTree[14].tok.str).toBe('2');
    });

    it("Should parse id=\"'\"", ()=>{
      const grmParser = new GrammarParser("id=\"'\";");
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(13);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','terminal','symbol','symbol','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('"');
      expect(flatTree[10].tok.str).toBe("'");
      expect(flatTree[11].tok.str).toBe('"');
      expect(flatTree[12].tok.str).toBe(';');
    });

    it("Should parse rhs ',' rhs", ()=>{
      const grmParser = new GrammarParser(`id=ident,"A";`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(17);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs',
          'rhspart','identifier','litteral',
          'symbol',
          'rhspart','terminal','symbol','litteral','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('ident');
      expect(flatTree[14].tok.str).toBe('A');
      expect(flatTree[16].tok.str).toBe(';');
    });
    it("Should parse rhs '|' rhs", ()=>{
      const grmParser = new GrammarParser(`id=one|two;`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(15);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs',
          'rhspart','identifier','litteral',
          'symbol',
          'rhspart','identifier','litteral',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('one');
      expect(flatTree[13].tok.str).toBe('two');
      expect(flatTree[14].tok.str).toBe(';');
    });
    it("Should parse {rhs ',' rhs}", ()=>{
      const grmParser = new GrammarParser(`id={one,two};`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(19);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','symbol',
          'rhs',
            'rhspart','identifier','litteral',
            'symbol',
            'rhspart','identifier','litteral',
          'symbol',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[8].tok.str).toBe('{');
      expect(flatTree[12].tok.str).toBe('one');
      expect(flatTree[13].tok.str).toBe(',');
      expect(flatTree[16].tok.str).toBe('two');
      expect(flatTree[17].tok.str).toBe('}');
      expect(flatTree[18].tok.str).toBe(';');
    });
    it("Should parse id,{rhs ',' rhs}", ()=>{
      const grmParser = new GrammarParser(`id=one,{two,three};`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(23);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','identifier','litteral','symbol',
          'rhspart','symbol',
            'rhs',
              'rhspart','identifier','litteral',
              'symbol',
              'rhspart','identifier','litteral',
            'symbol',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe('one');
      expect(flatTree[12].tok.str).toBe('{');
      expect(flatTree[16].tok.str).toBe('two');
      expect(flatTree[17].tok.str).toBe(',');
      expect(flatTree[20].tok.str).toBe('three');
      expect(flatTree[21].tok.str).toBe('}');
      expect(flatTree[22].tok.str).toBe(';');
      const cmpObj = {
        tp:'grammar',ch:[{
          tp:'rule',ch:[
            {tp:'lhs',ch:[{
              tp:'identifier',ch:[
                {tp:'litteral',str:'id'}
              ]}
            ]},
            {tp:'symbol',str:'='},
            {tp:'rhs',ch:[
              {tp:'rhspart',ch:[{
                tp:'identifier',ch:[{
                  tp:'litteral',str:'one'
                }]
               }]
              },
              {tp:'symbol',str:','},
              {tp:'rhspart',ch:[
                {tp:'symbol',str:'{'},
                  {tp:'rhs',ch:[
                    {tp:'rhspart',ch:[
                      {tp:'identifier',ch:[
                        {tp:'litteral',str:'two'}
                      ]},
                    ]},
                    {tp:'symbol',str:','},
                    {tp:'rhspart',ch:[
                      {tp:'identifier',ch:[
                        {tp:'litteral',str:'three'}
                      ]}
                    ]}
                  ]},
                  {tp:'symbol',str:'}'}
              ]}
            ]},
            {tp:'symbol',str:';'}
          ]}
        ]
      }
      expect(treeDiffer(grmParser.cstRoot,cmpObj)).toBe(false);
    });
  });
});

registerTestSuite("test AST parser", ()=>{
  describe("test GrammarParser AST generation", ()=>{
    it("Should generate 3rules", ()=>{
      const grmParser = new GrammarParser(`
        id1=one;
        id2=two|three
           |four|five;
        id3=six,seven,{eight|nine};
      `);
      expect(grmParser.astRoot.right.asList('right').map(n=>n.value))
        .toBeObj(grmParser.cstRoot.children.map(n=>n.children[0].tokString()));

      console.log(grmParser.astRoot.right.asObject());
      //throw "stop"
    });
  });
});
