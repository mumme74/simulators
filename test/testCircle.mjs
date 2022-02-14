"use strict";

import { Circle } from "../elements/trigenometry/circle.mjs";

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testCircle", ()=>{
  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  const createCircle = (radii, centerPoint, className)=>{
    return glbl.shape = new Circle({
      parentElement: glbl.parentElement,
      centerPoint,
      radii, className
    });
  };

  describe("Test Circle constructor", ()=>{
    it("Should construct a circle with radii 0", ()=>{
      const circle = createCircle();
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(0);
      expect(circle.offset).toBeObj({x:0,y:0});
    });
    it("Should construct a circle with radii 5", ()=>{
      const circle = createCircle(5);
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(5);
      expect(circle.offset).toBeObj({x:0,y:0});
    });
    it("Should construct a circle with radii 10 at 20,30", ()=>{
      const circle = createCircle(10, {x:20,y:30});
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(10);
      expect(circle.node.r.baseVal.value).toBe(10);
      expect(circle.offset).toBeObj({x:20,y:30});
      expect(circle.node.className.baseVal).toEqual("");
    });
    it("Should construct a circle with className testClassName", ()=>{
      const circle = createCircle(10, {x:20,y:30}, "testClassName");
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(10);
      expect(circle.node.r.baseVal.value).toBe(10);
      expect(circle.offset).toBeObj({x:20,y:30});
      expect(circle.node.className.baseVal).toEqual("testClassName");
      expect(document.querySelector(".testClassName")).toBe(circle.node)
    });
  });

  describe("Test Circle move and change", ()=>{
    it("Should move to 10,20", ()=>{
      const circle = createCircle(5);
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(5);
      expect(circle.offset).toBeObj({x:0,y:0});
      expect(circle.node.cx.baseVal.value).toBe(0);
      expect(circle.node.cy.baseVal.value).toBe(0);
      circle.move([10,20]);
      expect(circle.offset).toBeObj({x:10,y:20});
      expect(circle.node.cx.baseVal.value).toBe(10);
      expect(circle.node.cy.baseVal.value).toBe(20);
    });
    it("Should increase radii to 20", ()=>{
      const circle = createCircle(5);
      expect(circle.node.parentElement).toBe(glbl.parentElement);
      expect(circle.radii).toBe(5);
      circle.radii = 20;
      expect(circle.radii).toBe(20);
      expect(circle.node.r.baseVal.value).toBe(20);
    });
  })
});
