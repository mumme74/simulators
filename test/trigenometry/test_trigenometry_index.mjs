"use strict";

import { Point } from "../../elements/point.mjs";
import { Circle,
         Triangle,
         Square,
         Rect,
         Arrow } from "../../elements/trigenometry/index.mjs";

const glbl = {
  shape: null,
  shapes: [],
  parentElement: document.querySelector("svg"),
  point: null,
  cleanup: ()=>{
    if (glbl.shape)
      glbl.shape.node.parentElement.removeChild(glbl.shape.node);
    while(glbl.shapes.length) {
      const shp = glbl.shapes.pop();
      shp.node.parentElement.removeChild(shp.node);
      if (shp.shapes)
        for(const sub of shp.shapes)
          sub.node.parentElement.removeChild(sub.node);
    }
    glbl.shape = null;
    glbl.point = null;
  }
};

registerTestSuite("testCircle", ()=>{
  afterEach(glbl.cleanup);

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
  afterEach(glbl.cleanup);

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
  afterEach(glbl.cleanup);

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

registerTestSuite("testRect", ()=>{
  afterEach(glbl.cleanup);

  const createRect = ({topLeft, className, width, height, roundCorners})=>{
    glbl.shapes.push(new Rect({
      parentElement: glbl.parentElement,
      topLeft, height, roundCorners,
      width, className
    }));
    return glbl.shapes[glbl.shapes.length-1];
  };

  describe("Test constructor", ()=>{
    it("Should construct default 0,0 all props 0", ()=>{
      const rect = createRect({});
      expect(rect.offset).toBeObj({x:0,y:0});
      expect(rect.node.x.baseVal.value).toBe(0);
      expect(rect.node.y.baseVal.value).toBe(0);
      expect(rect.width).toBe(0);
      expect(rect.node.width.baseVal.value).toBe(0);
      expect(rect.height).toBe(0);
      expect(rect.node.height.baseVal.value).toBe(0);
      expect(rect.roundedCorners).toBe(0);
      expect(rect.node.rx.baseVal.value).toBe(0);
      expect(rect.node.ry.baseVal.value).toBe(0);
    });
    it("Should construct 10,20", ()=>{
      const rect = createRect({topLeft:{x:10,y:20}});
      expect(rect.offset).toBeObj({x:10,y:20});
      expect(rect.node.x.baseVal.value).toBe(10);
      expect(rect.node.y.baseVal.value).toBe(20);
      expect(rect.width).toBe(0);
      expect(rect.node.width.baseVal.value).toBe(0);
      expect(rect.height).toBe(0);
      expect(rect.node.height.baseVal.value).toBe(0);
      expect(rect.roundedCorners).toBe(0);
      expect(rect.node.rx.baseVal.value).toBe(0);
      expect(rect.node.ry.baseVal.value).toBe(0);
    });
    it("Should construct with point 10,20", ()=>{
      const pt = new Point({x:10,y:20});
      const rect = createRect({topLeft:pt});
      expect(rect.offset).toBeObj({x:10,y:20});
      expect(rect.node.x.baseVal.value).toBe(10);
      expect(rect.node.y.baseVal.value).toBe(20);
      pt.point = [15,25];
      expect(rect.offset).toBeObj({x:15,y:25});
      expect(rect.node.x.baseVal.value).toBe(15);
      expect(rect.node.y.baseVal.value).toBe(25);
    });
    it("Should construct width 100, height 200r ", ()=>{
      const rect = createRect({width:100, height:200});
      expect(rect.width).toBe(100);
      expect(rect.node.width.baseVal.value).toBe(100);
      expect(rect.height).toBe(200);
      expect(rect.node.height.baseVal.value).toBe(200);
      expect(rect.roundedCorners).toBe(0);
      expect(rect.node.rx.baseVal.value).toBe(0);
      expect(rect.node.ry.baseVal.value).toBe(0);
    });
    it("Should construct roundedcorners width 100 height 200", ()=>{
      const rect = createRect({roundCorners:10, height:25, width:20});
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
      expect(rect.height).toBe(25);
      expect(rect.node.height.baseVal.value).toBe(25);
      expect(rect.roundedCorners).toBe(10);
      expect(rect.node.rx.baseVal.value).toBe(10);
      expect(rect.node.ry.baseVal.value).toBe(10);
    });
  });

  describe("Test width", ()=>{
    it("Should get width", ()=>{
      const rect = createRect({width:20});
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
    });
    it("Should set width", ()=>{
      const rect = createRect({});
      expect(rect.width).toBe(0);
      expect(rect.node.width.baseVal.value).toBe(0);
      rect.width = 20;
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
    });
    it("Should should not set negative width", ()=>{
      const rect = createRect({width:20});
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
      rect.width = -10;
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
    });
    it("Should reduce rounded corners", ()=>{
      const rect = createRect({width:20, height:20, roundCorners:10});
      expect(rect.width).toBe(20);
      expect(rect.node.width.baseVal.value).toBe(20);
      expect(rect.roundedCorners).toBe(10);
      rect.width = 10;
      expect(rect.width).toBe(10);
      expect(rect.node.width.baseVal.value).toBe(10);
      expect(rect.roundedCorners).toBe(5)
      expect(rect.node.rx.baseVal.value).toBe(5);
      expect(rect.node.ry.baseVal.value).toBe(5);
    });
  });
  describe("Test height", ()=>{
    it("Should get height", ()=>{
      const rect = createRect({height:10});
      expect(rect.height).toBe(10);
      expect(rect.node.height.baseVal.value).toBe(10);
    });
    it("Should set height", ()=>{
      const rect = createRect({});
      expect(rect.height).toBe(0);
      expect(rect.node.height.baseVal.value).toBe(0);
      rect.height = 10;
      expect(rect.height).toBe(10);
      expect(rect.node.height.baseVal.value).toBe(10);
    });
    it("Should not set negative height ", ()=>{
      const rect = createRect({height:20});
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
      rect.height = -10;
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
    });
    it("Should should reduce rounded corners", ()=>{
      const rect = createRect({height:20, width:25, roundCorners:10});
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
      expect(rect.roundedCorners).toBe(10);
      rect.height = 10;
      expect(rect.height).toBe(10);
      expect(rect.node.height.baseVal.value).toBe(10);
      expect(rect.roundedCorners).toBe(5);
      expect(rect.node.rx.baseVal.value).toBe(5);
      expect(rect.node.ry.baseVal.value).toBe(5);
    });
  });
  describe("Test roundConers", ()=>{
    it("Should get roundedCorners", ()=>{
      const rect = createRect({height:20, width:25, roundCorners:10});
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
      expect(rect.roundedCorners).toBe(10);
    });
    it("Should set roundedCorners", ()=>{
      const rect = createRect({height:20, width:25});
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
      expect(rect.roundedCorners).toBe(0);
      expect(rect.node.rx.baseVal.value).toBe(0);
      expect(rect.node.ry.baseVal.value).toBe(0);
      rect.roundedCorners = 5;
      expect(rect.roundedCorners).toBe(5);
      expect(rect.node.rx.baseVal.value).toBe(5);
      expect(rect.node.ry.baseVal.value).toBe(5);
    });
    it("Should not set roundedCorner > (width/height) / 2", ()=>{
      const rect = createRect({height:20, width:25, roundCorners:10});
      expect(rect.height).toBe(20);
      expect(rect.node.height.baseVal.value).toBe(20);
      expect(rect.roundedCorners).toBe(10);
      expect(rect.node.rx.baseVal.value).toBe(10);
      expect(rect.node.ry.baseVal.value).toBe(10);
      rect.roundCorners = 20;
      expect(rect.roundedCorners).toBe(10);
      expect(rect.node.rx.baseVal.value).toBe(10);
      expect(rect.node.ry.baseVal.value).toBe(10);
    });
  });
})

registerTestSuite("testArrow", ()=>{

  const args = {point1:{x:0,y:0}, point2:{x:10,y:20}};
  beforeEach(()=>{
    for(const key of Object.keys(args))
      delete args[key];
    args.point1 = {x:0,y:0};
    args.point2 = {x:10,y:20};
  });

  afterEach(glbl.cleanup);

  const createArrow = (args)=>{
    args.parentElement = glbl.parentElement
    glbl.shapes.push(new Arrow(args));
    return glbl.shapes[glbl.shapes.length-1];
  };

  describe("Test construction", ()=>{
    it("Should construct with defaults", ()=>{
      const shp = createArrow(args);
      expect(shp.line.offset).toBeObj(args.point1);
      expect(shp.shapes.length).toBe(2);
      expect(shp.pnt2Arrow.offset).toBeObj(args.point2);
      expect(shp.pnt1Arrow).toBe(undefined);
      expect(shp.node.className.baseVal).toBe("");
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
    });
    it("Should construct with className", ()=>{
      args.className = "testClassName"
      const shp = createArrow(args);
      expect(shp.line.offset).toBeObj(args.point1);
      expect(shp.shapes.length).toBe(2);
      expect(shp.pnt2Arrow.offset).toBeObj(args.point2);
      expect(shp.pnt1Arrow).toBe(undefined);
      expect(shp.node.className.baseVal).toBe("testClassName");
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
    });
    it("Should construct with arrow at end1", ()=>{
      args.end1 = true; args.end2 = false;
      const shp = createArrow(args);
      expect(shp.line.points[1]).toBeObj(args.point2);
      expect(shp.shapes.length).toBe(2);
      expect(shp.pnt1Arrow.offset).toBeObj(args.point1);
      expect(shp.pnt2Arrow).toBe(undefined);
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
    });
    it("Should construct with arrow at no end", ()=>{
      args.end1 = false; args.end2 = false;
      const shp = createArrow(args);
      expect(shp.line.points[1]).toBeObj(args.point2);
      expect(shp.line.points[0]).toBeObj(args.point1);
      expect(shp.shapes.length).toBe(1);
      expect(shp.pnt1Arrow).toBe(undefined);
      expect(shp.pnt2Arrow).toBe(undefined);
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
    });
    it("Should construct with arrow at both ends", ()=>{
      args.end1 = true; args.end2 = true;
      const shp = createArrow(args);
      expect(shp.line.points[1]).toBeObj({x:6.1,y:12.3}, 1);
      expect(shp.line.points[0]).toBeObj({x:3.9,y:7.7},1);
      expect(shp.shapes.length).toBe(3);
      expect(shp.pnt1Arrow).toNotBe(undefined);
      expect(shp.pnt2Arrow).toNotBe(undefined);
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
    });
    it("Should construct with size 50", ()=>{
      const shp = createArrow(args);
      args.point1.x += 10; args.point2.x += 10;
      args.end1 = true; args.end2 = false;
      const shp1 = createArrow(args);
      args.point1.x += 10; args.point2.x += 10;
      args.end1 = false; args.end2 = false;
      const shp2 = createArrow(args);
      args.point1.x += 10; args.point2.x += 10;
      args.end1 = true; args.end2 = true;
      const shp3 = createArrow(args);
    });
  });

  describe("Test move", ()=>{
    it("Should move arrows and line", ()=>{});
    it("Should move and recalculate height, width", ()=>{});
    it("Should move and recalculate angle", ()=>{});
  });
})
