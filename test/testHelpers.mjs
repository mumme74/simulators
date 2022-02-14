"use strict";

import { observeObject } from "../helpers/index.mjs";

registerTestSuite("test_observeObject", ()=>{
  let setCalled = 0, delCalled = 0,
      delTrgt = null, delProp = null,
      setTrgt = null, setProp = null, setVlu = null, setRecv = null;
  const deleteCb = (trgt, prop)=>{
    delCalled++
    delTrgt = trgt; delProp = prop;
  }
  const setCb = (trgt, prop, vlu, recv)=>{
    setCalled++
    setTrgt = trgt; setProp = prop; setVlu = vlu; setRecv = recv;
  }

  afterEach(()=>{
    delCalled = 0;
    setCalled = 0;
    delTrgt = delProp = null;
    setTrgt = setProp = setVlu = setRecv = null;
  });



  describe("test array", ()=>{
    const createArray = ()=>{
      const arr = [];
      const oArr = observeObject(deleteCb, setCb, arr);
      return {arr, oArr};
    }

    it("Should wrap array, array instanceof Array == true", ()=>{
      const {arr, oArr} = createArray();
      expect(Array.isArray(oArr)).toBe(true);
      oArr.push(1);
      expect(setCalled).toBe(1);
      expect(setTrgt).toBe(arr);
      expect(setProp).toBe('0');
      expect(setVlu).toBe(1);
      expect(setRecv).toBe(oArr);
      expect(arr).toBeObj([1]);
    });
    it("Should see array update value", ()=>{
      const {arr, oArr} = createArray();
      oArr.push(1);
      oArr[0] = 2;
      expect(setCalled).toBe(2);
      expect(setTrgt).toBe(arr);
      expect(setProp).toBe('0');
      expect(setVlu).toBe(2);
      expect(setRecv).toBe(oArr);
      expect(arr).toBeObj([2]);
    });
    it("Should see array splice insert", ()=>{
      const {arr, oArr} = createArray();
      oArr.push(1);
      oArr.splice(0,0,1,2,3,4);
      expect(setCalled).toBe(6); // one extra for moving pos 0 to pos 4
      expect(setTrgt).toBe(arr);
      expect(setProp).toBe('3');
      expect(setVlu).toBe(4);
      expect(setRecv).toBe(oArr);
      expect(arr).toBeObj([1,2,3,4,1])
    });
    it("Should see unshift", ()=>{
      const {arr, oArr} = createArray();
      oArr.push(1);
      oArr.unshift(0);
      expect(setCalled).toBe(3); // one extra to rearrange to array
      expect(setProp).toBe('0');
      expect(setVlu).toBe(0);
      expect(arr).toBeObj([0,1]);
    });
    it("Should abort set when returning false", ()=>{
      const arr = [];
      const oArr = observeObject(deleteCb, ()=>{return false;}, arr);
      try {
        oArr.push(1);
      } catch(e){ /* squelsh */}
      expect(arr.length).toBe(0);
    });
    it("Should abort delete when returning false", ()=>{
      const arr = [];
      const oArr = observeObject(()=>{return false;}, setCb, arr);
      oArr.push(1);
      try {
        oArr.pop()
      } catch(e){ /* squelsh */}
      expect(arr.length).toBe(1);
    });
    it("Should see array pop", ()=>{
      const {arr, oArr} = createArray();
      oArr.push(1);
      oArr.pop();
      expect(delCalled).toBe(1);
      expect(delTrgt).toBe(arr);
      expect(delProp).toBe('0');
      expect(arr.length).toBe(0);
    });
    it("Should see array splice",()=>{
      const {arr, oArr} = createArray();
      oArr.splice(0,0,1,2,3,4);
      expect(delCalled).toBe(0);
      oArr.splice(1,2);
      expect(delCalled).toBe(2);
      expect(delTrgt).toBe(arr);
      expect(delProp).toBe('2');
      expect(arr).toBeObj([1,4]);
    });
    it("Should see array shift", ()=>{
      const {arr, oArr} = createArray();
      oArr.push(1);
      oArr.shift();
      expect(delCalled).toBe(1);
      expect(delTrgt).toBe(arr);
      expect(delProp).toBe('0');
      expect(arr.length).toBe(0);
    });
  });
  describe("test object", ()=>{
    const createObject = ()=>{
      const obj = {};
      const oObj = observeObject(deleteCb, setCb, obj);
      return {obj, oObj};
    }
    it("Should see object set prop", ()=>{
      const {obj, oObj} = createObject();
      oObj.test = 1;
      expect(setCalled).toBe(1);
      expect(setTrgt).toBe(obj);
      expect(setProp).toBe('test');
      expect(setVlu).toBe(1);
      expect(setRecv).toBe(oObj);
      expect(obj).toBeObj({test:1});
    });
    it("Should see object update item", ()=>{
      const {obj, oObj} = createObject();
      oObj.test = 1;
      oObj['test'] = 2;
      expect(setCalled).toBe(2);
      expect(setTrgt).toBe(obj);
      expect(setProp).toBe('test');
      expect(setVlu).toBe(2);
      expect(setRecv).toBe(oObj);
      expect(obj).toBeObj({test:2});
    });
    it("Should see object set undefined", ()=>{
      const {obj, oObj} = createObject();
      oObj.test = 1;
      oObj.test = undefined;
      expect(setCalled).toBe(2);
      expect(setTrgt).toBe(obj);
      expect(setProp).toBe('test');
      expect(setVlu).toBe(undefined)
      expect(setRecv).toBe(oObj);
      expect(obj).toBeObj({test:undefined});
    });
    it("Should see object delete item", ()=>{
      const {obj, oObj} = createObject();
      oObj.test = 1;
      expect('test' in obj).toBe(true);
      delete oObj.test;
      expect(delCalled).toBe(1);
      expect(delTrgt).toBe(obj);
      expect(delProp).toBe('test');
      expect('test' in obj).toBe(false);
    });
  });
});
