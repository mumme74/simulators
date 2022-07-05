"use strict";

import {
  ParseInfo, GrammarSyntaxError,
  Lexer, GrammarParser, ebnfGrammar, SyntaxTreeNode, Parser, ActionBase, AstTreeNode
} from "../../parser/parser.mjs"

registerTestSuite("test SyntaxTreeNode", ()=>{
  let root, ch1, ch2, ch1_ch1, endStmt;
  const rootTok = {type:'tokroot',str:'r',parseInfo:new ParseInfo(1,1)},
        ch1Tok = {type:'roottok',str:'ch1',parseInfo:new ParseInfo(1,1)},
        ch2Tok = {type:'childtok',str:'ch2',parseInfo:new ParseInfo(1,1)};
  beforeEach(()=>{
    root = new SyntaxTreeNode('root',rootTok);
    ch1 = new SyntaxTreeNode('root.ch1', ch1Tok);
    ch2 = new SyntaxTreeNode('root.ch2',ch2Tok);
    ch1_ch1 = new SyntaxTreeNode('root.ch1.ch1');
    ch1.addChild(ch1_ch1);
    endStmt = new SyntaxTreeNode('eol',{
      type:'eol',str:';',parseInfo: new ParseInfo(1,9)
    })
    root.addChild([ch1, ch2, endStmt]);
  });
  describe("CST test", ()=>{
    it("Should test constructor", ()=>{
      expect(root.type).toBe('root');
      expect(root.tok).toBeObj(rootTok);
      expect(root.children.length).toBe(3);
      expect(root.children[0].type).toBe('root.ch1');
      expect(root.children[0].tok).toBeObj(ch1Tok);
      expect(root.children[0].children[0].type).toBe('root.ch1.ch1');
      expect(root.children[0].children[0].tok).toBeObj(undefined);
      expect(root.children[1].type).toBe('root.ch2');
      expect(root.children[1].tok).toBeObj(ch2Tok);
      expect(root.children[2].type).toBe('eol');
      expect(root.children[2].tok.str).toBe(';');
    });
    it("Should test flat()",()=>{
      expect(root.flat()).toBeObj([root,ch1,ch1_ch1,ch2]);
      expect(ch1.flat()).toBeObj([ch1,ch1_ch1]);
    });
    it("Should recreate toSource()", ()=>{
      expect(root.toSource()).toBe('rch1ch2;\n');
      expect(ch1.toSource()).toBe('ch1');
    });
    it("Should test tokString()", ()=>{
      expect(root.tokString()).toBe('rch1ch2;');
      expect(ch1.tokString()).toBe('ch1');
    })
  });
});

registerTestSuite("test AST node action", ()=>{
  describe("ActionBase tests", ()=>{
    it("Should keep reference to parser and astNode", ()=>{
      const parserMock = {}, astMock = {};
      const action = new ActionBase(parserMock, astMock);
      expect(action.parser).toBe(parserMock);
      expect(action.astNode).toBe(astMock);
    });

    it("Should visit all nodes", ()=>{
      let visitCnt = 0;
      class Action extends ActionBase {
        visit() { visitCnt++; super.visit(); }
      }
      const astRoot = new AstTreeNode({},new Action({})),
            rootLeft = new AstTreeNode({},new Action({})),
            rootRight = new AstTreeNode({},new Action({})),
            rootLeftLeft = new AstTreeNode({},new Action({})),
            rootLeftRight = new AstTreeNode({},new Action({}));
      rootLeft.addLeft(rootLeftLeft);
      rootLeft.addRight(rootLeftRight);
      astRoot.addLeft(rootLeft);
      astRoot.addRight(rootRight);
      astRoot.action.visit();
      expect(visitCnt).toBe(5);
    });
  })
})

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
    string: {r:/^(?:"([^"]*)"|'([^']*)')/},
    equal: {s:'='}, comma: {s:','} , bar: {s:'|'},
    semicolon: {s:';'},
    lparen: {s:'('}, rparen: {s:')'},
    lbracket: {s:'['}, rbracket: {s:']'},
    lbrace: {s:'{'}, rbrace: {s:'}'},
    space: {r:/^[ ]+/, state:"stringState"},
    litteral: {r:/^\w+/},
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

    it("Should add space", ()=>{
      const source = `line1=\' \'`;
      const lex = new Lexer({tokenMatches, source});
      expect(lex.tokens[2]).toBeObj({str:' ', type:'string'});
    });

    it("Should allow empty string", ()=>{
      const source = `line1=\'\'`;
      const lex = new Lexer({tokenMatches, source});
      expect(lex.tokens[2]).toBeObj({str:'', type:'string'});
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

    it("Should throw SyntaxError", ()=>{
      expect(()=>{new Lexer({tokenMatches, source:`%`})}).toThrow(SyntaxError);
    });

    it("Should throw GrammarSyntaxError", ()=>{
      expect(()=>{
        new Lexer({tokenMatches, source:`%`,
              errorType:GrammarSyntaxError})
        }).toThrow(GrammarSyntaxError);
    });

    it("Should throw", ()=>{
      expect(()=>{
        new Lexer({tokenMatches, source: " \t", ignoreRegex:/^ /});
      }).toThrow();
    });

    it("Should delegate to special_squence function", ()=>{
      const tokenMatches = {
        space: {s:' '}, comma:{s:','},
        special_sequence: [
          {
            n: 'string_characters',
            cb:(str)=>{
              const res = /^(?:(")(?:\\\1|[^"])*\1|(?:(')(?:\\\2|[^'])*\2))/um.exec(str);
              if (res) return res[0];
            }
          },{
            n:'printable_character',
            cb:(str)=>{
              if (/^\P{Cc}/u.test(str)) return str[0];
            }
        }]
      };
      const source = `ö, "this is a \\"string\n\twith many rows"`;
      const lex = new Lexer({tokenMatches, source});

      expect(lex.tokens[0].type).toBe('printable_character');
      expect(lex.tokens[0].str).toBe('ö');
      expect(lex.tokens[3].type).toBe('string_characters');
      expect(lex.tokens[3].str).toBe('"this is a \\"string\n\twith many rows"');
    })
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

    it("Should move token +1 with filterOutTokens", ()=>{
      const lex = new Lexer({
        tokenMatches, source, filterOutTokens:["comment"]});
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
      const lex = new Lexer({
        tokenMatches, source, filterOutTokens: ["comment"]});
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

registerTestSuite("Test Grammar CST parser", ()=>{
  describe("Test GrammarParser's lexer", ()=>{
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
      expect(obj.err.message.substr(0,39))
        .toBe("Expected ',', '|','[','{' or ';' near: ");
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
            'symbol',
              'rhspart','identifier','litteral',
              'rhspart','identifier','litteral',
          'symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[8].tok.str).toBe('{');
      expect(flatTree[13].tok.str).toBe('one');
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

    it("Should parse id=' '", ()=>{
      const grmParser = new GrammarParser("id=' ';");
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(13);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','terminal','symbol','space','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe("'");
      expect(flatTree[10].tok.str).toBe(" ");
      expect(flatTree[11].tok.str).toBe("'");
      expect(flatTree[12].tok.str).toBe(';');
    });

    it("Should parse id='\\\\n' as '\\n'", ()=>{
      const grmParser = new GrammarParser("id='\\n';");
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(13);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','terminal','symbol','printable_character','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe("'");
      expect(flatTree[10].tok.str).toBe("\n");
      expect(flatTree[11].tok.str).toBe("'");
      expect(flatTree[12].tok.str).toBe(';');
      expect(flatTree[12].tok.parseInfo.line).toBe(1);
    });

    it("Should parse id=? printable_characters ?", ()=>{
      const grmParser = new GrammarParser("id=? printable_character ?;");
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(11);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','rhspart','terminal','special_sequence',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[9].tok.str).toBe("printable_character");
    });

    it("Should parse rhs ',' rhs", ()=>{
      const grmParser = new GrammarParser(`id=ident,"A";`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(17);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','symbol',
          'rhspart','identifier','litteral',
          'rhspart','terminal','symbol','litteral','symbol',
        'symbol'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[10].tok.str).toBe('ident');
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
        'rhs','symbol',
          'rhspart','identifier','litteral',
          'rhspart','identifier','litteral',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[10].tok.str).toBe('one');
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
          'rhs','symbol',
            'rhspart','identifier','litteral',
            'rhspart','identifier','litteral',
          'symbol',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[8].tok.str).toBe('{');
      expect(flatTree[13].tok.str).toBe('one');
      expect(flatTree[16].tok.str).toBe('two');
      expect(flatTree[17].tok.str).toBe('}');
      expect(flatTree[18].tok.str).toBe(';');
    });
    it("Should parse id=one,{rhs ',' rhs}", ()=>{
      const grmParser = new GrammarParser(`id=one,{two,three};`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(23);
      expect(flatTree.map(n=>n.type)).toBeObj([
        'grammar','rule',
        'lhs','identifier','litteral',
        'symbol',
        'rhs','symbol',
          'rhspart','identifier','litteral',
          'rhspart','symbol',
            'rhs','symbol',
              'rhspart','identifier','litteral',
              'rhspart','identifier','litteral',
            'symbol',
        'symbol'
      ]);
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[10].tok.str).toBe('one');
      expect(flatTree[12].tok.str).toBe('{');
      expect(flatTree[17].tok.str).toBe('two');
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
              {tp:'symbol',str:',',ch:[
                {tp:'rhspart',ch:[{
                  tp:'identifier',ch:[{
                    tp:'litteral',str:'one'
                  }]}
                ]},
                {tp:'rhspart',ch:[
                  {tp:'symbol',str:'{'},
                  {tp:'rhs',ch:[
                    {tp:'symbol',str:',',ch:[
                      {tp:'rhspart',ch:[
                        {tp:'identifier',ch:[
                          {tp:'litteral',str:'two'}
                        ]},
                      ]},
                      {tp:'rhspart',ch:[
                        {tp:'identifier',ch:[
                          {tp:'litteral',str:'three'}
                        ]}
                      ]}
                    ]}
                  ]},
                  {tp:'symbol',str:'}'}
                ]}
              ]}
            ]},
            {tp:'symbol',str:';'}
          ]},
        ]
      };
      expect(treeDiffer(grmParser.cstRoot,cmpObj)).toBe(false);
    });

    it("Should parse rhs ',' rhs", ()=>{
      const grmParser = new GrammarParser(`id=ident,"A"|id2, "B";`);
      const flatTree = grmParser.cstRoot.flat();
      expect(flatTree.length).toBe(28);
      expect(flatTree.map(n=>`${n.type}(${n.parent?.type})`)).toBeObj([
        'grammar(undefined)',
          'rule(grammar)',
            'lhs(rule)',
              'identifier(lhs)',
                'litteral(identifier)',
            'symbol(rule)',
            'rhs(rule)',
              'symbol(rhs)',
                'symbol(symbol)',
                  'rhspart(symbol)',
                    'identifier(rhspart)',
                      'litteral(identifier)',
                  'rhspart(symbol)',
                    'terminal(rhspart)',
                      'symbol(terminal)',
                      'litteral(terminal)',
                      'symbol(terminal)',
                'symbol(symbol)',
                  'rhspart(symbol)',
                    'identifier(rhspart)',
                      'litteral(identifier)',
                        'number(identifier)',
                  'rhspart(symbol)',
                    'terminal(rhspart)',
                      'symbol(terminal)',
                        'litteral(terminal)',
                          'symbol(terminal)',
            'symbol(rule)'
      ])
      expect(flatTree[4].tok.str).toBe('id');
      expect(flatTree[5].tok.str).toBe('=');
      expect(flatTree[7].tok.str).toBe('|');
      expect(flatTree[8].tok.str).toBe(',');
      expect(flatTree[11].tok.str).toBe('ident');
      expect(flatTree[14].tok.str).toBe('"');
      expect(flatTree[15].tok.str).toBe('A');
      expect(flatTree[16].tok.str).toBe('"');
      expect(flatTree[17].tok.str).toBe(',');
      expect(flatTree[25].tok.str).toBe('B');
      expect(flatTree[27].tok.str).toBe(';');
    });

    it("Should ignore comments", ()=>{
      const grammar = `
        start=letter;
        (* comment\nrow2 comment *)
        letter='a'|'b'|'c'; (*comment 2*)`;
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      const root = grmParser.cstRoot;
      expect(grmParser.rules.length).toBe(2);
      expect(root.children[0]?.children[0]?.children[0]?.type).toBe('identifier');
      expect(root.children[0]?.type).toBe('rule');
      expect(root.children[0]?.children[0].tokString()).toBe('start');
      expect(root.children[1]?.type).toBe('rule');
      expect(root.children[1]?.children[0].tokString()).toBe('letter');
    })

    it("Should parse EBNF grammar", ()=>{
      const grmParser = new GrammarParser(ebnfGrammar);
      expect(grmParser.lexer.lines.length).toBe(ebnfGrammar.split('\n').length);
      expect(grmParser.lexer.tokens.map(t=>t.type)
              .filter((t,i,s)=>s.indexOf(t) === i))
        .toContain([
          "litteral", "number", "underscore", "symbol",
        ]);
      expect(grmParser.lexer.lines).toBeObj(ebnfGrammar.split('\n'));
      //console.log(grmParser.cstRoot.toSource(';'));
    });

    it("Should test documentation example", ()=>{
      const source =
      `var id = 123;
       if (id>0) {id=321;}`;
      const grammar = `
       start  = {stmt};
       stmt   = decl | ifStmt;
       decl   = 'var', assign;
       assign = ident, '=', number, ';';
       ifStmt = 'if', '(', compar, ')', '{', assign, '}';
       compar = vlu, ('<'|'>'|'=='), vlu;
       vlu    = ( ident | number );
       (* match id, di, i or d *)
       ident  = {'i'|'d'};
       (* match 1,2,3,12,13,21,23,31,32,123,321,132,312 *)
       number = {'0'|'1'|'2'|'3'};
      `;
      const grmParser = new GrammarParser(grammar);
      grmParser.checkGrammar();
      const parser = new Parser({grmParser, source});
      expect(parser.prgCstRoot.children.length).toBe(2);
    });
  });
});

registerTestSuite("test Grammar AST parser", ()=>{
  describe("test GrammarParser AST generation", ()=>{
    it("Should generate 3rules", ()=>{
      const grmParser = new GrammarParser(
      ` id1=one;
        id2=two|three
           |four|five;
        id3=six,seven,{eight|nine};`
      );
      expect(grmParser.rules.map(n=>n.value))
        .toBeObj(grmParser.cstRoot.children.map(n=>n.children[0].tokString()));

      const rls = grmParser.rules;
      expect(rls.length).toBe(3);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.value).toBe('one');
      expect(rls[0].left.type).toBe('identifier');
      expect(rls[0].right.value).toBe('id2');
      expect(rls[0].right.type).toBe('rule');

      // id2=two|three
      //    |four|five;
      expect(rls[1].value).toBe('id2');
      expect(rls[1].type).toBe('rule');
      expect(rls[1].left.type).toBe('alternation');
      expect(rls[1].left.value).toBe('|');
      expect(rls[1].left.left.type).toBe('identifier');
      expect(rls[1].left.left.value).toBe('two');
      expect(rls[1].left.right.type).toBe('alternation');
      expect(rls[1].left.right.value).toBe('|');
      expect(rls[1].left.right.left.type).toBe('identifier');
      expect(rls[1].left.right.left.value).toBe('three');
      expect(rls[1].left.right.right.type).toBe('alternation');
      expect(rls[1].left.right.right.value).toBe('|');
      expect(rls[1].left.right.right.left.type).toBe('identifier');
      expect(rls[1].left.right.right.left.value).toBe('four');
      expect(rls[1].left.right.right.right.type).toBe('alternation');
      expect(rls[1].left.right.right.right.left.type).toBe('identifier');
      expect(rls[1].left.right.right.right.left.value).toBe('five');

      // id3=six,seven,{eight|nine};
      expect(rls[2].value).toBe('id3');
      expect(rls[2].type).toBe('rule');
      expect(rls[2].left.type).toBe('concatination');
      expect(rls[2].left.value).toBe(',');
      expect(rls[2].right).toBe(undefined); // eof
      expect(rls[2].left.left.type).toBe('identifier');
      expect(rls[2].left.left.value).toBe('six');
      expect(rls[2].left.right.type).toBe('concatination');
      expect(rls[2].left.right.value).toBe(',');
      expect(rls[2].left.right.left.type).toBe('identifier');
      expect(rls[2].left.right.left.value).toBe('seven');
      expect(rls[2].left.right.right.type).toBe('concatination');
      expect(rls[2].left.right.right.value).toBe(',');
      expect(rls[2].left.right.right.left.type).toBe('repetition');
      expect(rls[2].left.right.right.left.value).toBe('{...}');
      expect(rls[2].left.right.right.left.left.type).toBe('alternation');
      expect(rls[2].left.right.right.left.left.value).toBe('|');
      expect(rls[2].left.right.right.left.right).toBe(undefined);
      expect(rls[2].left.right.right.left.left.left.type).toBe('identifier');
      expect(rls[2].left.right.right.left.left.left.value).toBe('eight');
      expect(rls[2].left.right.right.left.left.right.left.type).toBe('identifier');
      expect(rls[2].left.right.right.left.left.right.right).toBe(undefined);
      expect(rls[2].left.right.right.left.left.right.value).toBe('|');
      expect(rls[2].left.right.right.left.left.right.left.value).toBe('nine');

      //throw rls[0].asObject()
      //console.log(JSON.stringify(grmParser.astRoot.right.asObject(),null,2));
    });
    it("should test optional",()=>{
      const grmParser = new GrammarParser(`id1=one,[two];`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.type).toBe('concatination');
      expect(rls[0].left.value).toBe(',');
      expect(rls[0].left.left.value).toBe('one');
      expect(rls[0].left.left.type).toBe('identifier');
      expect(rls[0].left.right.value).toBe(',');
      expect(rls[0].left.right.type).toBe('concatination');
      expect(rls[0].left.right.left.value).toBe('[...]');
      expect(rls[0].left.right.left.type).toBe('optional');
      expect(rls[0].left.right.left.left.value).toBe('two');
      expect(rls[0].left.right.left.left.type).toBe('identifier');
      expect(rls[0].left.right.left.right).toBe(undefined);
    });
    it("should test grouping",()=>{
      const grmParser = new GrammarParser(`id1=one,(two);`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.type).toBe('concatination');
      expect(rls[0].left.value).toBe(',');
      expect(rls[0].left.left.value).toBe('one');
      expect(rls[0].left.left.type).toBe('identifier');
      expect(rls[0].left.right.value).toBe(',');
      expect(rls[0].left.right.type).toBe('concatination');
      expect(rls[0].left.right.left.value).toBe('(...)');
      expect(rls[0].left.right.left.type).toBe('grouping');
      expect(rls[0].left.right.left.left.value).toBe('two');
      expect(rls[0].left.right.left.left.type).toBe('identifier');
      expect(rls[0].left.right.left.right).toBe(undefined);
    });
    it("should test repetition",()=>{
      const grmParser = new GrammarParser(`id1=one,{two};`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.type).toBe('concatination');
      expect(rls[0].left.value).toBe(',');
      expect(rls[0].left.left.value).toBe('one');
      expect(rls[0].left.left.type).toBe('identifier');
      expect(rls[0].left.right.type).toBe('concatination');
      expect(rls[0].left.right.left.value).toBe('{...}');
      expect(rls[0].left.right.left.type).toBe('repetition');
      expect(rls[0].left.right.left.left.value).toBe('two');
      expect(rls[0].left.right.left.left.type).toBe('identifier');
      expect(rls[0].left.right.right).toBe(undefined);
    });
    it("should test identifier",()=>{
      const grmParser = new GrammarParser(`id1=one_two_1_234_tres;`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.value).toBe('one_two_1_234_tres');
      expect(rls[0].left.type).toBe('identifier');
      expect(rls[0].left.right).toBe(undefined);
    });
    it("should test terminal with '\"'",()=>{
      const grmParser = new GrammarParser(`id1="one_two_1_234_tres";`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.value).toBe('one_two_1_234_tres');
      expect(rls[0].left.type).toBe('terminal');
      expect(rls[0].left.right).toBe(undefined);
    });
    it("should test terminal with \"'\"",()=>{
      const grmParser = new GrammarParser(`id1='one_two_1_234_tres';`);
      const rls = grmParser.rules;
      expect(rls.length).toBe(1);
      expect(rls[0].value).toBe('id1');
      expect(rls[0].type).toBe('rule');
      expect(rls[0].left.value).toBe('one_two_1_234_tres');
      expect(rls[0].left.type).toBe('terminal');
      expect(rls[0].left.right).toBe(undefined);
    });


    it("should throw on checkGrammar",()=>{
      const grmParser = new GrammarParser(`id1=one_two_1_234_tres;`);
      expect(grmParser.rules.length).toBe(1);
      expect(()=>{grmParser.checkGrammar()}).toThrow(GrammarSyntaxError);
    });

    it("Should throw a GrammarSyntaxError for Cyclic dependancy", ()=>{
      const grammar = `
        start  = factor ;
        factor = term, '123', ";" ;
        term   = factor ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      expect(()=>{
        grmParser.checkGrammar()
      }).toThrow(GrammarSyntaxError);
    });

    it("Should not throw a Cyclic dependancy", ()=>{
      const grammar = `
        start  = factor ;
        factor = '123', term, ";" ;
        term   = factor ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      expect(()=>{
        grmParser.checkGrammar()
      }).toNotThrow();
    });

    it("Should throw a Cyclic dependancy", ()=>{
      const grammar = `
        start  = term, ";" ;
        term   = unary ;
        unary  = ["-"], term ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      expect(()=>{
        grmParser.checkGrammar()
      }).toThrow(GrammarSyntaxError);
    });

    it("Should not throw a Cyclic dependancy", ()=>{
      const grammar = `
        start  = term, ";" ;
        term   = unary ;
        unary  = ("-"), term ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      expect(()=>{
        grmParser.checkGrammar()
      }).toNotThrow();
    });

    it("Should not throw a Cyclic dependancy", ()=>{
      const grammar = `
        start  = term, ";" ;
        term   = unary ;
        unary  = {"-"}, term ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      expect(()=>{
        grmParser.checkGrammar()
      }).toNotThrow();
    });

    it("should create terminals from grammar",()=>{
      const grmParser = new GrammarParser(
        `letter='a'|'b'|'c';
         digit='0'|'1'|'2'|'3'|'4';
         keywd='ab1';`);
      expect(grmParser.rules.length).toBe(3);
      expect(grmParser.terminals.letter).toBeObj(['a','b','c']);
      expect(grmParser.terminals.digit).toBeObj(['0','1','2','3','4']);
      expect(grmParser.terminals.keywd).toBeObj(['ab1']);
      expect(grmParser.tokenMatches.letter.r.source).toBe(/^(?:a|b|c)/.source);
      expect(grmParser.tokenMatches.digit.r.source).toBeObj(/^(?:0|1|2|3|4)/.source);
      expect(grmParser.tokenMatches.keywd).toBeObj({s:'ab1'});
    });

    it("should create terminals special_sequence",()=>{
      const grmParser = new GrammarParser("id=? printable_character ?;");
      expect(grmParser.rules.length).toBe(1);
      expect(grmParser.terminals.special_sequence).toBeObj(['printable_character']);
    });

    it("should create terminals longer above shorter",()=>{
      const grmParser = new GrammarParser(
        `letter='a'|'b'|'c';
         digit='0'|'1'|'2'|'3'|'4';
         keywd='ab1'|'baca1a'|'ab1a';
         name='ab1c'|'bac1';
         literal='ab1cda'|'ba';`);
      expect(grmParser.rules.length).toBe(5);
      const matches = grmParser.tokenMatches;
      expect(Object.keys(matches)).toBeObj([
        'keywd','literal','keywd_1','name','keywd_2','literal_1','digit','letter']);
      expect(matches.letter.r?.source).toBe(/^(?:a|b|c)/.source);
      expect(matches.digit.r?.source).toBeObj(/^(?:0|1|2|3|4)/.source);
      expect(matches.keywd.s).toBe('baca1a');
      expect(matches.literal.s).toBe('ab1cda');
      expect(matches.keywd_1.s).toBe('ab1a');
      expect(matches.name.r?.source).toBe(/^(?:ab1c|bac1)/.source);
      expect(matches.keywd_2.s).toBe('ab1');
      expect(matches.literal_1.s).toBe('ba');
    });

    it("Should create terminals with space as require stringState", ()=>{
      const grmParser = new GrammarParser("id=' '|'\\t';");
      expect(grmParser.rules.length).toBe(1);
      expect(grmParser.terminals.id.state).toBe('stringState');
    });
  });
});

registerTestSuite("test Parser, CST generation", ()=>{
  describe("test Grammar to CST", ()=>{
    it("Should construct a CST parser from grammar", ()=>{
      const grammar = `
        start = {factor, ['\\n']} ;
        factor = '123', ";" ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      const parser = new Parser({grmParser, source:`123;\n123;`});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(2);
      expect(root.children[0]?.type).toBe('factor');
      expect(root.children[0]?.children[0]?.tokString()).toBe('123');
      expect(root.children[0]?.children[1]?.tokString()).toBe(';');
      expect(root.children[1]?.children[0]?.tok.parseInfo.line).toBe(2);
      expect(root.children[1]?.type).toBe('factor');
      expect(root.children[1]?.children[0]?.tokString()).toBe('123');
      expect(root.children[1]?.children[1]?.tokString()).toBe(';');
    });

    it("Should test concatination", ()=>{
      const grammar =`start  = '1','2','3';`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"123"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"12"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"23"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"13"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"3"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("123");
    });

    it("Should test alternation", ()=>{
      const grammar =`start  = '1'|'2'|'3';`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"2"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"3"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"13"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"321"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"123"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("3");
    });

    it("Should test repetition", ()=>{
      const grammar =`start  = {'1'|'2'|'3'};`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"2"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"3"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"12"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"23"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"13"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"123321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"2321321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"32"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"12312342"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"1234"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"423"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("32");
    });

    it("Should test optional before", ()=>{
      const grammar =`start  = ['0'],{'1'|'2'|'3'};`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"02"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"023"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"0123321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"2321321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"32"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"30"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"102"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("32");
    });

    it("Should test optional after", ()=>{
      const grammar =`start  = {'1'|'2'|'3'}, ['0'];`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"20"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"230"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"1233210"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"23213021"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"32"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"03"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"102"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("32");
    });

    it("Should test optional combined", ()=>{
      const grammar =`start  = ['0'], {'1'|'2'|'3'}, ['0'];`
      const grmParser = new GrammarParser(grammar, 'start');
      let parser;
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"20"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"230"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"1233210"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"23213021"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"32"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"03"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"102"});}).toThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"1"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"02"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"023"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"0123321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"2321321"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"30"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"01233210"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"023213210"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"32"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"0230"});}).toNotThrow(SyntaxError);
      expect(()=>{parser = new Parser({grmParser,source:"102"});}).toThrow(SyntaxError);
      expect(parser?.prgCstRoot.tokString()).toBe("0230");
    });

    it("Should construct a CST parser from grammar", ()=>{
      const grammar =
      `start  = expr, ";" ;
       expr   = [ '!' ], number | name ;
       number = '123';
       name   = 'name';
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      const parser = new Parser({grmParser, source:`123;\n`});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(2);
      expect(root.children[0].type).toBe('expr');
      expect(root.children[0]?.tokString()).toBe('123');
      expect(root.children[1]?.tokString()).toBe(';');
      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([]);
    });

    it("Should prevent endless loop with optional inside repetition", ()=>{
      const grammar =
      `start  = { ['1', '\\n'] } ;
      `;
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      expect(()=>{
        const parser = new Parser({grmParser, source:`1\n1\n`});
      }).toThrow(SyntaxError);
    });

    const grammar = `
      start = factor, [{factor}], [";"] ;
      factor = number | ident ;
      number = digit, [{ digit }] ;
      digit = '1' | '2' | '3' ;
      ident =  literal, [{literal}] ;
      literal = 'a' | 'b' | 'c' ;
    `;

    it("Should create with rules in correct order", ()=>{
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      const parser = new Parser({grmParser, source:`123abc;\n`});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(3);
      expect(root.children[0].type).toBe('factor');
      expect(root.children[0]?.children[0]?.tokString()).toBe('123');
      expect(root.children[1]?.children[0]?.tokString()).toBe('abc');
      expect(root.children[2]?.tokString()).toBe(';');

      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([
        'start(undefined)',
          'factor(start)',
            'number(factor)',
              'digit(number)',
                'terminal(digit)',
              'digit(number)',
                'terminal(digit)',
              'digit(number)',
                'terminal(digit)',
          'factor(start)',
            'ident(factor)',
              'literal(ident)',
                'terminal(literal)',
              'literal(ident)',
                'terminal(literal)',
              'literal(ident)',
                'terminal(literal)',
          'terminal(start)'
      ]);
    });

    it("Should flatten rules", ()=>{
      const grmParser = new GrammarParser(grammar, 'start');
      grmParser.checkGrammar();
      const parser = new Parser({grmParser, source:`123abc;\n`,
                                 flattenRules:['number','ident']});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(3);
      expect(root.children[0].type).toBe('factor');

      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([
        'start(undefined)',
          'factor(start)',
            'number(factor)',
              'digit(number)',
          'factor(start)',
            'ident(factor)',
              'literal(ident)',
          'terminal(start)'
      ]);
    });

    it("Should allow strings to contain keywords", ()=>{
      const grmParser = new GrammarParser(`
        start={stmt|string|space};
        stmt=keywd,';';
        keywd='return'|'not'|'it'|'string';
        literal='a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'
               |'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z';
        space=' '|'\\n';
        punctuation=','|"'"|'.';
        (*we must include keywd here as that get tokenized and
          has higher prio than literal*)
        string='"', {keywd|literal|space|punctuation}, '"';
      `, 'start');
      grmParser.checkGrammar();
      const parser = new Parser({
        grmParser, source:`return;
          "return, not a syntaxerror because it's inside a string"
        `});
      expect(parser.prgCstRoot).toBeInstanceOf(SyntaxTreeNode);
      console.log(parser.prgAstRoot.asObject())
    })
  });

  it("Should delegate tokenization to special_sequence callback", ()=>{
    const grammar =
    `start  = expr, ";" ;
     expr   =  ? string_sequence ?;
    `;
    const grmParser = new GrammarParser(grammar, 'start');
    const source = "'This is a long string\\' which is escaped \\'';"; // no ';' at end
    const parser = new Parser({grmParser,source, tokenMatches:{
      ...grmParser.tokenMatches,
      special_sequence:[
        {n:'string_sequence', cb:(str)=>{
          const res = /^(?:(")(?:\\\1|[^"])*\1|(?:(')(?:\\\2|[^'])*\2))/um.exec(str);
          if (res) return res[0];
        }}
      ]
    }});
    const root = parser.prgCstRoot;
    expect(root.children[0]?.children[0]?.tok?.type).toBe('string_sequence');
    expect(root.children[0]?.children[0]?.tok?.str).toBe("'This is a long string\\' which is escaped \\''");
  });

  it("Should throw if not all source is parsed", ()=>{
    const grammar =
    `start  = expr, ";" ;
     expr   = '123';
    `;
    const grmParser = new GrammarParser(grammar, 'start');
    let parser = null, source = "123;\n123"; // no ';' at end
    expect(()=>{
      parser = new Parser({grmParser,source});
    }).toThrow(SyntaxError);
  });
});

const superSimpleLang = {
  grammar:
  `start      = {statement} ;
   statement  = (varStmt | ifStmt | assignment | expression) ,[';'] ;
   varStmt    = 'var', (assignment | identifier);
   ifStmt     = 'if', '(', expression, ')',
                   (block | statement),
                 ['else', (block|statement)];
   block      = '{', {statement}, '}' ;
   comparison = atom, ('=='|'!='), atom ;
   assignment = identifier, '=', expression ;
   expression = comparison | assignment | identifier | number;
   atom       = number | identifier ;
   number     = {digit} ;
   digit      = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9' ;
   identifier = (literal|'_'),{literal|'_'|digit};
   literal    = 'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'
              | 'l'|'m'|'n'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'z';`,

  defaultSource:
   `var id1=123;
    if  (id1 == 123) id1=321;
    else var id2;
    id2 != id1;
    id2=231`
}

registerTestSuite("test Parser, AST generation", ()=>{
  describe("Test the CST -> AST generation part of Parser", ()=>{
    const makeGrammar = (grammar)=> {
      const grmParser = new GrammarParser(
        grammar||superSimpleLang.grammar, "start");
      grmParser.checkGrammar();
      return grmParser;
    }

    const makeParser = (args)=> {
      const grmParser = makeGrammar(args.grammar);
      return new Parser({grmParser, ...args});
    }

    it("Should produce a AST tree",()=>{
      const parser = makeParser({source: "var id1=123;"});
      const root = parser.prgAstRoot;
      const varStmt = root?.left?.left;
      const identifier = varStmt?.right?.left;
      const expression = varStmt?.right?.right?.right;
      const number = expression?.left;
      const equal = varStmt?.right?.right?.left;
      expect(root?.left?.type).toBe('statement');
      expect(root?.left?.left?.type).toBe('varStmt');
      expect(root?.left?.right?.value).toBe(';');
      expect(varStmt?.type).toBe('varStmt');
      expect(varStmt?.left?.type).toBe('terminal');
      expect(varStmt?.left?.value).toBe('var');
      expect(varStmt?.right?.type).toBe('assignment');
      expect(identifier?.type).toBe('identifier');
      expect(equal?.type).toBe('terminal');
      expect(equal?.value).toBe('=');
      expect(expression?.type).toBe('expression');
      expect(number?.type).toBe('number');
      expect(identifier?.left?.type).toBe("literal");
      expect(identifier?.left?.left?.value).toBe("i");
      expect(identifier?.right?.left?.type).toBe("literal");
      expect(identifier?.right?.left?.left?.value).toBe("d");
      expect(identifier?.right?.right?.type).toBe("digit");
      expect(identifier?.right?.right?.left?.value).toBe("1");
      expect(number?.left?.type).toBe('digit');
      expect(number?.left?.left?.value).toBe('1');
      expect(number?.left?.left?.type).toBe('terminal');
      expect(number?.right?.type).toBe('number');
      expect(number?.right?.left?.type).toBe('digit');
      expect(number?.right?.left?.left?.value).toBe('2');
      expect(number?.right?.right?.left?.value).toBe('3');
    });

    it("Should drop terminals, checks all nodes",()=>{
      const parser = makeParser({
        source: "var id1=123;",
        dropTerminalsOnAllRules:['var','=',';']
      });
      const root = parser.prgAstRoot;
      const varStmt = root?.left?.left;
      const assignment = varStmt?.left;
      const identifier = assignment?.left;
      const expression = assignment?.right;
      const number = expression?.left;
      expect(root?.left?.type).toBe('statement');
      expect(root?.left?.left?.type).toBe('varStmt');
      expect(root?.left?.right).toBe(undefined);
      expect(varStmt?.type).toBe('varStmt');
      expect(varStmt?.left?.type).toBe('assignment');
      expect(identifier?.type).toBe('identifier');
      expect(expression?.type).toBe('expression');
      expect(number?.type).toBe('number');
      expect(identifier?.left?.type).toBe("literal");
      expect(identifier?.left?.left?.value).toBe("i");
      expect(identifier?.right?.left?.type).toBe("literal");
      expect(identifier?.right?.left?.left?.value).toBe("d");
      expect(identifier?.right?.right?.type).toBe("digit");
      expect(identifier?.right?.right?.left?.value).toBe("1");
      expect(number?.left?.type).toBe('digit');
      expect(number?.left?.left?.value).toBe('1');
      expect(number?.left?.left?.type).toBe('terminal');
      expect(number?.right?.type).toBe('number');
      expect(number?.right?.left?.type).toBe('digit');
      expect(number?.right?.left?.left?.value).toBe('2');
      expect(number?.right?.right?.left?.value).toBe('3');
    });

    it("Should drop terminals, checks a specific node",()=>{
      const parser = makeParser({
        source: "var id1=123;",
        dropTerminalsOnRules:{varStmt:['var'],assignment:['=',';']}
      });
      const root = parser.prgAstRoot;
      const varStmt = root?.left?.left;
      const assignment = varStmt?.left;
      const identifier = assignment?.left;
      const expression = assignment?.right;
      const number = expression?.left;
      expect(root?.left?.type).toBe('statement');
      expect(root?.left?.left?.type).toBe('varStmt');
      expect(root?.left?.right?.value).toBe(';'); // should be kept
      expect(varStmt?.type).toBe('varStmt');
      expect(varStmt?.left?.type).toBe('assignment');
      expect(identifier?.type).toBe('identifier');
      expect(expression?.type).toBe('expression');
      expect(number?.type).toBe('number');
      expect(identifier?.left?.type).toBe("literal");
      expect(identifier?.left?.left?.value).toBe("i");
      expect(identifier?.right?.left?.type).toBe("literal");
      expect(identifier?.right?.left?.left?.value).toBe("d");
      expect(identifier?.right?.right?.type).toBe("digit");
      expect(identifier?.right?.right?.left?.value).toBe("1");
      expect(number?.left?.type).toBe('digit');
      expect(number?.left?.left?.value).toBe('1');
      expect(number?.left?.left?.type).toBe('terminal');
      expect(number?.right?.type).toBe('number');
      expect(number?.right?.left?.type).toBe('digit');
      expect(number?.right?.left?.left?.value).toBe('2');
      expect(number?.right?.right?.left?.value).toBe('3');
    });

    it("Should attach same actions to all",()=>{
      const visited = [];
      class MyAction extends ActionBase {
        visit() {
          visited.push({tp:this.astNode.type, vlu:this.astNode.value})
          super.visit();
        }
      }
      const parser = makeParser({
        source: "var id1=123;",
        flattenRules:['number','identifier'],
        dropTerminalsOnRules:{varStmt:['var'],assignment:['=',';']},
        defaultAction:MyAction
      });
      const root = parser.prgAstRoot;
      root.action.visit();

      expect(visited[0]).toBeObj({tp:'start',vlu:''});
      expect(visited[1]).toBeObj({tp:'statement',vlu:''});
      expect(visited[2]).toBeObj({tp:'varStmt',vlu:''});
      expect(visited[3]).toBeObj({tp:'assignment',vlu:''});
      expect(visited[4]).toBeObj({tp:'identifier',vlu:''});
      expect(visited[5]).toBeObj({tp:'literal',vlu:'id1'});
      expect(visited[6]).toBeObj({tp:'expression',vlu:''});
      expect(visited[7]).toBeObj({tp:'number',vlu:''});
      expect(visited[8]).toBeObj({tp:'digit',vlu:'123'})
      expect(visited[9]).toBeObj({tp:'terminal',vlu:';'});
    });

    it("Should attach specific actions",()=>{
      const identifiers = [];
      class IdentAction extends ActionBase {
        visit() {
          identifiers.push(this.astNode.left.value);
          super.visit();
        }
      }
      const parser = makeParser({
        source: "var id1=123;",
        flattenRules:['number','identifier'],
        dropTerminalsOnRules:{varStmt:['var'],assignment:['=',';']},
        actionForRules:{identifier:IdentAction}
      });
      const root = parser.prgAstRoot;
      root.action.visit();
      expect(identifiers.length).toBe(1);
      expect(identifiers[0]).toBe('id1');
    });
    it("Should attach mixed actions",()=>{
      const identifiers = [], constants = [], visited = [];
      class MyAction extends ActionBase {
        visit() {
          visited.push({tp:this.astNode.type, vlu:this.astNode.value})
          super.visit();
        }
      }
      class IdentAction extends ActionBase {
        visit() {
          identifiers.push(this.astNode.left.value);
          visited.push({tp:this.astNode.type, vlu:this.astNode.value})
          super.visit();
        }
      }
      class ConstantAction extends ActionBase {
        visit() {
          constants.push(this.astNode.left.value);
          visited.push({tp:this.astNode.type, vlu:this.astNode.value})
          super.visit();
        }
      }
      const parser = makeParser({
        source: "var id1=123;",
        flattenRules:['number','identifier'],
        dropTerminalsOnRules:{varStmt:['var'],assignment:['=',';']},
        defaultAction:MyAction,
        actionForRules:{identifier:IdentAction,number:ConstantAction}
      });
      const root = parser.prgAstRoot;
      root.action.visit();
      expect(identifiers.length).toBe(1);
      expect(identifiers[0]).toBe('id1');
      expect(constants[0]).toBe('123');
      expect(visited[0]).toBeObj({tp:'start',vlu:''});
      expect(visited[1]).toBeObj({tp:'statement',vlu:''});
      expect(visited[2]).toBeObj({tp:'varStmt',vlu:''});
      expect(visited[3]).toBeObj({tp:'assignment',vlu:''});
      expect(visited[4]).toBeObj({tp:'identifier',vlu:''});
      expect(visited[5]).toBeObj({tp:'literal',vlu:'id1'});
      expect(visited[6]).toBeObj({tp:'expression',vlu:''});
      expect(visited[7]).toBeObj({tp:'number',vlu:''});
      expect(visited[8]).toBeObj({tp:'digit',vlu:'123'})
      expect(visited[9]).toBeObj({tp:'terminal',vlu:';'});
    });

    it("Should delegate to specific to generateFunc",()=>{
      let cNode = null, prser = null;
      const identCb = (cstNode, parser)=>{
        cNode = cstNode, prser = parser;
        // for this test we simply delegate back to parser
        // to generate subtree
        const ast = parser.createAstNode(cstNode);
        const ch = parser.generateNode(cstNode.children[0]);
        return ast.addLeft(ch);
      }

      const parser = makeParser({
        source: "var id1=123;",
        dropTerminalsOnAllRules:['var','=',';'],
        flattenRules:['identifier','number'],
        generateFuncs:{identifier:identCb}
      });
      const root = parser.prgAstRoot;
      const varStmt = root?.left?.left;
      const assignment = varStmt?.left;
      const identifier = assignment?.left;
      const expression = assignment?.right;
      const number = expression?.left;
      expect(cNode).toBe(identifier.cstNode);
      expect(prser).toBe(parser);
      expect(root?.left?.type).toBe('statement');
      expect(root?.left?.left?.type).toBe('varStmt');
      expect(root?.left?.right).toBe(undefined);
      expect(varStmt?.type).toBe('varStmt');
      expect(varStmt?.left?.type).toBe('assignment');
      expect(identifier?.type).toBe('identifier');
      expect(expression?.type).toBe('expression');
      expect(number?.type).toBe('number');
      expect(identifier?.left?.type).toBe("literal");
      expect(identifier?.left?.value).toBe("id1");
      expect(number?.left?.type).toBe('digit');
      expect(number?.left?.value).toBe('123');
    });
  });
});

registerTestSuite("test supersimple lang running code",()=>{
  describe("Should test implementation of a vm running code", ()=>{
    it("Should test language, super simple VM",()=>{
      const source =
      `var id1=123;  var id2 = 456;
       if  (id1 == 123) id1=321;
       else {id2 = 654;}
       id2 != id1;
       id2=231`;
      const variables = {}, assignments = [], comparisons = [];

      const parser = initSuperSimpleVM(source, comparisons, assignments, variables);
      const root = parser.prgAstRoot;
      root.action.visit();
      expect(Object.keys(variables).length).toBe(2);
      expect(Object.keys(variables)[0]).toBe('id1');
      expect(Object.keys(variables)[1]).toBe('id2');
      expect(variables.id1).toBe("321");
      expect(variables.id2).toBe("231");
      expect(assignments.length).toBe(4);
      expect(assignments[0]).toBeObj({ident:'id1',value:"123"});
      expect(assignments[1]).toBeObj({ident:'id2',value:"456"});
      expect(assignments[2]).toBeObj({ident:'id1',value:"321"});
      expect(assignments[3]).toBeObj({ident:'id2',value:"231"});
      expect(comparisons.length).toBe(2);
      expect(comparisons[0]).toBeObj({left:'id1', right:"123", value: true});
      expect(comparisons[1]).toBeObj({left:'id2', right:'id1', value: true});
    });
  })
})

function initSuperSimpleVM(source, comparisons, assignments, variables) {
  class IfAction extends ActionBase {
    visit() {
      const compareNode = this.astNode.left,
            statementNode = this.astNode.right.left,
            elseNode = this.astNode.right.right,
            elseStmtNode = this.astNode.right.right.left;
      let compare = compareNode.action.visit();
      if (compare instanceof ActionBase)
        compare = compare.value;
      if (compare)
        statementNode.action.visit();
      else if (elseNode.value==='else')
        elseStmtNode.action.visit();
    }
  }
  class DeclAction extends ActionBase {
    visit() {
      const identifier = this.astNode.left.left.left.value;
      variables[identifier] = null;
      super.visit();
    }
  }
  class AssignAction extends ActionBase {
    visit() {
      const identNode = this.astNode.left.action.visit(),
            valueNode = this.astNode.right.action.visit();
      if (!(identNode.value in variables))
        throw Error(`Runtime error, ${identNode.value} not found,?` +
                    ` at ${this.astNode.cstNode.tok?.parseInfo}`);
      variables[identNode.value] = valueNode.value;
      assignments.push({ident:identNode.value, value: valueNode.value});
    }
  }
  class CompareAction extends ActionBase {
    visit() {
      const left = this.astNode.left?.action.visit(),
            right = this.astNode.right?.action.visit();
      let lVlu = left?.type === 'identifier' ?
        variables[left.value] : left?.value;
      let rVlu = right?.type === 'identifier' ?
        variables[right.value] : right?.value;
      const retVlu = this.astNode.value == '==' ?
        lVlu == rVlu : lVlu != rVlu;
      comparisons.push({left:left?.value, right:right?.value, value:retVlu});
      return retVlu;
    }
  }

  const grmParser = new GrammarParser(superSimpleLang.grammar, "start");
  grmParser.checkGrammar();

  return new Parser({grmParser, source,
    flattenRules:['number','identifier'],
    dropTerminalsOnAllRules:[
      'var','if','else','=',';','==','!=','(',')','{','}'],
    actionForRules:{
      comparison:CompareAction,
      ifStmt:IfAction,
      assignment:AssignAction,
      varStmt:DeclAction,
    }
  });
}
