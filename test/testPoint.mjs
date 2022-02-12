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
})