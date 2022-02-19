"use strict";

import { Point } from "../../elements/point.mjs";
import { Circle, Triangle, Square } from "../../elements/trigenometry/index.mjs";

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
    it("should only construct with 3 point instance and move points in SVG", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:3,y:4}),
            pt2 = new Point({x:5,y:6});
      const triangle = createTriangle([pt0,pt1,pt2]);
      expect(triangle.points.length).toEqual(3);
      pt0.point = [10,20];
      expect(triangle.points[0]).toBe(pt0);
      expect(triangle.node.points[0]).toBeObj({x:10,y:20});
      pt1.point = [30,40];
      expect(triangle.points[1]).toBe(pt1);
      expect(triangle.node.points[1]).toBeObj({x:30,y:40});
      pt2.point = [50,60];
      expect(triangle.points[2]).toBe(pt2);
      expect(triangle.node.points[2]).toBeObj({x:50,y:60});
    });
  })
});

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
