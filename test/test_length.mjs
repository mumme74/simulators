"use strict";

import { Length } from "../elements/length.mjs";
import { Point } from "../elements/point.mjs";
import { BaseShape } from "../elements/base.mjs";

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg")
};

registerTestSuite("testLength", ()=>{
  afterEach(()=>{
    if (glbl.polygon) {
      glbl.parentElement.removeChild(glbl.polygon.node);
      glbl.shape = null;
    }
  });

  const createShape = (points = [{x:1,y:2}, {x:10,y:20}], className)=>{
    const shp = document.createElementNS('http://www.w3.org/2000/svg', "line");
    const lens = glbl.lengths = [shp.x1,shp.y1,shp.x2,shp.y2];
    for(let i = 0; i < lens.length; ++i) {
      const prop = i % 2 == 0 ? 'x' : 'y'
      lens[i].baseVal.value = points[Math.floor(i/2)][prop];
    }
    glbl.point = new Point({svgLenXRef: shp.x1.baseVal, svgLenYRef: shp.y1.baseVal});
    const pts = [glbl.point, new Point({svgLenYRef:shp.y2.baseVal, svgLenXRef: shp.x2.baseVal})];
    glbl.shape = new BaseShape({
      parentElement: glbl.parentElement, rootElement: shp,
      points: pts,
      className
    });
    return [pts[0]._x, pts[0]._y, pts[1]._x, pts[1]._y];
  };


  describe("Test Length constructor", ()=>{
    it("Should construct a length with zero as default", ()=>{
      const len = new Length({});
      expect(len.length).toBe(0);
    });
    it("Should constructconstruct a point len 10", ()=>{
      const len = new Length({length:10});
      expect(len.length).toBe(10);
    });
  });

  describe("Test Length change", ()=>{
    it("Should change len", ()=>{
      const len = new Length({length:10});
      expect(len.length).toBe(10);
      len.length = 20;
      expect(len.length).toBe(20);
    });
    it("Should change len and change in svg", ()=>{
      const lens = createShape([{x:2,y:4}, {x:11,y:22}]);
      expect(glbl.shape.points[0]).toBeObj({x:2,y:4});
      expect(glbl.shape.points[1]).toBeObj({x:11,y:22});
      lens[0].length = 3;
      expect(glbl.shape.points[0]).toBeObj({x:3,y:4});
      lens[1].length = 5;
      expect(glbl.shape.points[0]).toBeObj({x:3,y:5});
      lens[2].length = 12;
      expect(glbl.shape.points[1]).toBeObj({x:12,y:22});
      lens[3].length = 23;
      expect(glbl.shape.points[1]).toBeObj({x:12,y:23});
    });
    it("Should call onChangeCallback", ()=>{
      let called = false, lenCb;
      function cb(l) { called = true; lenCb = l}
      const len = new Length({length:10, onChangeCallback:cb});
      expect(len.length).toBe(10);
      expect(called).toBe(false);
      expect(lenCb).toBe(undefined);
      len.length = 20;
      expect(len.length).toBe(20);
      expect(called).toBe(true);
      expect(lenCb).toBe(len);
    })
  });

  describe("Test Length follow", ()=>{
    it("Should follow other length from constructor", ()=>{
      const len1 = new Length({length: 1}),
            len2 = new Length({length:3, followLength:len1});
      expect(len1.length).toBe(1);
      expect(len2.length).toBe(1);
      len1.length = 2;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(2);
      len2.length = 3;
      expect(len1.length).toBe(3);
      expect(len2.length).toBe(3);
    });
    it("Should follow other length fromFollowLength", ()=>{
      const len1 = new Length({length: 1}),
            len2 = new Length({length:3});
      expect(len1.length).toBe(1);
      expect(len2.length).toBe(3);
      len2.followLength(len1);
      expect(len2.length).toBe(1);
      len1.length = 2;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(2);
      len2.length = 3;
      expect(len1.length).toBe(3);
      expect(len2.length).toBe(3);
    });
    it("Should change length in svg", ()=>{
      const lens = createShape([{x:2,y:4}, {x:11,y:22}]);
      expect(glbl.shape.points[0]).toBeObj({x:2,y:4});
      expect(glbl.shape.points[1]).toBeObj({x:11,y:22});
      expect(glbl.shape.node.x1.baseVal.value).toBe(2);
      expect(glbl.shape.node.y1.baseVal.value).toBe(4);
      expect(glbl.shape.node.x2.baseVal.value).toBe(11);
      expect(glbl.shape.node.y2.baseVal.value).toBe(22);
      lens[0].length = 3;
      expect(glbl.shape.node.x1.baseVal.value).toBe(3);
      expect(glbl.shape.node.y1.baseVal.value).toBe(4);
      lens[1].length = 5;
      expect(glbl.shape.node.x1.baseVal.value).toBe(3);
      expect(glbl.shape.node.y1.baseVal.value).toBe(5);
      lens[2].length = 12;
      expect(glbl.shape.node.x2.baseVal.value).toBe(12);
      lens[3].length = 23;
      expect(glbl.shape.node.y2.baseVal.value).toBe(23);
    });
    it("Should detach from other length", ()=>{
      const len1 = new Length({length: 1}),
            len2 = new Length({length:3, followLength:len1});
      expect(len1.length).toBe(1);
      expect(len2.length).toBe(1);
      len1.length = 2;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(2);
      len2.followLength(null);
      len2.length = 3;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(3);
      len1.length = 4;
      expect(len1.length).toBe(4);
      expect(len2.length).toBe(3);
    });
    it("Should clear old length when supplying a new", ()=>{
      const len1 = new Length({length:1}),
            len2 = new Length({length:3, followLength:len1}),
            len3 = new Length({length:4});
      expect(len1.length).toBe(1);
      expect(len2.length).toBe(1);
      expect(len3.length).toBe(4);
      len1.length = 2;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(2);
      expect(len3.length).toBe(4);
      len2.followLength(len3);
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(4);
      expect(len3.length).toBe(4);
      len2.length = 3;
      expect(len1.length).toBe(2);
      expect(len2.length).toBe(3);
      expect(len3.length).toBe(3);
      len1.length = 4;
      expect(len1.length).toBe(4);
      expect(len2.length).toBe(3);
      expect(len3.length).toBe(3);
    });
  });
});
