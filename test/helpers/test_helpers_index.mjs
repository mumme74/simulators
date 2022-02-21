"use strict";

import { observeObject, StateFromHash, toFraction } from "../../helpers/index.mjs";

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

registerTestSuite("test_toFraction", ()=>{
  describe("Test below default", ()=>{
    it("Should return 1/2", ()=>{
      const res = toFraction({vlu:0.5});
      expect(res.int).toBe(0);
      expect(res.num).toBe(1);
      expect(res.den).toBe(2);
    });
    it("Should return 1/3", ()=>{
      const res = toFraction({vlu:0.3333333});
      expect(res.int).toBe(0);
      expect(res.num).toBe(1);
      expect(res.den).toBe(3);
    });
    it("Should return 1 1/4", ()=>{
      const res = toFraction({vlu:1.25});
      expect(res.int).toBe(1);
      expect(res.num).toBe(1);
      expect(res.den).toBe(4);
    });
    it("Should return -1/2", ()=>{
      const res = toFraction({vlu:-0.5});
      expect(res.int).toBe(0);
      expect(res.num).toBe(-1);
      expect(res.den).toBe(2);
    });
    it("Should return 1/1000", ()=>{
      const res = toFraction({vlu:0.001});
      expect(res.int).toBe(0);
      expect(res.num).toBe(1);
      expect(res.den).toBe(1000);
    });
  });
  describe("Test tolerance", ()=>{
    it("Should return 1/20", ()=>{
      const res = toFraction({vlu:0.04, tolerance:0.05});
      expect(res.int).toBe(0);
      expect(res.num).toBe(1);
      expect(res.den).toEqualOrGt(20);
    });
    it("Should return 1/10", ()=>{
      const res = toFraction({vlu:0.09, tolerance:0.1});
      expect(res.int).toBe(0);
      expect(res.num).toBe(1);
      expect(res.den).toEqualOrGt(10);
    });
  });
  describe("Test useInt", ()=>{
    it("Should return 2/1", ()=>{
      const res = toFraction({vlu:2, useInt:false});
      expect(res.int).toBe(undefined);
      expect(res.num).toBe(2);
      expect(res.den).toBe(1);
    });
    it("Should return 3/2", ()=>{
      const res = toFraction({vlu:1.5, useInt:false});
      expect(res.int).toBe(undefined);
      expect(res.num).toBe(3);
      expect(res.den).toBe(2);
    });
    it("Should return 9/4", ()=>{
      const res = toFraction({vlu:2.25, useInt:false});
      expect(res.int).toBe(undefined);
      expect(res.num).toBe(9);
      expect(res.den).toBe(4);
    });
  });
});

registerTestSuite("testStateFromHash", ()=>{
  afterEach(()=>{
    location.hash = "";
  });

  describe("Test constructor", ()=>{
    it("Should construct with empty obj", ()=>{
      const stateObj = new StateFromHash();
      expect(Object.keys(stateObj.ref).length).toBe(0);
      expect(location.hash).toBe("");
    });
    it("Should construct with obj", ()=>{
      const state = {test:1,two:"test"};
      const stateObj = new StateFromHash(state);
      expect(stateObj.ref).toBeObj({test:1,two:"test"});
      expect(location.hash).toBe("#test=1&two=test");
    });
  });

  describe("Test ref property", ()=>{
    it("Should update using ref to object", ()=>{
      const state = {test:1,two:"test"};
      const stateObj = new StateFromHash(state);
      expect(stateObj.ref).toBeObj({test:1,two:"test"});
      expect(location.hash).toBe("#test=1&two=test");
      const stateRef = stateObj.ref;
      stateRef.test = 2;
      expect(stateObj.ref).toBeObj({test:2,two:"test"});
      expect(location.hash).toBe("#test=2&two=test");
      stateRef.three = 3;
      expect(stateObj.ref).toBeObj({test:2,two:"test",three:3});
      expect(location.hash).toBe("#test=2&two=test&three=3");
    });
    it("Should URIENcode", ()=>{
      const state = new StateFromHash();
      state.ref.test = "öäå&=";
      expect(state.ref.test).toBe("öäå&=");
      expect(location.hash).toBe("#test=%C3%B6%C3%A4%C3%A5%26%3D");
      const state2 = new StateFromHash();
      expect(state2.ref.test).toBe("öäå&=");
    });
    it("Should restore to number", ()=>{
      location.hash = "#test=10";
      const state = new StateFromHash();
      expect(state.ref.test).toBe(10);
    })
  });

  describe("get/set function", ()=>{
    it("Should get property", ()=>{
      const initial = {test:1,two:2};
      const state = new StateFromHash(initial);
      expect(state.get("test")).toBe(1);
      expect(state.get("two")).toBe(2);
    });
    it("Should set property", ()=>{
      const initial = {test:1, two:0};
      const state = new StateFromHash(initial);
      state.set("test",3);
      expect(state.ref.test).toBe(3);
      expect(initial.test).toBe(3);
    })
  })
})