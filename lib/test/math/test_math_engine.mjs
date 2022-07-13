"use strict";

import {
  GrammarParser, Parser
} from '../../parser/parser.mjs';

import {
  mathExprGrm, MathEngine
} from '../../math/math_engine.mjs';

import {rch} from '../parser/test_parser_helpers.mjs';


const grmParser = new GrammarParser(mathExprGrm, 'start');
grmParser.checkGrammar();

const makeParser = (source, trace=false)=>{
  return new Parser({grmParser,source, trace});
}

const makeRootCheck = (source, trace) => {
  const parser = makeParser(source, trace);
  const root = parser.prgCstRoot;
  return function (){
    return rch.apply(globalThis, [root, ...arguments]);
  }
}

registerTestSuite("test Math expression parser basic", ()=>{
  describe("Test single value", ()=>{
    it("Should test 1", ()=>{
      //expect(()=>{
        const chk = makeRootCheck("1");
        expect(chk(0).children.length).toBe(1);
        expect(chk(0)?.type).toBe('expression');
        expect(chk(0,0)?.type).toBe('term');
        expect(chk(0,0,0)?.type).toBe('factor');
        expect(chk(0,0,0,0)?.type).toBe('base');
        expect(chk(0,0,0,0,0)?.type).toBe('molecule');
        expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
        expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
        expect(chk(0,0,0,0,0,0,0,0,0)?.tok?.str).toBe('1');
      //}).toNotThrow();
    });
    it("Should test 10", ()=>{
      const chk = makeRootCheck("10");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0)?.type).toBe('expression');
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,0,0)?.tok?.str).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tok?.str).toBe('0');
    });
    it("Should test -1", ()=>{
      const chk = makeRootCheck("-1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0)?.type).toBe('expression');
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0)?.tok?.str).toBe('-');
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,1,0,0)?.tok?.str).toBe('1');
    });
    it("Should test -10", ()=>{
      const chk = makeRootCheck("-10");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0)?.type).toBe('expression');
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0)?.tok?.str).toBe('-');
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,1,0,0)?.tok?.str).toBe('1');
      expect(chk(0,0,0,0,0,0,1,1,0)?.tok?.str).toBe('0');
    });
    it("Should test (-10)", ()=>{
      const chk = makeRootCheck("(-10)");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0)?.type).toBe('expression');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0,1,0,0,0,0,0,0)?.tok?.str).toBe('-');
      expect(chk(0,0,0,0,0,0,0,1,0,0,0,0,0,1)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0)?.tok?.str).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0)?.tok?.str).toBe('0');
    });
    it("Should test +10", ()=>{
      const chk = makeRootCheck("+10");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0)?.type).toBe('expression');
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0)?.tok?.str).toBe('+');
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,1,0,0)?.tok?.str).toBe('1');
      expect(chk(0,0,0,0,0,0,1,1,0)?.tok?.str).toBe('0');
    });
    it("Should test 01234556789", ()=>{
      const chk = makeRootCheck("01234556789");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('01234556789');
    });
    it("Should test 0,1", ()=>{
      const chk = makeRootCheck("0,1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('0');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe(',');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,0,2)?.tokString()).toBe('1');
    });
    it("Should test 0.1", ()=>{
      const chk = makeRootCheck("0.1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('0');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('.');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,0,2)?.tokString()).toBe('1');
    });
    it("Should test 0,00000001", ()=>{
      const chk = makeRootCheck("0,00000001");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('0');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe(',');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,0,2)?.tokString()).toBe('00000001');
    });
    it("Should test 123456,67", ()=>{
      const chk = makeRootCheck("123456,67");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('123456');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe(',');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,0,2)?.tokString()).toBe('67');
    });
    it("Should test 1234566.7", ()=>{
      const chk = makeRootCheck("1234566.7");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('1234566');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('.');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,0,2)?.tokString()).toBe('7');
    });
    it("Should test fail 0.000,1", ()=>{
      expect(()=> {makeParser('0.000,1');}).toThrow();
    });
    it("Should test -0.1", ()=>{
      const chk = makeRootCheck("-0.1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0)?.tok?.str).toBe('-')
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0,1,0)?.type).toBe('wholenum');
      expect(chk(0,0,0,0,0,0,1,0)?.tokString()).toBe('0');
      expect(chk(0,0,0,0,0,0,1,1)?.type).toBe('decpoint');
      expect(chk(0,0,0,0,0,0,1,1)?.tokString()).toBe('.');
      expect(chk(0,0,0,0,0,0,1,2)?.type).toBe('fracnum');
      expect(chk(0,0,0,0,0,0,1,2)?.tokString()).toBe('1');
    });
    it("Should test a", ()=>{
      const chk = makeRootCheck("a");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('a');
    });
    it("Should test -a", ()=>{
      const chk = makeRootCheck("-a");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('-');
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,1,0)?.tok?.str).toBe('a');
    });
    it("Should test z", ()=>{
      const chk = makeRootCheck("z");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('z');
    });
    it("Should test fail å", ()=>{
      expect(()=>{makeParser('å');}).toThrow()
    });
    it("Should test A", ()=>{
      const chk = makeRootCheck("A");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('A');
    });
    it("Should test Z", ()=>{
      const chk = makeRootCheck("A");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('A');
    });
    it("Should test fail Å", ()=>{
      expect(()=>{makeParser('Å');}).toThrow()
    });
    it("Should combine to variables ab (implicit multiplcation)", ()=>{
      const chk = makeRootCheck("ab");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0,0)?.tok?.str).toBe('a');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tok?.str).toBe('b');
    });

    it("Should combine to int and variable 2a (implicit multiplcation)", ()=>{
      const chk = makeRootCheck("2a");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tok?.str).toBe('a');
    });
    it("Should combine to signed int and variable -2a (implicit multiplcation)", ()=>{
      const chk = makeRootCheck("-2a");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,0,1)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,1,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,1,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,1,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,1,1,0)?.tok?.str).toBe('a');
    });
    it("Should combine to variable and int a2 (implicit multiplcation)", ()=>{
      const chk = makeRootCheck("a2");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0,0)?.tok?.str).toBe('a');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tokString()).toBe('2');
    });
    it("Should combine to int and variable 2ab (implicit multiplcation)", ()=>{
      const chk = makeRootCheck("2ab");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tok?.str).toBe('a');
      expect(chk(0,0,0,0,0,0,0,2)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,2,0)?.tok?.str).toBe('b');
    });
    it("Should test complete alphabet", ()=>{
      expect(()=>{
        const chk = makeRootCheck('abcdefghijklmnopqrstuvwxyz');
        expect(chk(0,0,0,0,0,0,0).children.length).toBe(26);
        expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('abcdefghijklmnopqrstuvwxyz')
      }).toNotThrow();
    });
  });

  describe("Test fractions", ()=>{
    it("Should create fraction 1/2", ()=>{
      const chk = makeRootCheck("frac 1/2");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('frac');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('numerator');
      expect(chk(0,0,0,0,0,0,0,1,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,2)?.tok?.str).toBe('/');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('denominator');
      expect(chk(0,0,0,0,0,0,0,3,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,3)?.tokString()).toBe('2');
    });
    it("Should create fraction 3/2", ()=>{
      const chk = makeRootCheck("frac 3/2");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,0,0,3)?.tokString()).toBe('2');
    });
    it("Should create fraction a/2", ()=>{
      const chk = makeRootCheck("frac a/2");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('frac');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('numerator');
      expect(chk(0,0,0,0,0,0,0,1,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('a');
      expect(chk(0,0,0,0,0,0,0,2)?.tok?.str).toBe('/');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('denominator');
      expect(chk(0,0,0,0,0,0,0,3,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,3)?.tokString()).toBe('2');
    });
    it("Should create fraction 1/a", ()=>{
      const chk = makeRootCheck("frac 1/a");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('frac');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('numerator');
      expect(chk(0,0,0,0,0,0,0,1,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,2)?.tok?.str).toBe('/');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('denominator');
      expect(chk(0,0,0,0,0,0,0,3,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,3)?.tokString()).toBe('a');
    });
    it("Should create fraction 3a/2", ()=>{
      const chk = makeRootCheck("frac 3a/2");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('frac');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('numerator');
      expect(chk(0,0,0,0,0,0,0,1,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,0,0,1,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,1,1)?.tokString()).toBe('a');
      expect(chk(0,0,0,0,0,0,0,2)?.tok?.str).toBe('/');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('denominator');
      expect(chk(0,0,0,0,0,0,0,3,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,3)?.tokString()).toBe('2');
    });
    it("Should create fraction 1/2a", ()=>{
      const chk = makeRootCheck("frac1/2a");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('fraction');
      expect(chk(0,0,0,0,0,0,0,0)?.tok?.str).toBe('frac');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('numerator');
      expect(chk(0,0,0,0,0,0,0,1,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,1,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,2)?.tok?.str).toBe('/');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('denominator');
      expect(chk(0,0,0,0,0,0,0,3,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,3,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,3,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,3,1)?.tokString()).toBe('a');
    });
    it("Should create implicit mul and fraction, 1 1/2", ()=>{});
  });

  describe("Test single Expressions", ()=>{
    it("Should test 1+1",()=>{
      const chk = makeRootCheck("1+1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0)?.type).toBe('term');
      expect(chk(0,0,0)?.type).toBe('factor');
      expect(chk(0,0,0,0)?.type).toBe('base');
      expect(chk(0,0,0,0,0)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tok?.str).toBe('+');
      expect(chk(0,0,2,0,0)?.type).toBe('molecule');
      expect(chk(0,0,2,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,2,0,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test 1-1",()=>{
      const chk = makeRootCheck("1-1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0)?.type).toBe('term');
      expect(chk(0,0,0,0,0)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tok?.str).toBe('-');
      expect(chk(0,0,2,0,0)?.type).toBe('molecule');
      expect(chk(0,0,2,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,2,0,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test 1*1",()=>{
      const chk = makeRootCheck("1*1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0)?.type).toBe('factor');
      expect(chk(0,0,0,0,0)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.type).toBe('mul');
      expect(chk(0,0,0,1,0).type).toBe('terminal')
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('*');
      expect(chk(0,0,0,2,0)?.type).toBe('molecule');
      expect(chk(0,0,0,2,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test 1•1",()=>{
      const chk = makeRootCheck("1•1");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0)?.type).toBe('factor');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.type).toBe('mul');
      expect(chk(0,0,0,1,0).type).toBe('terminal')
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('•');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test 1÷1",()=>{
      const chk = makeRootCheck("1÷1");
      expect(chk(0,0,0)?.type).toBe('factor');
      expect(chk(0,0,0,0,0)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.type).toBe('div');
      expect(chk(0,0,0,1,0).type).toBe('terminal')
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('÷');
      expect(chk(0,0,0,2,0)?.type).toBe('molecule');
      expect(chk(0,0,0,2,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test 1/1",()=>{
      const chk = makeRootCheck("1/1");
      expect(chk(0,0,0)?.type).toBe('factor');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.type).toBe('div');
      expect(chk(0,0,0,1,0).type).toBe('terminal')
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('/');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test √4 ",()=>{
      const chk = makeRootCheck("√4");
      expect(chk(0).children.length).toBe(1);
      expect(chk(0,0,0,0)?.type).toBe('base');
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,0)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,1)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,1,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,1,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,1,0,0)?.tokString()).toBe('4');
    });
    it("Should test 3√9 ",()=>{
      const chk = makeRootCheck("3√9");
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('9');
    });
    it("Should fail test -1√9 ",()=>{
      expect(()=>{makeRootCheck("-1√j");}).toThrow(SyntaxError);
    });
    it("Should test 10^3 ",()=>{
      const chk = makeRootCheck("10^3");
      expect(chk(0,0,0,0,0)?.type).toBe('exponent');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('10');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('^');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('3');
    });
    it("Should test a+1 ",()=>{
      const chk = makeRootCheck("a+1");
      expect(chk(0,0)?.type).toBe('term');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('a');
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tok?.str).toBe('+');
      expect(chk(0,0,2,0,0)?.type).toBe('molecule');
      expect(chk(0,0,2,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,2,0,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test b+1",()=>{
      const chk = makeRootCheck("b+1");
      expect(chk(0,0)?.type).toBe('term');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('b');
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tok?.str).toBe('+');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,2,0,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test c-1",()=>{
      const chk = makeRootCheck("c-1");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('c');
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tok?.str).toBe('-');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,2,0,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test d*1",()=>{
      const chk = makeRootCheck("d*1");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('d');
      expect(chk(0,0,0,1)?.type).toBe('mul');
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('*');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test e•1",()=>{
      const chk = makeRootCheck("e•1");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('e');
      expect(chk(0,0,0,1)?.type).toBe('mul');
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('•');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test f÷1",()=>{
      const chk = makeRootCheck("f÷1");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('f');
      expect(chk(0,0,0,1)?.type).toBe('div');
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('÷');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test g/1",()=>{
      const chk = makeRootCheck("g/1");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('g');
      expect(chk(0,0,0,1)?.type).toBe('div');
      expect(chk(0,0,0,1,0)?.tok?.str).toBe('/');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0)?.tokString()).toBe('1');
    });
    it("Should test √h ",()=>{
      const chk = makeRootCheck("√h");
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,0)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,1)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,1,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,1,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,1,0,0)?.tokString()).toBe('h');
    });
    it("Should test 3√j ",()=>{
      const chk = makeRootCheck("3√j");
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('j');
    });
    it("Should test 3√-i ",()=>{
      const chk = makeRootCheck("3√-i");
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('signed');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('-');
      expect(chk(0,0,0,0,0,2,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,2,0,1)?.tokString()).toBe('i');
    });
    it("Should test 0.1√j ",()=>{
      const chk = makeRootCheck("0.1√j");
      expect(chk(0,0,0,0,0)?.type).toBe('root');
      expect(chk(0,0,0,0,0,0)?.type).toBe('float');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('0.1');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('√');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('j');
    });
    it("Should test k^3 ",()=>{
      const chk = makeRootCheck("k^3");
      expect(chk(0,0,0,0,0)?.type).toBe('exponent');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0)?.tokString()).toBe('k');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('^');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('3');
    });
    it("Should test 3^l ",()=>{
      const chk = makeRootCheck("3^l");
      expect(chk(0,0,0,0,0)?.type).toBe('exponent');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('^');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('l');
    });
    it("Should fail test m√9 ",()=>{
      expect(()=>{makeParser('m√9');}).toThrow(SyntaxError);
    });
    it("Should test n^m ",()=>{
      const chk = makeRootCheck("n^m");
      expect(chk(0,0,0,0,0)?.type).toBe('exponent');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,0,0,0)?.tokString()).toBe('n');
      expect(chk(0,0,0,0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,0,0,0,1)?.tok?.str).toBe('^');
      expect(chk(0,0,0,0,0,2)?.type).toBe('molecule');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('variable');
      expect(chk(0,0,0,0,0,2,0,0)?.tokString()).toBe('m');
    });
    it("Should test 1+op (implicit mul) ",()=>{
      const chk = makeRootCheck("1+op");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer')
      expect(chk(0,0,1)?.type).toBe('terminal');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2,0,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,2,0,0,0,0,0)?.type).toBe('variable');
      expect(chk(0,0,2,0,0,0,0,0,0)?.tok?.str).toBe('o');
      expect(chk(0,0,2,0,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,2,0,0,0,0,1,0)?.tok?.str).toBe('p');
    });
    it("Should test 10÷2qr (implicit mul) ",()=>{
      const chk = makeRootCheck("10÷2qr");
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('integer')
      expect(chk(0,0,0,1)?.type).toBe('div');
      expect(chk(0,0,0,1)?.tokString()).toBe('÷');
      expect(chk(0,0,0,2,0,0)?.type).toBe('unsigned');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,2,0,0,0,0)?.type).toBe('integer');
      expect(chk(0,0,0,2,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,2,0,0,0,1)?.type).toBe('variable');
      expect(chk(0,0,0,2,0,0,0,1,0)?.tok?.str).toBe('q');
      expect(chk(0,0,0,2,0,0,0,2)?.type).toBe('variable');
      expect(chk(0,0,0,2,0,0,0,2,0)?.tok?.str).toBe('r');
    });
  });

  describe("Test precedence", ()=>{
    it("Should test * before + (2+3*4)", ()=>{
      const chk = makeRootCheck('2+3*4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3*4');
    });
    it("Should test / before + (2+3/4)", ()=>{
      const chk = makeRootCheck('2+3/4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3/4');
    });
    it("Should test * before - (2-3*4)", ()=>{
      const chk = makeRootCheck('2-3*4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('3*4');
    });
    it("Should test / before - (2-3/4)", ()=>{
      const chk = makeRootCheck('2-3/4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('3/4');
    });
    it("Should test √ before * (2*3√4)", ()=>{
      const chk = makeRootCheck('2*3√4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2)?.tokString()).toBe('3√4');});
    it("Should test √ before / (2/3√4)", ()=>{
      const chk = makeRootCheck('2/3√4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2)?.tokString()).toBe('3√4');
    });
    it("Should test √ before + (2+3√4)", ()=>{
      const chk = makeRootCheck('2+3√4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3√4');
    });
    it("Should test √ before - (2-3√4)", ()=>{
      const chk = makeRootCheck('2-3√4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('3√4');
    });
    it("Should test ^ before * (2*3^4)", ()=>{
      const chk = makeRootCheck('2*3^4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2)?.tokString()).toBe('3^4');
    });
    it("Should test ^ before / (2/3^4)", ()=>{
      const chk = makeRootCheck('2/3^4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2)?.tokString()).toBe('3^4');
    });
    it("Should test ^ before + (2+3^4)", ()=>{
      const chk = makeRootCheck('2+3^4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3^4');
    });
    it("Should test ^ before - (2-3^4)", ()=>{
      const chk = makeRootCheck('2-3^4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('3^4');
    });
    it("Should test ^ before √ (2√3^4)", ()=>{
      const chk = makeRootCheck('2√3^4');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('√');
      expect(chk(0,0,0,0,0,2,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,2,1)?.tokString()).toBe('^');
      expect(chk(0,0,0,0,0,2,2)?.tokString()).toBe('4');
    });
    it("Should test ^ before √ (2^3√4)", ()=>{
      const chk = makeRootCheck('2^3√4');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('^');
      expect(chk(0,0,0,0,0,2,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,2,1)?.tokString()).toBe('√');
      expect(chk(0,0,0,0,0,2,2)?.tokString()).toBe('4');
    });
    it("Should test left to right (2*3/4)", ()=>{
      const chk = makeRootCheck('2*3/4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2)?.tokString()).toBe('3');
      expect(chk(0,0,0,3)?.tokString()).toBe('/');
      expect(chk(0,0,0,4)?.tokString()).toBe('4');
    });
    it("Should test left to right (2/3*4)", ()=>{
      const chk = makeRootCheck('2/3*4');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2)?.tokString()).toBe('3');
      expect(chk(0,0,0,3)?.tokString()).toBe('*');
      expect(chk(0,0,0,4)?.tokString()).toBe('4');
    });
    it("Should test left to right (2+3-4)", ()=>{
      const chk = makeRootCheck('2+3-4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3');
      expect(chk(0,0,3)?.tokString()).toBe('-');
      expect(chk(0,0,4)?.tokString()).toBe('4');
    });
    it("Should test left to right (2-3+4)", ()=>{
      const chk = makeRootCheck('2-3+4');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('3');
      expect(chk(0,0,3)?.tokString()).toBe('+');
      expect(chk(0,0,4)?.tokString()).toBe('4');
    });
  });

  describe("Test signed expressions", ()=>{
    it("Should test 1+-2",()=>{
      const chk = makeRootCheck('1+-2');
      expect(chk(0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,2,0,0,0)?.type).toBe('signed');
    });
    it("Should test 1--2",()=>{
      const chk = makeRootCheck('1--2');
      expect(chk(0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,2,0,0,0)?.type).toBe('signed');
    });
    it("Should test 1-+2",()=>{
      const chk = makeRootCheck('1-+2');
      expect(chk(0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2)?.tokString()).toBe('+2');
      expect(chk(0,0,2,0,0,0)?.type).toBe('signed');
    });
    it("Should test 1++2",()=>{
      const chk = makeRootCheck('1++2');
      expect(chk(0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('+2');
      expect(chk(0,0,2,0,0,0)?.type).toBe('signed');
    });
    it("Should test 1*-2",()=>{
      const chk = makeRootCheck('1*-2');
      expect(chk(0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,0,2,0,0)?.type).toBe('signed');
    });
    it("Should test 1/-2",()=>{
      const chk = makeRootCheck('1/-2');
      expect(chk(0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,0,2,0,0)?.type).toBe('signed');
    });
    it("Should test 1^-2",()=>{
      const chk = makeRootCheck('1^-2');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('^');
      expect(chk(0,0,0,0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('signed');
    });
    it("Should test 1√-2",()=>{
      const chk = makeRootCheck('1√-2');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('√');
      expect(chk(0,0,0,0,0,2)?.tokString()).toBe('-2');
      expect(chk(0,0,0,0,0,2,0)?.type).toBe('signed');
    });
  });

  describe("Test grouping higher precedence", ()=>{
    it("Should do group before other 2*(3+4)", ()=>{
      const chk = makeRootCheck('2*(3+4)');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,2,0,0,0,1,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,2,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,2,0,0,0,1,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other 2/(3-4)", ()=>{
      const chk = makeRootCheck('2/(3-4)');
      expect(chk(0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,2,0,0,0,1,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,2,0,0,0,1,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,0,2,0,0,0,1,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other 2+(3+4)", ()=>{
      const chk = makeRootCheck('2+(3+4)');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,2,0,0,0,0,1,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,2,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2,0,0,0,0,1,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other 2-(3+4)", ()=>{
      const chk = makeRootCheck('2-(3+4)');
      expect(chk(0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,2,0,0,0,0,1,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,2,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2,0,0,0,0,1,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other 2^(3*4)", ()=>{
      const chk = makeRootCheck('2^(3*4)');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('^');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other 2√(3/4)", ()=>{
      const chk = makeRootCheck('2√(3/4)');
      expect(chk(0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,1)?.tokString()).toBe('√');
      expect(chk(0,0,0,0,0,2,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,0,0,2,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should test implict mul 2(3+4)", ()=>{
      const chk = makeRootCheck('2(3+4)');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,0,0,0,0,0,0,0,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,0,0,1,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,1,1,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other (1+2)(3*4)", ()=>{
      const chk = makeRootCheck('(1+2)(3*4)');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul')
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,0,1,0,2)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should combine (1+2)(3*4)(5/6)(7-8)", ()=>{
      const chk = makeRootCheck('(1+2)(3*4)(5/6)(7-8)');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('implmul')
      expect(chk(0,0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,0,1,0,2)?.tokString()).toBe('2');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,0,0,0,0,1,1,0,0,2)?.tokString()).toBe('4');
      expect(chk(0,0,0,0,0,0,0,1)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,2,1,0,0,0)?.tokString()).toBe('5');
      expect(chk(0,0,0,0,0,0,0,2,1,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,0,0,0,0,2,1,0,0,2)?.tokString()).toBe('6');
      expect(chk(0,0,0,0,0,0,0,3)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,3,1,0,0)?.tokString()).toBe('7');
      expect(chk(0,0,0,0,0,0,0,3,1,0,1)?.tokString()).toBe('-');
      expect(chk(0,0,0,0,0,0,0,3,1,0,2)?.tokString()).toBe('8');
    });
    it("Should do group before other (1+2)*(3*4)", ()=>{
      const chk = makeRootCheck('(1+2)*(3*4)');
      expect(chk(0)?.type).toBe('expression')
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,1,0,2,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.type).toBe('mul')
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,2,0,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,2,0,0,0,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2,0,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other (1+2)/(3*4)", ()=>{
      const chk = makeRootCheck('(1+2)/(3*4)');
      expect(chk(0)?.type).toBe('expression')
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,1,0,2,0)?.tokString()).toBe('2');
      expect(chk(0,0,0,1)?.type).toBe('div')
      expect(chk(0,0,0,2,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,2,0,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,0,2,0,0,0,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,0,2,0,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other (1+2)+(3*4)", ()=>{
      const chk = makeRootCheck('(1+2)+(3*4)');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,1,0,2,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tok?.str).toBe('+')
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,2,0,0,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,2,0,0,0,0,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,2,0,0,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
    it("Should do group before other (1+2)-(3*4)", ()=>{
      const chk = makeRootCheck('(1+2)-(3*4)');
      expect(chk(0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,0,0,0,0,0,1,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,0,0,0,0,1,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,0,0,0,0,0,1,0,2,0)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tok?.str).toBe('-')
      expect(chk(0,0,2,0,0,0,0)?.type).toBe('group');
      expect(chk(0,0,2,0,0,0,0,1,0,0,0)?.tokString()).toBe('3');
      expect(chk(0,0,2,0,0,0,0,1,0,0,1)?.tokString()).toBe('*');
      expect(chk(0,0,2,0,0,0,0,1,0,0,2)?.tokString()).toBe('4');
    });
  });
});

registerTestSuite("test Math complex expressions", ()=>{
  describe("Test chained expressions", ()=>{
    it("Should test expr 1+2+3*4/5",()=>{
      const chk = makeRootCheck('1+2+3*4/5');
      expect(chk(0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('2');
      expect(chk(0,0,3)?.tokString()).toBe('+');
      expect(chk(0,0,4,0)?.tokString()).toBe('3');
      expect(chk(0,0,4,1)?.tokString()).toBe('*');
      expect(chk(0,0,4,2)?.tokString()).toBe('4');
      expect(chk(0,0,4,3)?.tokString()).toBe('/');
      expect(chk(0,0,4,4)?.tokString()).toBe('5');
    });
    it("Should test expr 1/2+3-4*5",()=>{
      const chk = makeRootCheck('1/2+3-4*5');
      expect(chk(0,0,0,0)?.tokString()).toBe('1');
      expect(chk(0,0,0,1)?.tokString()).toBe('/');
      expect(chk(0,0,0,2)?.tokString()).toBe('2');
      expect(chk(0,0,1)?.tokString()).toBe('+');
      expect(chk(0,0,2)?.tokString()).toBe('3');
      expect(chk(0,0,3)?.tokString()).toBe('-');
      expect(chk(0,0,4,0)?.tokString()).toBe('4');
      expect(chk(0,0,4,1)?.tokString()).toBe('*');
      expect(chk(0,0,4,2)?.tokString()).toBe('5');
    });
    it("Should test expr I^2*R=P",()=>{
      const chk = makeRootCheck('I^2*R=P');
      expect(chk(0)?.type).toBe('equation');
      expect(chk(0,0)?.type).toBe('expression');
      expect(chk(0,0)?.tokString()).toBe('I^2*R');
      expect(chk(0,1)?.tokString()).toBe('=');
      expect(chk(0,2)?.type).toBe('expression');
      expect(chk(0,2)?.tokString()).toBe('P');
    });
    it("Should test expr U=(P/I^2)R",()=>{
      const chk = makeRootCheck('U=(P/I^2)R');
      expect(chk(0)?.type).toBe('equation');
      expect(chk(0,0)?.type).toBe('expression');
      expect(chk(0,0)?.tokString()).toBe('U');
      expect(chk(0,1)?.tokString()).toBe('=');
      expect(chk(0,2)?.type).toBe('expression');
      expect(chk(0,2)?.tokString()).toBe('(P/I^2)R');
      expect(chk(0,2,0,0,0,0,0,0)?.type).toBe('implmul');
      expect(chk(0,2,0,0,0,0,0,0,0)?.type).toBe('group');
      expect(chk(0,2,0,0,0,0,0,0,0,1)?.tokString()).toBe('P/I^2');
      expect(chk(0,2,0,0,0,0,0,0,1)?.tokString()).toBe('R');
    });
  });
});

registerTestSuite("test parsing equation systems", ()=>{
  describe("Test that parser handles equation systems", ()=>{
    it("Should have 2 equations", ()=>{
      const chk = makeRootCheck('{@10+x-4y=4\n@40--8y+x=2');
      expect(chk(0)?.type).toBe('equationSystem');
      expect(chk(0,0)?.tokString()).toBe('{');
      expect(chk(0,1)?.tokString()).toBe('@');
      expect(chk(0,2)?.type).toBe('equation');
      expect(chk(0,2,0)?.type).toBe('expression');
      expect(chk(0,2,0)?.tokString()).toBe('10+x-4y');
      expect(chk(0,2,1)?.type).toBe('eq');
      expect(chk(0,2,1)?.tokString()).toBe('=');
      expect(chk(0,2,2)?.type).toBe('expression');
      expect(chk(0,2,2)?.tokString()).toBe('4');
      expect(chk(0,3)?.tokString()).toBe('@');
      expect(chk(0,4)?.type).toBe('equation');
      expect(chk(0,4,0)?.tokString()).toBe('40--8y+x');
      expect(chk(0,4,1)?.tokString()).toBe('=');
      expect(chk(0,4,2)?.tokString()).toBe('2');
    });
    it("Should have 3 equations", ()=>{
      const chk = makeRootCheck('{@4y*20=4x@5x+20=-2y@20-47y=58+6x');
      expect(chk(0)?.type).toBe('equationSystem');
      expect(chk(0,2)?.type).toBe('equation');
      expect(chk(0,2)?.tokString()).toBe('4y*20=4x');
      expect(chk(0,4)?.type).toBe('equation');
      expect(chk(0,4)?.tokString()).toBe('5x+20=-2y');
      expect(chk(0,6)?.type).toBe('equation');
      expect(chk(0,6)?.tokString()).toBe('20-47y=58+6x');
    });
    it("Should fail {@4y*20=4x@5x+20-2y", ()=>{
      expect(()=>{makeParser('{@4y*20=4x@5x+20-2y')}).toThrow(SyntaxError);
    });
    it("Should fail {@4y*20=4x", ()=>{
      expect(()=>{makeParser('{@4y*20=4x')}).toThrow(SyntaxError);
    });
  });
});

registerTestSuite("stress Math expression parser", ()=>{
  describe("Used during babysteps for grammar development", ()=>{
    it("Should test various expressions", ()=>{
      expect(()=>{makeParser("1(23)-34*5/89(45)^4");}).toNotThrow();
      expect(()=>{makeParser("1(23)(256+65+588*55^8)*(45)^4");}).toNotThrow();
      expect(()=>{makeParser("√5+89*3√a+√(58*89+6)");}).toNotThrow();
      expect(()=>{makeParser("1^(23)-34*5/89(45)^4");}).toNotThrow();
      expect(()=>{makeParser("2ab+345cd*56^(54+65)");}).toNotThrow();
      expect(()=>{makeParser("1<2<3<5!=5+658*96>56>=56≠fgd");}).toNotThrow();
      expect(()=>{makeParser("P=I^2*R");}).toNotThrow();
      expect(()=>{makeParser("568=564+4=254+194");}).toThrow();
      expect(()=>{makeParser("512*568/86<5698=56");}).toThrow();
      expect(()=>{makeParser("{@568=564x+4@56*254=194x");}).toNotThrow();
      expect(()=>{makeParser("{@512x*568/86=678@5698=56x+98@56=5x+9");}).toNotThrow();
      expect(()=>{makeParser("(a + b)^2 = a^2 + 2ab + b^2");}).toNotThrow();
      expect(()=>{makeParser("(a + b)(a - b) = a^2 - b^2");}).toNotThrow();
      expect(()=>{makeParser("(a + b + c)^2 = a^2 + b^2 + c^2 + 2ab + 2bc + 2ca");}).toNotThrow();
      expect(()=>{makeParser("(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3");}).toNotThrow();
      expect(()=>{makeParser("(3x^2-2xy+c)/(y^3-1)");}).toNotThrow();
      expect(()=>{makeParser("1+2a-a2/5*6-10000+0,56^a");}).toNotThrow();
      expect(()=>{makeParser("54*89^69√5");}).toNotThrow();
      expect(()=>{makeParser("1/((1/2)+(1/4)+(1/6))")}).toNotThrow();
      expect(()=>{makeParser("((3*5)/(3+5))")});
    });
  });
});

registerTestSuite("test Math expression engine", ()=>{
  describe("Test with integers only", ()=>{
    it("Should eval 1+2 to 3",()=>{
      const math = new MathEngine("1+2");
      expect(math.evaluate()).toBe(3);
    });
    it("Should eval 1-2 to -1",()=>{
      const math = new MathEngine("1-2");
      expect(math.evaluate()).toBe(-1);
    });
    it("should eval -4 to -4", ()=>{
      const math = new MathEngine("-4");
      expect(math.evaluate()).toBe(-4);
    });
    it("Should eval -4-5", ()=>{
      const math = new MathEngine("-4-5");
      expect(math.evaluate()).toBe(-9);
    });
    it("Should eval 2*3 to 6",()=>{
      const math = new MathEngine("2*3");
      expect(math.evaluate()).toBe(6);
    });
    it("Should eval 1/2 to 1.5",()=>{
      const math = new MathEngine("1/2");
      expect(math.evaluate()).toBe(0.5);
    });
    it("Should eval 2^3 to 8",()=>{
      const math = new MathEngine("2^3");
      expect(math.evaluate()).toBe(8);
    });
    it("Should eval √4",()=>{
      const math = new MathEngine("√4");
      expect(math.evaluate()).toBe(2);
    });
    it("Should eval 3√27",()=>{
      const math = new MathEngine("3√27");
      expect(math.evaluate()).toBe(3);
    });
    it("Should eval 1+2*3 to 7",()=>{
      const math = new MathEngine("1+2*3");
      expect(math.evaluate()).toBe(7);
    });
    it("Should eval 1-4/2 to -1",()=>{
      const math = new MathEngine("1-4/2");
      expect(math.evaluate()).toBe(-1);
    });
    it("Should eval 10^3 to 1000",()=>{
      const math = new MathEngine("10^3");
      expect(math.evaluate()).toBe(1000);
    });
    it("Should eval √25 to 5",()=>{
      const math = new MathEngine("√25");
      expect(math.evaluate()).toBe(5);
    });
    it("Should eval 3√27 to 3",()=>{
      const math = new MathEngine("3√27");
      expect(math.evaluate()).toBe(3);
    });
    it("Should eval (1-4)/2 to -1.5",()=>{
      const math = new MathEngine("(1-4)/2");
      expect(math.evaluate()).toBe(-1.5);
    });
    it("Should eval (5+5*3)(8-2) to 120",()=>{
      const math = new MathEngine("(5+5*3)(8-2)");
      expect(math.evaluate()).toBe(120);
    });
    it("Should eval (5*5)*(9/3) to 75",()=>{
      const math = new MathEngine("(5*5)*(9/3)");
      expect(math.evaluate()).toBe(75);
    });
    it("Should eval uneven number of terms 1+2-4 to -1", ()=>{
      const math = new MathEngine('1+2-4');
      expect(math.evaluate()).toBe(-1);
    });
    it("Should eval uneven number of factors 1*2/4 to 0.5", ()=>{
      const math = new MathEngine('1*2/4');
      expect(math.evaluate()).toBe(0.5);
    });
    it("Should eval uneven number of exponents 2^3^2 to ", ()=>{
      const math = new MathEngine('2^3^2');
      expect(math.evaluate()).toBe(512);
    });
  });

  describe("Test with floats only", ()=>{
    it("Should eval 0.1+2.9 to 3",()=>{
      const math = new MathEngine("0.1+2.9");
      expect(math.evaluate()).toBe(3);
    });
    it("Should eval 1.1-2.1. to -1",()=>{
      const math = new MathEngine("1.1-2.1");
      expect(math.evaluate()).toBe(-1);
    });
    it("Should eval 2.5*3.5 to 8.75",()=>{
      const math = new MathEngine("2.5*3.5");
      expect(math.evaluate()).toBe(8.75);
    });
    it("Should eval 1.5/2.5 to 1.5",()=>{
      const math = new MathEngine("1,5/2,5");
      expect(math.evaluate()).toBe(0.6);
    });
    it("Should eval 0.2^3.3 to 0,004936271",()=>{
      const math = new MathEngine("0,2^3.3");
      expect(math.evaluate()).toBe(0.004936271, 10);
    });
    it("Should eval √4.5",()=>{
      const math = new MathEngine("√4,5");
      expect(math.evaluate()).toBe(2.121320344, 10);
    });
    it("Should eval 3√59.4",()=>{
      const math = new MathEngine("3√59.4");
      expect(math.evaluate()).toBe(3.901774341,10);
    });
    it("Should eval 10,2+2.5*3,8 to 19,7",()=>{
      const math = new MathEngine("10.2+2.5*3.8");
      expect(math.evaluate()).toBe(19.7);
    });
    it("Should eval 1.1-4.4/2.1 to -0,995238095",()=>{
      const math = new MathEngine("1-4/2");
      expect(math.evaluate()).toBe(-0.995238095,10);
    });
    it("Should eval 10.8^3.6 to 1000",()=>{
      const math = new MathEngine("10.8^3.6");
      expect(math.evaluate()).toBe(5252.009702795,10);
    });
    it("Should eval √6.25",()=>{
      const math = new MathEngine("√6.25");
      expect(math.evaluate()).toBe(2.5);
    });
    it("Should eval 7.8√65",()=>{
      const math = new MathEngine("7.8√65");
      expect(math.evaluate()).toBe(1.707751948, 10);
    });
    it("Should eval (1.2-4.2)/2.4",()=>{
      const math = new MathEngine("(1.2-4.2)/2.4");
      expect(math.evaluate()).toBe(-1.25);
    });
    it("Should eval (5.3+5.4*3.9)(8.1-2.7)",()=>{
      const math = new MathEngine("(5.3+5.4*3.9)(8.1-2.7)");
      expect(math.evaluate()).toBe(142.344);
    });
    it("Should eval (5.4*5.6)*(9.7/3.2)",()=>{
      const math = new MathEngine("(5.4*5.6)*(9.7/3.2)");
      expect(math.evaluate()).toBe(91.665, 10);
    });
  });

  describe("Test floating point rounding errors IEEE754", ()=>{
    it("Should report 0.3", ()=>{
      const math = new MathEngine("0.1+0.2");
      expect(math.evaluate()).toBe(0.3);
    });
    it("Should report 0.6", ()=>{
      const math = new MathEngine("0.4+0.2");
      expect(math.evaluate()).toBe(0.6);
    });
    it("Should report 0.", ()=>{
      const math = new MathEngine("0.1+0.2");
      expect(math.evaluate()).toBe(0.3);
    });
    it("Should report 0.79", ()=>{
      const math = new MathEngine("0.09+0.7");
      expect(math.evaluate()).toBe(0.79);
    });
    it("Should report -0.2", ()=>{
      const math = new MathEngine("0.1-0.3");
      expect(math.evaluate()).toBe(-0.2);
    });
    it("Should report 0.072", ()=>{
      const math = new MathEngine("0.9*0.8");
      expect(math.evaluate()).toBe(0.72);
    });
  });

  describe("Test with variables", ()=>{});
});