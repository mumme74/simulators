"use strict";

import {
  typeCheck, isString, isDate,
  isNumber, isBigInt, isSymbol,
  isBoolean, isNull, isFunction
} from "../../helpers/types.mjs";


registerTestSuite("test_typeCheck", ()=>{
  describe("typeCheck", ()=>{
    it("test types", ()=>{
      expect(typeCheck(null)).toBe('null');
      expect(typeCheck("")).toBe('string');
      expect(typeCheck(0)).toBe('number');
      expect(typeCheck(new Date())).toBe('date');
      expect(typeCheck(12n)).toBe('bigint');
      expect(typeCheck(Symbol('test'))).toBe('symbol');
      expect(typeCheck({})).toBe('object');
      expect(typeCheck(function(){})).toBe('function');
      expect(typeCheck([])).toBe('array');
      expect(typeCheck(true)).toBe('boolean');
      expect(typeCheck(undefined)).toBe('undefined');
    });
  })
});

registerTestSuite("test isX.. functions", ()=>{
  describe("test the type is x.. functions", ()=>{
    it("should test isString", ()=>{
      expect(isString("")).toBe(true);
      expect(isString(Symbol("help"))).toBe(false);
    });
    it("should test isDate", ()=>{
      expect(isDate("2022-09-03")).toBe(false);
      expect(isDate(new Date("2022-09-03"))).toBe(true);
    });
    it("should test isNumber", ()=>{
      expect(isNumber("09")).toBe(false);
      expect(isNumber(9)).toBe(true);
      expect(isNumber(true)).toBe(false);
    });
    it("should test isBigInt", ()=>{
      expect(isBigInt(12)).toBe(false);
      expect(isBigInt(12n)).toBe(true);
      expect(isBigInt(true)).toBe(false);
      expect(isBigInt({})).toBe(false);
    });
    it("should test isSymbol", ()=>{
      expect(isSymbol("sym")).toBe(false);
      expect(isSymbol(Symbol("sym"))).toBe(true);
    });
    it("should test isBoolean", ()=>{
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(1==0)).toBe(true);
      expect(isBoolean(1)).toBe(false);
    });
    it("should test isNull", ()=>{
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      expect(isNull(false)).toBe(false);
    });
    it("should test isFunction", ()=>{
      expect(isFunction(()=>{})).toBe(true);
      expect(isFunction(new Function())).toBe(true);
      expect(isFunction(function(){})).toBe(true);
    });
  })
})
