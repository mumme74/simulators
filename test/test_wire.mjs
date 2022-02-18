"use strict";

import { Point } from "../elements/point.mjs";
import { Wire } from "../elements/wire.mjs";

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testWire", ()=>{
  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  const createWire = ({startPnt, endPnt, betweenPnts, className})=>{
    return glbl.shape = new Wire({
      parentElement: glbl.parentElement,
      startPnt, endPnt, betweenPnts,
      className
    });
  };

  describe("Test Wire construction", ()=>{
    it("Should construct with 2 default points", ()=>{
      const wire = createWire({});
      expect(wire.points.length).toBe(2);
      expect(wire.offset).toBeObj({x:0,y:0});
      expect(wire.startPnt).toBeObj({x:0,y:0});
      expect(wire.endPnt).toBeObj({x:0,y:0});
    });
    it("Should construct with 1 default points", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}});
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.offset).toBeObj({x:10,y:20});
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.endPnt).toBeObj({x:0,y:0});
    });
    it("Should construct with className", ()=>{
      const wire = createWire({className:"testClassName"});
      expect(document.querySelector(".testClassName")).toBe(wire.node);
    });
    it("Should construct with 2 freehanging points", ()=>{
      const p1 = {x:10,y:20}, p2 = {x:30,y:40};
      const pt1 = new Point(p1), pt2 = new Point(p2);
      const wire = createWire({startPnt:p1, endPnt:p2});
      expect(wire.startPnt).toBeObj(p1);
      expect(wire.endPnt).toBeObj(p2);
      expect(wire.startPnt).toNotBe(pt1);
      expect(wire.endPnt).toNotBe(pt2);
    });
    it("Should construct with 2 attached points", ()=>{});
    it("Should construct with betweenPoints", ()=>{});
  });

  describe("Test endpoints manipulation", ()=>{

  });
});