"use strict";

import { BaseShape, Polygon } from "../elements/base.mjs";
import { Point } from "../elements/point.mjs"

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testBaseShape", ()=>{
  const createShape = (className)=>{
    const shp = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    shp.setAttribute("points", "0,0")
    glbl.point = new Point({svgPntRef: shp.points[0]});
    glbl.shape = new BaseShape({
      parentElement: glbl.parentElement, rootElement: shp,
      startPoint: glbl.point,
      className
    });
  };

  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
    }
  });

  describe("Test BaseShape constructor", ()=>{
    it("Should construct a shape with offset 0,0", ()=>{
      createShape();
      expect(glbl.shape.node.parentElement).toEqual(glbl.parentElement);
      expect(glbl.shape.offset).toEqual(glbl.point);
    });
    it("Should construct a shape with className set", ()=>{
      createShape("testClassName");
      expect(glbl.shape.node.parentElement).toEqual(glbl.parentElement);
      expect(glbl.shape.offset).toEqual(glbl.point);
      expect(document.querySelector(".testClassName")).toEqual(glbl.shape.node);
    })
    it("Should get points", ()=>{
      createShape();
      const pnts = glbl.shape.points;
      expect(pnts.length).toBe(1);
      expect(pnts[0]).toBeObj({x:0,y:0});
    })
  })
});