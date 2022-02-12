"use strict";

import { Point } from "../elements/point.mjs";
import { Polygon } from "../elements/base.mjs";

let polygon = null;
const parentElement = document.querySelector("svg");

registerTestSuite("testPoint", ()=>{
  afterEach(()=>{
    if (polygon)
      parentElement.removeChild(polygon.node);
  });

  describe("Test point contruction", ()=>{

    it("Should construct a point with zero as default empty object", () =>{
      const pt = new Point({});
      expect(pt.x).toEqual(0);
      expect(pt.y).toEqual(0);
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
    })
  });
})