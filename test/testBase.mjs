"use strict";

import { BasePointsShape, BaseShape, Polygon } from "../elements/base.mjs";
import { Point } from "../elements/point.mjs"

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testBaseShape", ()=>{
  const createShape = (points = [{x:0,y:0}], className)=>{
    const shp = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    shp.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(" "));
    glbl.point = new Point({svgPntRef: shp.points[0]});
    const pts = [];
    for(const p of shp.points) pts.push(p);
    pts[0] = glbl.point;
    glbl.shape = new BaseShape({
      parentElement: glbl.parentElement, rootElement: shp,
      points: pts,
      className
    });
  };

  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  describe("Test BaseShape constructor", ()=>{
    it("Should construct a shape with offset 0,0", ()=>{
      createShape();
      expect(glbl.shape.node.parentElement).toEqual(glbl.parentElement);
      expect(glbl.shape.offset).toEqual(glbl.point);
    });
    it("Should construct a shape with className set", ()=>{
      createShape(undefined, "testClassName");
      expect(glbl.shape.node.parentElement).toEqual(glbl.parentElement);
      expect(glbl.shape.offset).toEqual(glbl.point);
      expect(document.querySelector(".testClassName")).toEqual(glbl.shape.node);
    })
  })

  describe("Test BaseShape points", ()=>{
    it("Should get points", ()=>{
      createShape();
      const pnts = glbl.shape.points;
      expect(pnts.length).toBe(1);
      expect(pnts[0]).toBeObj({x:0,y:0});
    });
    it("Should move offset", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}]);
      glbl.shape.offset.point = {x:1,y:3};
      expect(glbl.shape.node.points[0]).toBeObj({x:1,y:3});
      expect(glbl.shape.node.points[1]).toBeObj({x:10,y:20});
      expect(glbl.shape.offset).toBeObj({x:1,y:3});

      glbl.shape.points = [{x:10,y:20},{x:1,y:3}];
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
      expect(glbl.shape.node.points[1]).toBeObj({x:1,y:3});
      expect(glbl.shape.offset).toBeObj({x:10,y:20});
    });
    it("Should move point", ()=>{
      createShape();
      glbl.shape.points = [{x:1,y:3}];
      expect(glbl.shape.node.points[0]).toBeObj({x:1,y:3});

      glbl.shape.points = [{x:10,y:20},{x:1,y:3}];
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
    });

    it("Should move shape", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.move({x:1,y:3});
      expect(glbl.shape.node.points[0]).toBeObj({x:1,y:3});
      expect(glbl.shape.node.points[1]).toBeObj({x:11,y:23});
      expect(glbl.shape.node.points[2]).toBeObj({x:31,y:43});
      expect(glbl.shape.offset).toBeObj({x:1,y:3});
    });
    it("Should move shape with array", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.move([1,3]);
      expect(glbl.shape.node.points[0]).toBeObj({x:1,y:3});
      expect(glbl.shape.node.points[1]).toBeObj({x:11,y:23});
      expect(glbl.shape.node.points[2]).toBeObj({x:31,y:43});
      expect(glbl.shape.offset).toBeObj({x:1,y:3});
    });
    it("Should move shape only x", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.move({x:1});
      expect(glbl.shape.node.points[0]).toBeObj({x:1,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:11,y:20});
      expect(glbl.shape.node.points[2]).toBeObj({x:31,y:40});
      expect(glbl.shape.offset).toBeObj({x:1,y:0});
    });
    it("Should move shape only y", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.move({y:1});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:1});
      expect(glbl.shape.node.points[1]).toBeObj({x:10,y:21});
      expect(glbl.shape.node.points[2]).toBeObj({x:30,y:41});
      expect(glbl.shape.offset).toBeObj({x:0,y:1});
    });
  });

  describe("Test baseShape scale", ()=>{
    it("Should scale x only", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.scale({xFactor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:20,y:20});
      expect(glbl.shape.node.points[2]).toBeObj({x:60,y:40});
      expect(glbl.shape.offset).toBeObj({x:0,y:0});
    })
    it("Should scale y only", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.scale({yFactor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:10,y:40});
      expect(glbl.shape.node.points[2]).toBeObj({x:30,y:80});
      expect(glbl.shape.offset).toBeObj({x:0,y:0});
    })
    it("Should scale x and y", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.scale({factor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:20,y:40});
      expect(glbl.shape.node.points[2]).toBeObj({x:60,y:80});
      expect(glbl.shape.offset).toBeObj({x:0,y:0});
    })
    it("Should scale x and Y xFactor and yFactor", ()=>{
      createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      glbl.shape.scale({xFactor:2, yFactor: 4});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:20,y:80});
      expect(glbl.shape.node.points[2]).toBeObj({x:60,y:160});
      expect(glbl.shape.offset).toBeObj({x:0,y:0});
    })
    it("Should scale x with offset point", ()=>{
      createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      glbl.shape.scale({xFactor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
      expect(glbl.shape.node.points[1]).toBeObj({x:30,y:40});
      expect(glbl.shape.node.points[2]).toBeObj({x:70,y:60});
      expect(glbl.shape.offset).toBeObj({x:10,y:20});
    })
    it("Should scale y with offset point", ()=>{
      createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      glbl.shape.scale({yFactor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
      expect(glbl.shape.node.points[1]).toBeObj({x:20,y:60});
      expect(glbl.shape.node.points[2]).toBeObj({x:40,y:100});
      expect(glbl.shape.offset).toBeObj({x:10,y:20});
    })
    it("Should scale x and y with offset point", ()=>{
      createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      glbl.shape.scale({factor:2});
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
      expect(glbl.shape.node.points[1]).toBeObj({x:30,y:60});
      expect(glbl.shape.node.points[2]).toBeObj({x:70,y:100});
      expect(glbl.shape.offset).toBeObj({x:10,y:20});
    });
    it("Should scale with offset point x and y scale differ", ()=>{
      createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      glbl.shape.scale({xFactor:2, yFactor:4});
      expect(glbl.shape.node.points[0]).toBeObj({x:10,y:20});
      expect(glbl.shape.node.points[1]).toBeObj({x:30,y:100});
      expect(glbl.shape.node.points[2]).toBeObj({x:70,y:180});
      expect(glbl.shape.offset).toBeObj({x:10,y:20});
    });
  })
});

registerTestSuite("testBasePointsShape", ()=>{
  const createShape = (points, className)=>{
    const node = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    return glbl.shape = new BasePointsShape({
      parentElement: glbl.parentElement,
      rootElement: node,
      points, className
    });
  };

  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  describe("Test constructing BasePointsShape", ()=>{
    it("Should construct a line", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
    });
    it("Should construct a linw with className", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}], "testClassName");
      expect(document.querySelector(".testClassName")).toBe(shp.node);
      expect(shp.node.className.baseVal).toBe("testClassName");
    });
    it("Should construct a 4 corner", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6},{x:7,y:8}]);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.node.points[3]).toBeObj({x:7,y:8});
      expect(shp.points[3]).toBeObj({x:7,y:8});
    });
  });

  describe("Test points interface", ()=>{
    it("Should move points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [{x:2,y:3},{x:4,y:5},{x:6,y:7}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.node.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]).toBeObj({x:6,y:7});
      expect(shp.points.length).toBe(3);
    });
    it("Should add points", ()=>{
      const shp = createShape([{x:1,y:2}]);
      expect(shp.points.length).toBe(1);
      shp.points = [{x:2,y:3},{x:4,y:5},{x:6,y:7}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.node.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]).toBeObj({x:6,y:7});
      expect(shp.points.length).toBe(3);
    });
    it("Should remove points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [{x:2,y:3},{x:4,y:5}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.points.length).toBe(2);
    });
    it("Should remove all but one point", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [];
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points.length).toBe(1);
    });
    it("Should insertPoint as pt1", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.insertPoint({x:10,y:11},1);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]).toBeObj({x:10,y:11});
      expect(shp.node.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
    });
    it("Should insertPoint as pt1 as arr", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.insertPoint([10,11],1);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]).toBeObj({x:10,y:11});
      expect(shp.node.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
    });
    it("Should insertPoint as pt0 as Point", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = new Point({x:10,y:11});
      shp.insertPoint(pt0,0);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:10,y:11});
      expect(shp.points[0]).toBeObj({x:10,y:11});
      expect(shp.node.points[1]).toBeObj({x:1,y:2});
      expect(shp.points[1]).toBeObj({x:1,y:2});
      expect(shp.node.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
      pt0.point = [20,30];
      expect(shp.node.points[0]).toBeObj({x:20,y:30});
      expect(shp.points[0]).toBeObj({x:20,y:30});
    });
    it("Should insertPoint as last as {x,y}", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.insertPoint({x:10,y:11});
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.node.points[3]).toBeObj({x:10,y:11});
      expect(shp.points[3]).toBeObj({x:10,y:11});
    });
    it("Should remove pt1 with index", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint(1);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
    });
    it("Should remove pt1 with pointRef", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint(shp.points[1]);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
    });
    it("Should remove pt1 with {x,y}", ()=> {
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint({x:3,y:4});
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
    });
    it("Should remove pt1 with [x,y]", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint([3,4]);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
    });
    it("Should not remove pt1 with mismatch {x,y}", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint({x:30,y:4});
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      shp.removePoint({x:3,y:40});
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
    });
    it("Should not remove pt1 with mismatch [x,y]", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint([30,4]);
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      shp.removePoint([3,40]);
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
    })
    it("Should remove pt0 and change offset", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt1 = shp.points[1];
      shp.removePoint(0);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:3,y:4});
      expect(shp.points[0]).toBeObj({x:3,y:4});
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.offset).toBeObj({x:3,y:4});
      expect(shp.offset).toBe(pt1);
    });
    it("Should not remove last pt", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt2 = shp.points[2];
      shp.removePoint(0);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      shp.removePoint(0);
      expect(shp.points.length).toBe(1);
      expect(shp.node.points.length).toBe(1);
      shp.removePoint(0);
      expect(shp.points.length).toBe(1);
      expect(shp.node.points.length).toBe(1);
      expect(shp.node.points[0]).toBeObj({x:5,y:6});
      expect(shp.points[0]).toBeObj({x:5,y:6});
      expect(shp.offset).toBeObj({x:5,y:6});
      expect(shp.offset).toBe(pt2);
    });
    it("Should remove last point in list", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint(shp.points[2]);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
    });
  })
})

registerTestSuite("testPolygon", ()=>{
  const createShape = (points, className)=>{
    glbl.shape = new Polygon({
      parentElement: glbl.parentElement,
      points, className
    });
  };

  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  describe("Test Constructing Polygon", ()=>{
    it("Should construct a Line", ()=>{
      createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(glbl.shape.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points.length).toBe(2);
    });
    it("Should construct a Line with className", ()=>{
      createShape([{x:0,y:0}, {x:100,y:200}], "testClassName");
      expect(glbl.shape.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points.length).toBe(2);
      expect(document.querySelector(".testClassName")).toBe(glbl.shape.node);
    });
    it("Should construct a Triangle", ()=>{
      createShape([{x:2,y:4},{x:100,y:200},{x:50, y:100}]);
      expect(glbl.shape.points[0]).toBeObj({x:2,y:4});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points[2]).toBeObj({x:50,y:100});
      expect(glbl.shape.points.length).toBe(3);
    });
    it("Should construct a 4corner", ()=>{
      createShape([{x:2,y:4},{x:100,y:200},{x:50, y:100},{x:10,y:20}]);
      expect(glbl.shape.points[0]).toBeObj({x:2,y:4});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points[2]).toBeObj({x:50,y:100});
      expect(glbl.shape.points[3]).toBeObj({x:10,y:20});
      expect(glbl.shape.points.length).toBe(4);
    })
  });

  describe("Test moving Polygon", ()=>{
    it("Should move first pt in a Line", ()=>{
      createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(glbl.shape.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points.length).toBe(2);
      glbl.shape.points[0].point = [40,50];
      expect(glbl.shape.points[0]).toBeObj({x:40,y:50});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.node.points[0]).toBeObj({x:40,y:50});
      expect(glbl.shape.node.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.offset).toBeObj({x:40,y:50});
      expect(glbl.shape.points.length).toBe(2);
    });
    it("Should move second pt in a Line", ()=>{
      createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(glbl.shape.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.points[1]).toBeObj({x:100,y:200});
      expect(glbl.shape.points.length).toBe(2);
      glbl.shape.points[1].point = [40,50];
      expect(glbl.shape.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.points[1]).toBeObj({x:40,y:50});
      expect(glbl.shape.node.points[0]).toBeObj({x:0,y:0});
      expect(glbl.shape.node.points[1]).toBeObj({x:40,y:50});
      expect(glbl.shape.offset).toBeObj({x:0,y:0});
      expect(glbl.shape.points.length).toBe(2);
    });
  });
});