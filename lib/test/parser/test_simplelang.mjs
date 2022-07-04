import {
  Parser, GrammarParser, AstTreeNode, SyntaxTreeNode, ActionBase
} from '../../parser/parser.mjs';

import { SimpleLang, simpleLangGrammar } from '../../parser/simplelang.mjs';

function rch(root,ch1Cnt,ch2Cnt,ch3Cnt,ch4Cnt,ch5Cnt,ch6Cnt,ch7Cnt,ch8Cnt,ch9Cnt,ch10Cnt){
  let node = root;
  for (let i = 1; i < arguments.length; ++i) {
    node = node?.children[arguments[i]];
  }
  return node;
}

const simplelangTestCode =
` var id1_2three = "str_id1_2three";
  var _number = 12345
  var i = 0;
  if (i < 10) print(id1_2three);
  else { i = 10; }
  log('i', i);

  function fun(iter, num) {
    var res = iter + num;
    print(res);
    return res;
  }

  while(_number > 1000) {
    _number = _number - 1235;
    print(_number);
    var res = fun(i, _number);
    log('res',res)
  }
`;

registerTestSuite("test Parser, simplelang", ()=>{
  describe("test Constructor", ()=>{
    const grammar = `${simpleLangGrammar}`;
    const grmParser = new GrammarParser(grammar, 'program');
    grmParser.checkGrammar();
    it("Should construct a CST parser from grammar", ()=>{
      const parser = new Parser({grmParser, source:`123;`}); //, trace:true});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(1);
      expect(root.children[0].children[0].children[0].tokString()).toBe('123');
      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([
        'program(undefined)',
          'statement(program)',
            'expression(statement)',
              'logic_or(expression)',
                'logic_and(logic_or)',
                  'equality(logic_and)',
                    'comparison(equality)',
                      'term(comparison)',
                        'factor(term)',
                          'unary(factor)',
                            'primary(unary)',
                              'number(primary)',
                                'digit(number)',
                                  'terminal(digit)',
                                'digit(number)',
                                  'terminal(digit)',
                                'digit(number)',
                                  'terminal(digit)',
            'terminal(statement)'
      ]);

    });

    it("Should flatten number", ()=>{
      const parser = new Parser({grmParser, source:`123;`, flattenRules:['identifier','number','literal']});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(1);
      expect(root.children[0].children[0].children[0].tokString()).toBe('123');
      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([
        'program(undefined)',
          'statement(program)',
            'expression(statement)',
              'logic_or(expression)',
                'logic_and(logic_or)',
                  'equality(logic_and)',
                    'comparison(equality)',
                      'term(comparison)',
                        'factor(term)',
                          'unary(factor)',
                            'primary(unary)',
                              'number(primary)',
                                'digit(number)',
          'terminal(statement)'
      ]);
    });

    it("Should construct a CST parser from grammar", ()=>{
      const parser = new Parser({
        grmParser, source:`var lang1 = 'a' + 123;`});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(1);
      expect(root.children[0].tokString()).toBe("varlang1='a'+123;");
      expect(root.flat().map(n=>n.type+'('+n.parent?.type+')')).toBeObj([
        'program(undefined)',
          'statement(program)',
            'declaration(statement)',
              'terminal(declaration)',
              'assignment(declaration)',
                'identifier(assignment)',
                  'letter(identifier)',
                    'terminal(letter)',
                  'letter(identifier)',
                    'terminal(letter)',
                  'letter(identifier)',
                    'terminal(letter)',
                  'letter(identifier)',
                    'terminal(letter)',
                  'digit(identifier)',
                    'terminal(digit)',
                'terminal(assignment)',
                'expression(assignment)',
                  'logic_or(expression)',
                    'logic_and(logic_or)',
                      'equality(logic_and)',
                        'comparison(equality)',
                          'term(comparison)',
                            'factor(term)',
                              'unary(factor)',
                                'primary(unary)',
                                  'string(primary)',
                                    'terminal(string)',
                                      'litteral(string)',
                                        'letter(litteral)',
                                          'terminal(letter)',
                                    'terminal(string)',
                            'terminal(term)',
                            'factor(term)',
                              'unary(factor)',
                                'primary(unary)',
                                  'number(primary)',
                                    'digit(number)',
                                      'terminal(digit)',
                                      'digit(number)',
                                        'terminal(digit)',
                                    'digit(number)',
                                      'terminal(digit)',
              'terminal(declaration)'
      ]);
    });

    it("Should parse assignment with expression", ()=>{
      const parser = new Parser({
        grmParser, source:'var n; n = n + -1234;'});
      const root = parser.prgCstRoot;
      expect(rch(root,1,0)?.type).toBe('expression');
      expect(rch(root,1,0,0)?.type).toBe('assignment');
      expect(rch(root,1,0,0,0)?.type).toBe('identifier');
      expect(rch(root,1,0,0,1)?.type).toBe('terminal');
      expect(rch(root,1,0,0,1)?.tok?.str).toBe('=');
      expect(rch(root,1,0,0,2)?.type).toBe('expression');
      expect(rch(root,1,0,0,2,0,0,0,0,0)?.type).toBe('term');
      expect(rch(root,1,0,0,2,0,0,0,0,0,0)?.type).toBe('factor');
      expect(rch(root,1,0,0,2,0,0,0,0,0,1)?.type).toBe('terminal');
      expect(rch(root,1,0,0,2,0,0,0,0,0,2)?.type).toBe('factor');
    });

    it("Should parse test program", ()=>{
      const source = simplelangTestCode;
      const parser = new Parser({grmParser, source});
      const root = parser.prgCstRoot;
      expect(root.children.length).toBe(7);
      expect(rch(root,0,0)?.type).toBe('declaration');
      expect(rch(root,1,0)?.type).toBe('declaration');
      expect(rch(root,2,0)?.type).toBe('declaration');
      expect(rch(root,3,0)?.type).toBe('ifStmt');
      expect(rch(root,3,0,1)?.type).toBe('grouping');
      expect(rch(root,3,0,2)?.type).toBe('statement');
      expect(rch(root,3,0,2,0,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,3,0,2,0,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,3,0,2,0,0,0,0,0,0,0,0,0,2,0)?.type).toBe('expression');
      expect(rch(root,3,0,2,0,0,0,0,0,0,0,0,0,2,0,
                      0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,3,0,3)?.type).toBe('elseStmt');
      expect(rch(root,3,0,3,1).type).toBe('block');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2,0,0,0,
                      0,0,0,0,0,0,0)?.type).toBe('string');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2,0,0)?.tokString()).toBe("'i'");
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2,1)?.tokString()).toBe(',');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2,2,0,0,
                      0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,4,0,0,0,0,0,0,0,0,0,2,2,0)?.tokString()).toBe("i");

      // func declaration function fun(iter + num)
      expect(rch(root,5,0)?.type).toBe('funcStmt');
      expect(rch(root,5,0,1)?.type).toBe('identifier');
      expect(rch(root,5,0,3)?.type).toBe('parameters');
      expect(rch(root,5,0,3,0)?.type).toBe('identifier');
      expect(rch(root,5,0,3,2)?.type).toBe('identifier');
      expect(rch(root,5,0,5)?.type).toBe('block');
      // row 1 in fun var res = iter + num
      expect(rch(root,5,0,5,1,0)?.type).toBe('declaration');
      expect(rch(root,5,0,5,1,0,1)?.type).toBe('assignment');
      expect(rch(root,5,0,5,1,0,1,0)?.type).toBe('identifier');
      expect(rch(root,5,0,5,1,0,1,2)?.type).toBe('expression');
      expect(rch(root,5,0,5,1,0,1,2,0,0,0,0,0)?.type).toBe('term');
      expect(rch(root,5,0,5,1,0,1,2,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,5,0,5,1,0,1,2,0,0,0,0,0,1)?.type).toBe('terminal');
      expect(rch(root,5,0,5,1,0,1,2,0,0,0,0,0,1)?.tok?.str).toBe('+');
      expect(rch(root,5,0,5,1,0,1,2,0,0,0,0,0,2,0,0,0)?.type).toBe('identifier');
      expect(rch(root,5,0,5,1,0)?.type).toBe('declaration');
      // print(res)
      expect(rch(root,5,0,5,2,0,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,5,0,5,2,0,0,0,0,0,0,0,0,0,0)?.tokString()).toBe('print');
      expect(rch(root,5,0,5,2,0,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,5,0,5,2,0,0,0,0,0,0,0,0,0,2,0)?.type).toBe('expression');
      expect(rch(root,5,0,5,2,0,0,0,0,0,0,0,0,0,2,0,0,
                      0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      // return res
      expect(rch(root,5,0,5,3,0)?.type).toBe('retStmt');
      expect(rch(root,5,0,5,3,0,1)?.type).toBe('expression');
      expect(rch(root,5,0,5,3,0,1,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');

      // while(_number > 1000)
      expect(rch(root,6,0)?.type).toBe('whileStmt');
      expect(rch(root,6,0,1)?.type).toBe('grouping');
      expect(rch(root,6,0,1,1)?.type).toBe('expression');
      expect(rch(root,6,0,1,1,0,0,0,0)?.type).toBe('comparison');
      expect(rch(root,6,0,1,1,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,1,1,0,0,0,0,1)?.tokString()).toBe('>');
      expect(rch(root,6,0,1,1,0,0,0,0,2,0,0,0,0)?.type).toBe('number');
      expect(rch(root,6,0,2)?.type).toBe('block');
      // _number = number - 1235
      expect(rch(root,6,0,2,1,0,0)?.type).toBe('assignment');
      expect(rch(root,6,0,2,1,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,1,0,0,2)?.type).toBe('expression');
      expect(rch(root,6,0,2,1,0,0,2,0,0,0,0,0)?.type).toBe('term');
      expect(rch(root,6,0,2,1,0,0,2,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,1,0,0,2,0,0,0,0,0,1)?.tokString()).toBe('-');
      expect(rch(root,6,0,2,1,0,0,2,0,0,0,0,0,2,0,0,0)?.type).toBe('number');
      // print(_number)
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0,0)?.tokString()).toBe('print');
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0,2)?.children.length).toBe(1);
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0,2,
                      0,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,2,0,0,0,0,0,0,0,0,0,2,
                      0,0,0,0,0,0,0,0,0,0)?.tokString()).toBe('_number');
      // var res = fun(i, _number)
      expect(rch(root,6,0,2,3,0)?.type).toBe('declaration');
      expect(rch(root,6,0,2,3,0,1)?.type).toBe('assignment');
      expect(rch(root,6,0,2,3,0,1,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,3,0,1,0)?.tokString()).toBe('res');
      expect(rch(root,6,0,2,3,0,1,1)?.type).toBe('terminal');
      expect(rch(root,6,0,2,3,0,1,2)?.type).toBe('expression');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,0)?.tokString()).toBe('fun');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2)?.children.length).toBe(3);
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2,
                      0,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2,
                      0)?.tokString()).toBe('i');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2,
                      1)?.tok?.str).toBe(',');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2,
                      2,0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,3,0,1,2,0,0,0,0,0,0,0,0,2,
                      2)?.tokString()).toBe('_number');
      // log('res',res)
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0)?.type).toBe('call');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,0)?.tokString()).toBe('log');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2)?.type).toBe('arguments');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2,0)?.tokString()).toBe("'res'");
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2,0,
                      0,0,0,0,0,0,0,0,0)?.type).toBe('string');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2,1)?.tokString()).toBe(',');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2,2)?.tokString()).toBe('res');
      expect(rch(root,6,0,2,4,0,0,0,0,0,0,0,0,0,2,2,
                      0,0,0,0,0,0,0,0,0)?.type).toBe('identifier');
      expect(rch(root,6,0,2,5)?.tokString()).toBe('}');
    });
  });
});

registerTestSuite("test Simplelang VM", ()=>{
  describe("testing initialization", ()=>{
    it("Should construct with empty source",()=>{
      const smpl = new SimpleLang();
      expect(smpl.parser).toBe(undefined);
      expect(smpl.logEntries.length).toBe(0);
    });
    it("Should construct with source, parse and run",()=>{
      const smpl = new SimpleLang(simplelangTestCode);
      expect(smpl.parser).toBeInstanceOf(Parser);
      expect(smpl.parser.prgAstRoot).toBeInstanceOf(AstTreeNode);
      expect(smpl.logEntries.length).toBe(11);
      expect(smpl.logEntries[0]).toBeObj({key:'i',value:0});
      expect(smpl.logEntries[1]).toBeObj({key:'res',value:11110});
      expect(smpl.logEntries[2]).toBeObj({key:'res',value:9875});
      expect(smpl.logEntries[3]).toBeObj({key:'res',value:8640});
      expect(smpl.logEntries[4]).toBeObj({key:'res',value:7405});
      expect(smpl.logEntries[5]).toBeObj({key:'res',value:6170});
      expect(smpl.logEntries[6]).toBeObj({key:'res',value:4935});
      expect(smpl.logEntries[7]).toBeObj({key:'res',value:3700});
      expect(smpl.logEntries[8]).toBeObj({key:'res',value:2465});
      expect(smpl.logEntries[9]).toBeObj({key:'res',value:1230});
      expect(smpl.logEntries[10]).toBeObj({key:'res',value:-5});
    });
  });

  describe("testing to parse and run explicitly",()=>{
    it("Should parse source",()=>{
      const smpl = new SimpleLang();
      smpl.parse(simplelangTestCode);
      expect(smpl.parser.prgAstRoot).toBeInstanceOf(AstTreeNode);
      expect(smpl.parser.grmParser.rules.length).toGt(30);
    });

    it("Should run program",()=>{
      const smpl = new SimpleLang();
      smpl.parse(simplelangTestCode);
      smpl.run();
      expect(smpl.parser).toBeInstanceOf(Parser);
      expect(smpl.parser.prgAstRoot).toBeInstanceOf(AstTreeNode);
      expect(smpl.logEntries.length).toBe(11);
    });

  })
})
