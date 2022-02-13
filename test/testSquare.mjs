"use strict";

import { Square } from "../elements/trigenometry/square.mjs";

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testSquare", ()=>{
  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  const createSquare = (width, startPoint, className)=>{
    return glbl.shape = new Square({
      parentElement: glbl.parentElement,
      startPoint,
      width, className
    });
  };

  describe("Test constructor square", ()=>{
    it("should construct with all points to zero", ()=>{
      const square = createSquare();
      expect(square.points.length).toEqual(4);
      expect(square.points[0]).toBeObj({x:0,y:0});
      expect(square.points[1]).toBeObj({x:0,y:0});
      expect(square.points[2]).toBeObj({x:0,y:0});
      expect(square.points[2]).toBeObj({x:0,y:0});
    });
    it("should construct with className", ()=>{
      const square = createSquare(undefined, undefined, "testClassName");
      expect(square.points.length).toEqual(4);
      expect(document.querySelector(".testClassName")).toBe(square.node);
    });
    it("should construct with width 5", ()=>{
      const square = createSquare(5);
      expect(square.points.length).toEqual(4);
      expect(square.width).toEqual(5);
      expect(square.points[0]).toBeObj({x:0,y:0});
      expect(square.points[1]).toBeObj({x:5,y:0});
      expect(square.points[2]).toBeObj({x:5,y:5});
      expect(square.points[3]).toBeObj({x:0,y:5});
    });
    it("should construct with width 5 at startPoint 10,20", ()=>{
      const square = createSquare(5, {x:10,y:20});
      expect(square.points.length).toEqual(4);
      expect(square.width).toEqual(5);
      expect(square.points[0]).toBeObj({x:10,y:20});
      expect(square.points[1]).toBeObj({x:15,y:20});
      expect(square.points[2]).toBeObj({x:15,y:25});
      expect(square.points[3]).toBeObj({x:10,y:25});
    });
  });

  describe("Test move and size", ()=>{
    it("Should expand width to 10", ()=>{
      const square = createSquare(5);
      expect(square.points.length).toEqual(4);
      expect(square.width).toEqual(5);
      square.width = 10;
      expect(square.width).toEqual(10);
      expect(square.points[0]).toBeObj({x:0,y:0});
      expect(square.points[1]).toBeObj({x:10,y:0});
      expect(square.points[2]).toBeObj({x:10,y:10});
      expect(square.points[3]).toBeObj({x:0,y:10});
    });
    it("Should expand width to 10 offset 10 20", ()=>{
      const square = createSquare(5, {x:10,y:20});
      expect(square.points.length).toEqual(4);
      expect(square.width).toEqual(5);
      square.width = 10;
      expect(square.width).toEqual(10);
      expect(square.points[0]).toBeObj({x:10,y:20});
      expect(square.points[1]).toBeObj({x:20,y:20});
      expect(square.points[2]).toBeObj({x:20,y:30});
      expect(square.points[3]).toBeObj({x:10,y:30});
    });
    it("Should move all points by x10 and y20", ()=>{
      const square = createSquare(5);
      expect(square.width).toEqual(5);
      expect(square.offset).toBeObj({x:0,y:0});
      square.move([10,0]);
      expect(square.points[0]).toBeObj({x:10,y:0});
      expect(square.points[1]).toBeObj({x:15,y:0});
      expect(square.points[2]).toBeObj({x:15,y:5});
      expect(square.points[3]).toBeObj({x:10,y:5});
      square.move({y:10})
      expect(square.points[0]).toBeObj({x:10,y:10});
      expect(square.points[1]).toBeObj({x:15,y:10});
      expect(square.points[2]).toBeObj({x:15,y:15});
      expect(square.points[3]).toBeObj({x:10,y:15});
    });
  });

});
