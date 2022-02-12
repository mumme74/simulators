"use strict";

import { Triangle } from '../elements/trigenometry/triangle.mjs';

let triangle = null;
const parentElement = document.querySelector("svg");

registerTestSuite("testTriangle", ()=>{
  afterEach(()=>{
    if (triangle)
      parentElement.removeChild(triangle.node);
  })

  describe("Test constructor", ()=>{
    it("should construct with all points to zero", ()=>{
      triangle = new Triangle({parentElement});
      expect(triangle.points.length).toEqual(3);
      expect(triangle.points[0].x).toEqual(0);
      expect(triangle.points[0].y).toEqual(0);
      expect(triangle.points[1].x).toEqual(0);
      expect(triangle.points[1].y).toEqual(0);
      expect(triangle.points[2].x).toEqual(0);
      expect(triangle.points[2].y).toEqual(0);
    })
  })
});

