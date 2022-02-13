"use strict";

import { Triangle } from '../elements/trigenometry/triangle.mjs';

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testTriangle", ()=>{
  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  const createTriangle = (points, className)=>{
    return glbl.shape = new Triangle({
      parentElement: glbl.parentElement,
      points, className
    });
  };

  describe("Test constructor", ()=>{
    it("should construct with all points to zero", ()=>{
      const triangle = createTriangle();
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0]).toBeObj({x:0,y:0});
      expect(triangle.points[1]).toBeObj({x:0,y:0});
      expect(triangle.points[2]).toBeObj({x:0,y:0});
    });
    it("should construct with className", ()=>{
      const triangle = createTriangle(undefined, "testClassName");
      expect(triangle.points.length).toEqual(3);
      expect(document.querySelector(".testClassName")).toBe(triangle.node);
    });
    it("should construct with one point rest or zero", ()=>{
      const triangle = createTriangle([{x:2,y:4}]);
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0]).toBeObj({x:2,y:4});
      expect(triangle.points[1]).toBeObj({x:0,y:0});
      expect(triangle.points[2]).toBeObj({x:0,y:0});
    });
    it("should construct with 2 points rest or zero", ()=>{
      const triangle = createTriangle([{x:2,y:4}, {x:6,y:8}]);
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0]).toBeObj({x:2,y:4});
      expect(triangle.points[1]).toBeObj({x:6,y:8});
      expect(triangle.points[2]).toBeObj({x:0,y:0});
    });
    it("should construct with all 3 points", ()=>{
      const triangle = createTriangle([{x:2,y:4}, {x:6,y:8},{x:10,y:12}]);
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0]).toBeObj({x:2,y:4});
      expect(triangle.points[1]).toBeObj({x:6,y:8});
      expect(triangle.points[2]).toBeObj({x:10,y:12});
    });

    it("should only construct with 3 points", ()=>{
      const triangle = createTriangle([
        {x:2,y:4}, {x:6,y:8},{x:10,y:12}, {x:14,y:16}]);
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0]).toBeObj({x:2,y:4});
      expect(triangle.points[1]).toBeObj({x:6,y:8});
      expect(triangle.points[2]).toBeObj({x:10,y:12});
    });
  })
});

