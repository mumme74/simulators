"use strict";

import { Point } from "../elements/point.mjs";
import { Polygon } from "../elements/base.mjs";

const glbl = {
  polygon: null,
  parentElement: document.querySelector("svg")
};

registerTestSuite("testPoint", ()=>{
  afterEach(()=>{
    if (glbl.polygon) {
      glbl.parentElement.removeChild(glbl.polygon.node);
      glbl.polygon = null;
    }
  });

  describe("Test point contruction", ()=>{
    it("Should construct a point with zero as default empty object", () =>{
      const pt = new Point({});
      expect(pt).toBeObj({x:0,y:0});
    });

    it("should construct a point with zero as default on y", ()=>{
      const pt = new Point({x:2});
      expect(pt.x).toEqual(2);
      expect(pt.y).toEqual(0);
    });

    it("Should construct a point with zero as default on x", ()=>{
      const pt = new Point({y:2});
      expect(pt.x).toEqual(0);
      expect(pt.y).toEqual(2);
    });

    it("Should construct a point with x=2 y=4", ()=>{
      const pt = new Point({y:4, x:2});
      expect(pt).toBeObj({x:2,y:4});
    });
  });

  describe("Test Point move", ()=>{
    it("Should move point x", ()=>{
      const pt = new Point({x:2,y:4});
      expect(pt).toBeObj({x:2,y:4});
      pt.x = 3;
      expect(pt.x).toEqual(3);
    });
    it("Should move point y", ()=>{
      const pt = new Point({x:2,y:4});
      expect(pt).toBeObj({x:2,y:4});
      pt.y += 1;
      expect(pt.y).toEqual(5);
    });
    it("Should move both x and y {}", ()=>{
      const pt = new Point({x:2,y:4});
      expect(pt).toBeObj({x:2,y:4});
      pt.point = {x:3, y:5};
      expect(pt.x).toEqual(3);
      expect(pt.y).toEqual(5);
    });
    it("Should move both x and y, []", ()=>{
      const pt = new Point({x:2,y:4});
      expect(pt).toBeObj({x:2,y:4});
      pt.point = [3, 5]
      expect(pt.x).toEqual(3);
      expect(pt.y).toEqual(5);
    });
  });

  describe("Test Point move svg", ()=>{
    beforeEach(()=>{
      glbl.polygon = new Polygon({
        parentElement:glbl.parentElement,
        points: [{x:2,y:4}]
      })
    });

    it("Should move point x", ()=>{
      const pt = glbl.polygon.points[0];
      expect(pt).toBeObj({x:2,y:4});
      pt.x = 3;
      expect(pt.x).toEqual(3);
      expect(glbl.polygon.node.points[0].x).toEqual(3);
    });
    it("Should move point y", ()=>{
      const pt = glbl.polygon.points[0];
      expect(pt).toBeObj({x:2,y:4});
      pt.y += 1;
      expect(pt.y).toEqual(5);
      expect(glbl.polygon.node.points[0].y).toEqual(5);
    });
    it("Should move both x and y {}", ()=>{
      const pt = glbl.polygon.points[0];
      expect(pt).toBeObj({x:2,y:4});
      pt.point = {x:3, y:5};
      expect(pt).toBeObj({x:3,y:5});
      expect(glbl.polygon.node.points[0]).toBeObj({x:3,y:5});
    });
    it("Should move both x and y, []", ()=>{
      const pt = glbl.polygon.points[0];
      expect(pt).toBeObj({x:2,y:4});
      pt.point = [3, 5];
      expect(pt).toBeObj({x:3,y:5});
      expect(glbl.polygon.node.points[0]).toBeObj({x:3,y:5});
    });
  });

  describe("Test Point onChange callback", ()=>{
    let called = false;
    function onChangeCallback() { called = true;}
    afterEach(()=>{ called = false;});

    it("Should call onchange callback when change x", ()=>{
      const pt = new Point({y:4, x:2, onChangeCallback});
      expect(pt).toBeObj({x:2,y:4});
      expect(called).toBe(false);
      pt.x += 1;
      expect(called).toBe(true);
      expect(pt.x).toEqual(3);
    });
    it("Should call onchange callback when change y", ()=>{
      const pt = new Point({y:4, x:2, onChangeCallback});
      expect(pt).toBeObj({x:2,y:4});
      expect(called).toBe(false);
      pt.y += 1;
      expect(called).toBe(true);
      expect(pt.y).toEqual(5);
    });
    it("Should call onchange callback when change point with array", ()=>{
      const pt = new Point({y:4, x:2, onChangeCallback});
      expect(pt).toBeObj({x:2,y:4});
      expect(called).toBe(false);
      pt.point = [1, 2];
      expect(called).toBe(true);
      expect(pt).toBeObj({x:1,y:2});
    });
    it("Should call onchange callback when change point with object", ()=>{
      const pt = new Point({y:4, x:2, onChangeCallback});
      expect(pt).toBeObj({x:2,y:4});
      expect(called).toBe(false);
      pt.point = {x:1,y:2};
      expect(called).toBe(true);
      expect(pt).toBeObj({x:1,y:2});
    });
    it("Should not call onchange callback when values unchanged", ()=>{
      const pt = new Point({y:4, x:2, onChangeCallback});
      expect(pt).toBeObj({x:2,y:4});
      expect(called).toBe(false);
      pt.point = {x:2,y:4};
      expect(called).toBe(false);
      expect(pt).toBeObj({x:2,y:4});
    });
    it("Sould add 2 onChangeCallbacks", ()=>{
      let called1 = 0, called2 = 0;
      const cb1 = ()=>{ called1++;},
            cb2 = ()=>{ called2++;}
      const pt = new Point({x:1,y:2});
      pt.addChangeCallback(cb1);
      expect(called1).toBe(0);
      pt.x = 3;
      expect(called1).toBe(1);
      pt.addChangeCallback(cb2);
      expect(called2).toBe(0);
      pt.x = 1;
      expect(called1).toBe(2);
      expect(called2).toBe(1);
    });
    it("Should remove 1 onChangeCallback", ()=>{
      let called1 = 0, called2 = 0;
      const cb1 = ()=>{ called1++;},
            cb2 = ()=>{ called2++;}
      const pt = new Point({x:1,y:2});
      pt.addChangeCallback(cb1);
      expect(called1).toBe(0);
      pt.x = 3;
      expect(called1).toBe(1);
      pt.addChangeCallback(cb2);
      expect(called2).toBe(0);
      pt.x = 1;
      expect(called1).toBe(2);
      expect(called2).toBe(1);
      pt.removeChangeCallback(cb1);
      pt.y = 4;
      expect(called1).toBe(2);
      expect(called2).toBe(2);
    })
  });

  describe("Test friend points", ()=>{
    const createShape = (points = [{x:0,y:0}]) => {
      return glbl.polygon = new Polygon({
        parentElement:glbl.parentElement,
        points
      });
    }

    it("Should follow point1", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint:pt1});
      expect(pt1).toBeObj({x:2,y:4});
      expect(pt2).toBeObj({x:2,y:4});
    });
    it("Should follow point1 via followPt(pt1)", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1});
      expect(pt1).toBeObj({x:2,y:4});
      expect(pt2).toBeObj({x:1,y:3});
      pt2.followPoint = pt1;
      expect(pt1).toBeObj({x:2,y:4});
      expect(pt2).toBeObj({x:2,y:4});
    });
    it("Should follow point1 and move with pt1", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint:pt1});
      expect(pt2).toBeObj({x:2,y:4});
      pt1.point = [10,20];
      expect(pt2).toBeObj({x:10,y:20});
    });
    it("Should follow point1 and move pt1 when it moves", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint:pt1});
      expect(pt1).toBeObj({x:2,y:4});
      expect(pt2).toBeObj({x:2,y:4});
      pt2.point = [10,20]
      expect(pt1).toBeObj({x:10,y:20});
      expect(pt2).toBeObj({x:10,y:20});
      pt2.x -= 5;
      expect(pt1).toBeObj({x:5,y:20});
      expect(pt2).toBeObj({x:5,y:20});
      pt2.y -= 5;
      expect(pt1).toBeObj({x:5,y:15});
      expect(pt2).toBeObj({x:5,y:15});
    });
    it("Should follow with multiple points and move with pt1", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint:pt1});
      const pt3 = new Point({y:2, x:0, followPoint:pt1});
      expect(pt2).toBeObj({x:2,y:4});
      pt1.point = [10,20];
      expect(pt1).toBeObj({x:10,y:20});
      expect(pt2).toBeObj({x:10,y:20});
      expect(pt3).toBeObj({x:10,y:20});
    });
    it("Should follow with multiple points and move with pt2 or pt3", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint:pt1});
      const pt3 = new Point({y:2, x:0, followPoint:pt1});
      expect(pt2).toBeObj({x:2,y:4});
      pt2.point = [10,20];
      expect(pt1).toBeObj({x:10,y:20});
      expect(pt2).toBeObj({x:10,y:20});
      expect(pt3).toBeObj({x:10,y:20});
      pt3.point = [1,2];
      expect(pt1).toBeObj({x:1,y:2});
      expect(pt2).toBeObj({x:1,y:2});
      expect(pt3).toBeObj({x:1,y:2});
    });
    it("Should remove followPoint", ()=>{
      const pt1 = new Point({y:4, x:2});
      const pt2 = new Point({y:3, x:1, followPoint: pt1});
      pt2.point = [6,8];
      expect(pt1).toBeObj({x:6,y:8});
      expect(pt2).toBeObj({x:6,y:8});
      pt2.followPoint = null;
      pt2.point = [4,6];
      expect(pt1).toBeObj({x:6,y:8});
      expect(pt2).toBeObj({x:4,y:6});
      pt1.point = [3,1];
      expect(pt1).toBeObj({x:3,y:1});
      expect(pt2).toBeObj({x:4,y:6});
    });
    it("Should move followPoint in svg", ()=>{
      const shape = createShape();
      const pt1 = new Point({y:4, x:2, followPoint: shape.offset});
      expect(pt1).toBeObj({y:0,x:0});
      expect(shape.node.points[0]).toBeObj({x:0,y:0});
      pt1.point = [10,20];
      expect(pt1).toBeObj({x:10,y:20});
      expect(shape.node.points[0]).toBeObj({x:10,y:20});
    });
    it("Should detach old followPoint", ()=>{
      const pt1 = new Point({y:0, x:0});
      const pt2 = new Point({y:4, x:2, followPoint: pt1});
      const pt3 = new Point({y:4, x:2});
      expect(pt2).toBeObj({y:0,x:0});
      pt2.followPoint = pt3;
      expect(pt2).toBeObj({y:4,x:2});
      pt1.point = [10,20];
      expect(pt2).toBeObj({y:4,x:2});
      pt3.point = [6,8];
      expect(pt2).toBeObj({x:6,y:8});
      expect(pt1).toBeObj({y:20,x:10});
      pt2.point = [1,3];
      expect(pt3).toBeObj({x:1,y:3});
      expect(pt1).toBeObj({y:20,x:10});
    });
    it("Should detach all followers", ()=>{
      const pt1 = new Point({y:0, x:0});
      const pt2 = new Point({y:4, x:2, followPoint: pt1});
      const pt3 = new Point({y:4, x:2, followPoint: pt1});
      expect(pt2).toBeObj({x:0,y:0});
      expect(pt3).toBeObj({x:0,y:0});
      pt1.point = [10,20]; // make sure we are attached
      expect(pt1).toBeObj({x:10,y:20});
      expect(pt2).toBeObj({x:10,y:20});
      pt1.detachEverything();
      pt1.point = [1,2]; // make sure we got detached
      expect(pt2).toBeObj({x:10,y:20});
      expect(pt3).toBeObj({x:10,y:20});
    });
  });
})