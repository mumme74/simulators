"use strict";

import { BasePointsShape, BaseShape,
         Polygon, Polyline, Line,
         Text, SizeRect, Group } from "../elements/base.mjs";
import { Point } from "../elements/point.mjs"

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
    }
    glbl.point = null;
    glbl.shape = null;
  }
};

registerTestSuite("testSizeRect", ()=>{
  describe("Test construction ", ()=>{
    it("Should construct default at 0,0", ()=>{
      const sz = new SizeRect({});
      expect(sz.centerPoint).toBeObj({x:0,y:0});
      expect(sz.height).toBe(0);
      expect(sz.width).toBe(0);
    });
    it("Should construct centerPoint at 10,20", ()=>{
      const sz = new SizeRect({centerPoint:{x:10,y:20}});
      expect(sz.centerPoint).toBeObj({x:10,y:20});
      expect(sz.height).toBe(0);
      expect(sz.width).toBe(0);
    });
    it("Should construct centerPoint as point 10,20", ()=>{
      const pt = new Point({x:10,y:20});
      const sz = new SizeRect({centerPoint:pt});
      expect(sz.centerPoint).toBeObj({x:10,y:20});
      expect(sz.height).toBe(0);
      expect(sz.width).toBe(0);
    });
    it("Should construct topLeft at 10,20 width 30 height 40", ()=>{
      const sz = new SizeRect({topLeft:{x:10,y:20},width:30,height:40});
      expect(sz.centerPoint).toBeObj({x:25,y:40});
      expect(sz.height).toBe(40);
      expect(sz.width).toBe(30);
    });
    it("Should clone from another rect", ()=>{
      const sz0 = new SizeRect({topLeft:{x:10,y:20},width:30,height:40});
      const sz = new SizeRect({cloneFromRect:sz0});
      expect(sz.centerPoint).toBeObj({x:25,y:40});
      expect(sz.height).toBe(40);
      expect(sz.width).toBe(30);
    });
    it("Should construct with followPoint", ()=>{
      const pt = new Point({x:10,y:20});
      const sz0 = new SizeRect({followPoint:pt,width:30,height:40});
      const sz = new SizeRect({cloneFromRect:sz0});
      expect(sz.centerPoint).toBeObj({x:10,y:20});
      expect(sz.height).toBe(40);
      expect(sz.width).toBe(30);
    });
    it("Should construct with followPoint and offset", ()=>{
      const pt = new Point({x:10,y:20});
      const sz0 = new SizeRect({followPoint:pt, followOffset:{x:20,y:30},width:30,height:40});
      const sz = new SizeRect({cloneFromRect:sz0,followPoint:sz0.centerPoint});
      expect(sz.centerPoint).toBeObj({x:30,y:50});
      expect(sz.height).toBe(40);
      expect(sz.width).toBe(30);
      pt.moveBy({x:-5,y:-10});
      expect(sz.centerPoint).toBeObj({x:25,y:40});
    });
  });

  describe("Test number props", ()=>{
    it("Should test topLeft 0,0", ()=>{
      const sz = new SizeRect({topLeft:{x:0,y:0}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:20,y:10});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.leftPoint).toBeObj({x:0,y:10});
      expect(sz.left).toBe(0);
      expect(sz.right).toBe(40);
      expect(sz.rightPoint).toBeObj({x:40,y:10});
      expect(sz.top).toBe(0);
      expect(sz.topPoint).toBeObj({x:20,y:0});
      expect(sz.bottom).toBe(20);
      expect(sz.bottomPoint).toBeObj({x:20,y:20});
    });
    it("Should center 0,0", ()=>{
      const sz = new SizeRect({centerPoint:{x:0,y:0}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:0,y:0});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.left).toBe(-20);
      expect(sz.right).toBe(20);
      expect(sz.top).toBe(-10);
      expect(sz.bottom).toBe(10);
    });
    it("Should get when center is at 50,100", ()=>{
      const sz = new SizeRect({centerPoint:{x:50,y:100}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:50,y:100});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.left).toBe(30);
      expect(sz.right).toBe(70);
      expect(sz.top).toBe(90);
      expect(sz.bottom).toBe(110);
    });
    it("Should get when topLeft is 50,100", ()=>{
      const sz = new SizeRect({topLeft:{x:50,y:100}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:70,y:110});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.left).toBe(50);
      expect(sz.right).toBe(90);
      expect(sz.top).toBe(100);
      expect(sz.bottom).toBe(120);
    });
  });
  describe('Test point props', ()=>{
    it("Should get topLeft at 0,0", ()=>{
      const sz = new SizeRect({topLeft:{x:0,y:0}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:20,y:10});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.topLeft).toBeObj({x:0,y:0});
      expect(sz.topRight).toBeObj({x:40,y:0});
      expect(sz.bottomLeft).toBeObj({x:0,y:20});
      expect(sz.bottomRight).toBeObj({x:40,y:20});
    });
    it("Should get when centerpoint at 0,0 ", ()=>{
      const sz = new SizeRect({centerPoint:{x:0,y:0}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:0,y:0});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.topLeft).toBeObj({x:-20,y:-10});
      expect(sz.topRight).toBeObj({x:20,y:-10});
      expect(sz.bottomLeft).toBeObj({x:-20,y:10});
      expect(sz.bottomRight).toBeObj({x:20,y:10});
    });
    it("Should get when cneterpoint is at 5,100", ()=>{
      const sz = new SizeRect({centerPoint:{x:50,y:100}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:50,y:100});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.topLeft).toBeObj({x:30,y:90});
      expect(sz.topRight).toBeObj({x:70,y:90});
      expect(sz.bottomLeft).toBeObj({x:30,y:110});
      expect(sz.bottomRight).toBeObj({x:70,y:110});
    });
    it("Should get when topLeft at 50,100", ()=>{
      const sz = new SizeRect({topLeft:{x:50,y:100}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:70,y:110});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.topLeft).toBeObj({x:50,y:100});
      expect(sz.topRight).toBeObj({x:90,y:100});
      expect(sz.bottomLeft).toBeObj({x:50,y:120});
      expect(sz.bottomRight).toBeObj({x:90,y:120});
    });
    it("Should get coords as points topLeft 30,40", ()=>{
      const sz = new SizeRect({topLeft:{x:30,y:40}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:50,y:50});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.leftPoint).toBeObj({x:30,y:50});
      expect(sz.topLeftPoint).toBeObj({x:30,y:40});
      expect(sz.left).toBe(30);
      expect(sz.right).toBe(70);
      expect(sz.rightPoint).toBeObj({x:70,y:50});
      expect(sz.topRightPoint).toBeObj({x:70,y:40});
      expect(sz.top).toBe(40);
      expect(sz.topPoint).toBeObj({x:50,y:40});
      expect(sz.bottomLeftPoint).toBeObj({x:30,y:60});
      expect(sz.bottom).toBe(60);
      expect(sz.bottomPoint).toBeObj({x:50,y:60});
      expect(sz.bottomRightPoint).toBeObj({x:70,y:60});
    });
    it("Should coords as points tcenterPoint 50,50", ()=>{
      const sz = new SizeRect({centerPoint:{x:50,y:50}, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:50,y:50});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(sz.leftPoint).toBeObj({x:30,y:50});
      expect(sz.topLeftPoint).toBeObj({x:30,y:40});
      expect(sz.left).toBe(30);
      expect(sz.right).toBe(70);
      expect(sz.rightPoint).toBeObj({x:70,y:50});
      expect(sz.topRightPoint).toBeObj({x:70,y:40});
      expect(sz.top).toBe(40);
      expect(sz.topPoint).toBeObj({x:50,y:40});
      expect(sz.bottomLeftPoint).toBeObj({x:30,y:60});
      expect(sz.bottom).toBe(60);
      expect(sz.bottomPoint).toBeObj({x:50,y:60});
      expect(sz.bottomRightPoint).toBeObj({x:70,y:60});
    });
  });

  describe("Test point move", ()=>{
    it("Should move centerPoint with followPoint 0,0", ()=>{
      const fp = new Point({x:0,y:0});
      const sz = new SizeRect({followPoint:fp, height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:0,y:0});
      const leftPoint = sz.leftPoint,
            rightPoint = sz.rightPoint,
            topPoint = sz.topPoint,
            bottomPoint = sz.bottomPoint,
            topLeftPoint = sz.topLeftPoint,
            topRightPoint = sz.topRightPoint,
            bottomLeftPoint = sz.bottomLeftPoint,
            bottomRightPoint = sz.bottomRightPoint;
      fp.point = [50,50];
      expect(sz.centerPoint).toBeObj({x:50,y:50});
      expect(sz.height).toBe(20);
      expect(sz.width).toBe(40);
      expect(leftPoint).toBeObj({x:30,y:50});
      expect(topLeftPoint).toBeObj({x:30,y:40});
      expect(rightPoint).toBeObj({x:70,y:50});
      expect(topRightPoint).toBeObj({x:70,y:40});
      expect(topPoint).toBeObj({x:50,y:40});
      expect(bottomLeftPoint).toBeObj({x:30,y:60});
      expect(bottomPoint).toBeObj({x:50,y:60});
      expect(bottomRightPoint).toBeObj({x:70,y:60});
    });
    it("Should move centerPoint from default point", ()=>{
      const sz = new SizeRect({height:20, width:40});
      expect(sz.centerPoint).toBeObj({x:0,y:0});
      const centerPoint = sz.centerPoint,
            leftPoint = sz.leftPoint,
            rightPoint = sz.rightPoint,
            topPoint = sz.topPoint,
            bottomPoint = sz.bottomPoint,
            topLeftPoint = sz.topLeftPoint,
            topRightPoint = sz.topRightPoint,
            bottomLeftPoint = sz.bottomLeftPoint,
            bottomRightPoint = sz.bottomRightPoint;
      centerPoint.point = [50,50];
      expect(sz.centerPoint).toBeObj({x:50,y:50});
      expect(leftPoint).toBeObj({x:30,y:50});
      expect(topLeftPoint).toBeObj({x:30,y:40});
      expect(rightPoint).toBeObj({x:70,y:50});
      expect(topRightPoint).toBeObj({x:70,y:40});
      expect(topPoint).toBeObj({x:50,y:40});
      expect(bottomLeftPoint).toBeObj({x:30,y:60});
      expect(bottomPoint).toBeObj({x:50,y:60});
      expect(bottomRightPoint).toBeObj({x:70,y:60});
    });
  });
})

registerTestSuite("testBaseShape", ()=>{
  const createShape = (points = [{x:0,y:0}], className)=>{
    const shp = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    shp.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(" "));
    glbl.shape = new BaseShape({
      parentElement: glbl.parentElement, rootElement: shp,
      points,
      className
    });
    glbl.point = glbl.shape.points[0];
    return glbl.shape;
  };

  afterEach(glbl.cleanup);

  describe("Test BaseShape constructor", ()=>{
    it("Should construct a shape with offset 0,0", ()=>{
      const shp = createShape();
      expect(shp.node.parentElement).toEqual(glbl.parentElement);
      expect(shp.offset).toEqual(glbl.point);
    });
    it("Should construct a shape with className set", ()=>{
      const shp = createShape(undefined, "testClassName");
      expect(shp.node.parentElement).toEqual(glbl.parentElement);
      expect(shp.offset).toEqual(glbl.point);
      expect(document.querySelector(".testClassName")).toEqual(shp.node);
    });
    it("Should call decorateNewPoint on construction", ()=>{
      const pts = [];
      const oldMhd = BaseShape.prototype._decorateNewPoint;
      BaseShape.prototype._decorateNewPoint = (pt) => { pts.push(pt); }
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      expect(shp.points.length).toBe(2);
      expect(pts.length).toBe(2);
      expect(pts).toBeObj(shp.points);
      BaseShape.prototype._decorateNewPoint = oldMhd;
    });
    it("Should register owner as shp", ()=>{
      const shp = createShape([{x:1,y:2}, {x:3,y:4},{x:5,y:6}]);
      expect(shp.offset.owner).toBe(shp);
      expect(shp.points[0].owner).toBe(shp);
      expect(shp.points[1].owner).toBe(shp);
      expect(shp.points[2].owner).toBe(shp);
    });
    it("Should register owner as shp with points", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:3,y:4}),
            pt2 = new Point({x:5,y:6})
      const shp = createShape([pt0,pt1,pt2]);
      expect(shp.offset.owner).toBe(shp);
      expect(shp.points[0].owner).toBe(shp);
      expect(pt0.owner).toBe(shp);
      expect(shp.points[1].owner).toBe(shp);
      expect(pt1.owner).toBe(shp);
      expect(shp.points[2].owner).toBe(shp);
      expect(pt2.owner).toBe(shp);
    });
  });

  describe("Test BaseShape points", ()=>{
    it("Should get points", ()=>{
      const shp = createShape();
      expect(shp.points.length).toBe(1);
      expect(shp.points[0]).toBeObj({x:0,y:0});
    });
    it("Should move offset", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}]);
      shp.offset.point = {x:1,y:3};
      expect(shp.node.points[0]).toBeObj({x:1,y:3});
      expect(shp.node.points[1]).toBeObj({x:10,y:20});
      expect(shp.offset).toBeObj({x:1,y:3});

      shp.points = [{x:10,y:20},{x:1,y:3}];
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.points[1]).toBeObj({x:1,y:3});
      expect(shp.offset).toBeObj({x:10,y:20});
    });
    it("Should move point", ()=>{
      const shp = createShape();
      shp.points = [{x:1,y:3}];
      expect(shp.node.points[0]).toBeObj({x:1,y:3});

      shp.points = [{x:10,y:20},{x:1,y:3}];
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
    });
    it("Should remove points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [{x:1,y:2}];
      expect(shp.points.length).toBe(1);
      expect(shp.points[0]).toBeObj({x:1,y:2})
    });
    it("Should not remove pt0", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [];
      expect(shp.points.length).toBe(1)
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.offset).toBeObj({x:1,y:2});
    });
    it("Should add points", ()=>{
      const shp = createShape([{x:1,y:2}]);
      expect(shp.points.length).toBe(1);
      shp.points = [{x:1,y:2},{x:3,y:4},{x:5,y:6}];
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0].owner).toBeObj(shp);
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1].owner).toBeObj(shp);
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2].owner).toBeObj(shp);
    });
    it("Should reorder points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = shp.points[0],
            pt1 = shp.points[1],
            pt2 = shp.points[2];
      shp.points = [pt1,pt2,pt0];
      expect(shp.offset).toBe(pt1);
      expect(shp.points[0]).toBe(pt1);
      expect(shp.points[0].owner).toBe(shp);
      expect(shp.points[1]).toBe(pt2);
      expect(shp.points[1].owner).toBe(shp);
      expect(shp.points[2]).toBe(pt0);
      expect(shp.points[2].owner).toBe(shp);
    });
    it("Should reorder, add, and remove points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = shp.points[0],
            pt1 = shp.points[1],
            pt2 = shp.points[2];
      shp.points = [pt2,{x:7,y:8},pt1];
      expect(shp.offset).toBe(pt2);
      expect(shp.points[0]).toBe(pt2);
      expect(shp.points[0].owner).toBe(shp);
      expect(shp.points[1]).toNotBe(pt1);
      expect(shp.points[1]).toBeObj({x:7,y:8});
      expect(shp.points[1].owner).toBe(shp);
      expect(shp.points[2]).toBe(pt1);
      expect(shp.points[2].owner).toBe(shp);
    });
    it("Should call _decorateNewPoint", ()=>{
      const shp = createShape([{x:1,y:2}]);
      const pts = [];
      const oldMhd = BaseShape.prototype._decorateNewPoint;
      BaseShape.prototype._decorateNewPoint = (pt) => { pts.push(pt); }
      const pt = new Point({x:3,y:4});
      shp.points = [pt];
      expect(shp.points.length).toBe(1);
      expect(pts.length).toBe(1);
      expect(pts).toBeObj(shp.points);
      expect(shp.points[0]).toBeObj({x:3,y:4});
      expect(shp.offset).toBe(pt);
      BaseShape.prototype._decorateNewPoint = oldMhd;
    });
    it("Should call _pointRemoved", ()=>{
      const pts = [];
      const oldMhd = BaseShape.prototype._pointRemoved;
      BaseShape.prototype._pointRemoved = (pt) => { pts.push(pt); }
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = shp.points[0], pt1 = shp.points[1], pt2 = shp.points[2];
      shp.points = [pt2,pt0];
      expect(pts.length).toBe(1);
      expect(pts[0]).toBe(pt1);
      expect(shp.points[0]).toBe(pt2);
      expect(shp.points[1]).toBe(pt0);
      BaseShape.prototype._pointRemoved = oldMhd;
    });
    it("Should call _pointRemoved {x,y}", ()=>{
      const pts = [];
      const oldMhd = BaseShape.prototype._pointRemoved;
      BaseShape.prototype._pointRemoved = (pt) => { pts.push(pt); }
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = shp.points[0], pt1 = shp.points[1], pt2 = shp.points[2];
      shp.points = [{x:5,y:6},{x:1,y:2}];
      expect(pts.length).toBe(1);
      expect(pts[0]).toBe(pt2);
      expect(shp.points[0]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:1,y:2});
      BaseShape.prototype._pointRemoved = oldMhd;
    });
    it("Should call _recalculatePnts", ()=>{
      let pts = [];
      const oldMhd = BaseShape.prototype._recalulatePnts;
      BaseShape.prototype._recalulatePnts = (pt) => { pts = pts.concat(pt); }
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = shp.points[0], pt1 = shp.points[1], pt2 = shp.points[2];
      shp.points = [pt1,pt2,pt0];
      expect(shp.points).toBeObj([pt1,pt2,pt0]);
      expect(pts.length).toBe(3);
      expect(pts).toBeObj([pt1,pt2,pt0]);
      BaseShape.prototype._recalulatePnts = oldMhd;
    })
  });

  describe("Test BaseShape move", ()=>{
    it("Should move shape", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.move({x:1,y:3});
      expect(shp.node.points[0]).toBeObj({x:1,y:3});
      expect(shp.node.points[1]).toBeObj({x:11,y:23});
      expect(shp.node.points[2]).toBeObj({x:31,y:43});
      expect(shp.offset).toBeObj({x:1,y:3});
    });
    it("Should move shape with array", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.move([1,3]);
      expect(shp.node.points[0]).toBeObj({x:1,y:3});
      expect(shp.node.points[1]).toBeObj({x:11,y:23});
      expect(shp.node.points[2]).toBeObj({x:31,y:43});
      expect(shp.offset).toBeObj({x:1,y:3});
    });
    it("Should move shape only x", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.move({x:1});
      expect(shp.node.points[0]).toBeObj({x:1,y:0});
      expect(shp.node.points[1]).toBeObj({x:11,y:20});
      expect(shp.node.points[2]).toBeObj({x:31,y:40});
      expect(shp.offset).toBeObj({x:1,y:0});
    });
    it("Should move shape only y", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.move({y:1});
      expect(shp.node.points[0]).toBeObj({x:0,y:1});
      expect(shp.node.points[1]).toBeObj({x:10,y:21});
      expect(shp.node.points[2]).toBeObj({x:30,y:41});
      expect(shp.offset).toBeObj({x:0,y:1});
    });
  });

  describe("Test baseShape scale", ()=>{
    it("Should scale x only", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.scale({xFactor:2});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[1]).toBeObj({x:20,y:20});
      expect(shp.node.points[2]).toBeObj({x:60,y:40});
      expect(shp.offset).toBeObj({x:0,y:0});
    });
    it("Should scale y only", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.scale({yFactor:2});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[1]).toBeObj({x:10,y:40});
      expect(shp.node.points[2]).toBeObj({x:30,y:80});
      expect(shp.offset).toBeObj({x:0,y:0});
    })
    it("Should scale x and y", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.scale({factor:2});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[1]).toBeObj({x:20,y:40});
      expect(shp.node.points[2]).toBeObj({x:60,y:80});
      expect(shp.offset).toBeObj({x:0,y:0});
    });
    it("Should scale x and Y xFactor and yFactor", ()=>{
      const shp = createShape([{x:0,y:0}, {x:10,y:20}, {x:30, y:40}]);
      shp.scale({xFactor:2, yFactor: 4});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[1]).toBeObj({x:20,y:80});
      expect(shp.node.points[2]).toBeObj({x:60,y:160});
      expect(shp.offset).toBeObj({x:0,y:0});
    });
    it("Should scale x with offset point", ()=>{
      const shp = createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      shp.scale({xFactor:2});
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.points[1]).toBeObj({x:30,y:40});
      expect(shp.node.points[2]).toBeObj({x:70,y:60});
      expect(shp.offset).toBeObj({x:10,y:20});
    });
    it("Should scale y with offset point", ()=>{
      const shp = createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      shp.scale({yFactor:2});
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.points[1]).toBeObj({x:20,y:60});
      expect(shp.node.points[2]).toBeObj({x:40,y:100});
      expect(shp.offset).toBeObj({x:10,y:20});
    });
    it("Should scale x and y with offset point", ()=>{
      const shp = createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      shp.scale({factor:2});
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.points[1]).toBeObj({x:30,y:60});
      expect(shp.node.points[2]).toBeObj({x:70,y:100});
      expect(shp.offset).toBeObj({x:10,y:20});
    });
    it("Should scale with offset point x and y scale differ", ()=>{
      const shp = createShape([{x:10,y:20}, {x:20,y:40}, {x:40, y:60}]);
      shp.scale({xFactor:2, yFactor:4});
      expect(shp.node.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.points[1]).toBeObj({x:30,y:100});
      expect(shp.node.points[2]).toBeObj({x:70,y:180});
      expect(shp.offset).toBeObj({x:10,y:20});
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

  afterEach(glbl.cleanup);

  describe("Test constructing BasePointsShape", ()=>{
    it("Should construct a line", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[0]).toBeObj(shp.node.points[0]);
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.node.points[3]).toBeObj({x:7,y:8});
      expect(shp.points[3]).toBeObj({x:7,y:8});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
    });
  });

  describe("Test points interface", ()=>{
    it("Should move points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [{x:2,y:3},{x:4,y:5},{x:6,y:7}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.node.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.points.length).toBe(3);
    });
    it("Should add points", ()=>{
      const shp = createShape([{x:1,y:2}]);
      expect(shp.points.length).toBe(1);
      shp.points = [{x:2,y:3},{x:4,y:5},{x:6,y:7}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]).toBeObj({x:6,y:7});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.points.length).toBe(3);
    });
    it("Should remove points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [{x:2,y:3},{x:4,y:5}];
      expect(shp.node.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]).toBeObj({x:2,y:3});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]).toBeObj({x:4,y:5});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points.length).toBe(2);
    });
    it("Should remove all but one point", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.points = [];
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points.length).toBe(1);
    });
    it("Should insertPoint as pt1", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.insertPoint({x:10,y:11},1);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:3,y:4});;
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2])
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
    });
    it("Should insertPoint as pt1 as arr", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.insertPoint([10,11],1);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]).toBeObj({x:10,y:11});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
    });
    it("Should insertPoint as pt0 as Point", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt0 = new Point({x:10,y:11});
      shp.insertPoint(pt0,0);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points[0]).toBeObj({x:10,y:11});
      expect(shp.points[0]).toBeObj({x:10,y:11});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:1,y:2});
      expect(shp.points[1]).toBeObj({x:1,y:2});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]).toBeObj({x:3,y:4});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.node.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]).toBeObj({x:5,y:6});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
      expect(shp.offset).toBe(shp.points[0]);
      expect(shp.offset).toBeObj({x:10,y:11});
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.node.points[3]).toBeObj({x:10,y:11});
      expect(shp.points[3]).toBeObj({x:10,y:11});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
    });
    it("Should remove pt1 with index", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint(1);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
    it("Should remove pt1 with pointRef", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint(shp.points[1]);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
    it("Should remove pt1 with {x,y}", ()=> {
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint({x:3,y:4});
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
    it("Should remove pt1 with [x,y]", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      shp.removePoint([3,4]);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
    })
    it("Should remove pt0 and change offset", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      const pt1 = shp.points[1];
      shp.removePoint(0);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:3,y:4});
      expect(shp.points[0]).toBeObj({x:3,y:4});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
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
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
    it("Should add SVGpoint instances", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      const svgPnt0 = shp.points[0]._pntRef;
      const svgPnt1 = shp.points[1]._pntRef;
      const pnt = shp.makePointWithSvgRef({x:5,y:6});
      shp.points = [pnt, ...shp.points];
      expect(shp.points[0]._pntRef).toBeObj(pnt._pntRef);
      expect(shp.points[1]._pntRef).toBeObj(svgPnt0);
      expect(shp.points[2]._pntRef).toBeObj(svgPnt1);
    });
    it("Should keep SVGpoint instances", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      const svgPnt0 = shp.points[0]._pntRef;
      const svgPnt1 = shp.points[1]._pntRef;
      shp.points = [[10,20],[30,40]];
      expect(shp.points[0]._pntRef).toBeObj(svgPnt0);
      expect(shp.points[1]._pntRef).toBeObj(svgPnt1);
    });
    it("Should keep SVGpoint instances reorder", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}]);
      const svgPnt0 = shp.points[0]._pntRef;
      const svgPnt1 = shp.points[1]._pntRef;
      shp.points = [shp.points[1], shp.points[0]];
      expect(shp.points[0]._pntRef).toBeObj(svgPnt1);
      expect(shp.points[1]._pntRef).toBeObj(svgPnt0);
    });
  });

  describe("Test makePointWithSvgRef", ()=>{
    it("Should create new point 0,0 svg and pnt", ()=>{
      const shp = createShape([{x:-1,y:-2}]);
      const pnt = shp.makePointWithSvgRef({x:1,y:2});
      expect(pnt).toBeObj({x:1,y:2});
      expect(pnt._pntRef instanceof SVGPoint).toBe(true);
      expect(pnt._pntRef).toBeObj({x:1,y:2});
    });
    it("Should create svg Point attached to pnt", ()=>{
      const shp = createShape([{x:-1,y:-2}]);
      const p = new Point({x:1,y:2})
      shp.makePointWithSvgRef(p);
      expect(p).toBeObj({x:1,y:2});
      expect(p._pntRef instanceof SVGPoint).toBe(true);
      expect(p._pntRef).toBeObj({x:1,y:2});
    });
    it("Should create svg point attached to pnt and pnt returned", ()=>{
      const shp = createShape([{x:-1,y:-2}]);
      const p = new Point({x:1,y:2})
      const pnt = shp.makePointWithSvgRef(p);
      expect(p).toBe(pnt);
      expect(pnt).toBeObj({x:1,y:2});
      expect(pnt._pntRef instanceof SVGPoint).toBe(true);
      expect(pnt._pntRef).toBeObj({x:1,y:2});
    });
  });
});

registerTestSuite("testPolygon", ()=>{
  const createShape = (points, className)=>{
    return glbl.shape = new Polygon({
      parentElement: glbl.parentElement,
      points, className
    });
  };

  afterEach(glbl.cleanup);

  describe("Test Constructing Polygon", ()=>{
    it("Should construct a Line", ()=>{
      const shp = createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points.length).toBe(2);
    });
    it("Should construct a Line with className", ()=>{
      const shp = createShape([{x:0,y:0}, {x:100,y:200}], "testClassName");
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points.length).toBe(2);
      expect(document.querySelector(".testClassName")).toBe(shp.node);
    });
    it("Should construct a Triangle", ()=>{
      const shp = createShape([{x:2,y:4},{x:100,y:200},{x:50, y:100}]);
      expect(shp.points[0]).toBeObj({x:2,y:4});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points[2]).toBeObj({x:50,y:100});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.points.length).toBe(3);
    });
    it("Should construct a 4corner", ()=>{
      const shp = createShape([{x:2,y:4},{x:100,y:200},{x:50, y:100},{x:10,y:20}]);
      expect(shp.points[0]).toBeObj({x:2,y:4});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points[2]).toBeObj({x:50,y:100});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
      expect(shp.points[3]).toBeObj({x:10,y:20});
      expect(shp.points[3]._pntRef).toBeObj(shp.node.points[3]);
      expect(shp.points.length).toBe(4);
    });
  });

  describe("Test moving Polygon", ()=>{
    it("Should move first pt in a Line", ()=>{
      const shp = createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points.length).toBe(2);
      shp.points[0].point = [40,50];
      expect(shp.points[0]).toBeObj({x:40,y:50});
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.node.points[0]).toBeObj({x:40,y:50});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.offset).toBeObj({x:40,y:50});
      expect(shp.points.length).toBe(2);
    });
    it("Should move second pt in a Line", ()=>{
      const shp = createShape([{x:0,y:0}, {x:100,y:200}]);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:100,y:200});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.points.length).toBe(2);
      shp.points[1].point = [40,50];
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.points[1]).toBeObj({x:40,y:50});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[1]).toBeObj({x:40,y:50});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points.length).toBe(2);
    });
  });
});

registerTestSuite("testPolyLine", ()=>{
  const createShape = (points, className)=>{
    return glbl.shape = new Polyline({
      parentElement: glbl.parentElement,
      points, className
    });
  };

  afterEach(glbl.cleanup);

  describe("Test PolyLine construction", ()=>{
    it("Should construct with a point", ()=>{
      const shp = createShape([{x:1,y:2}]);
      expect(shp.points.length).toBe(1);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
    });
    it("Should construct with 2 points and className", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4}], "testClassName");
      expect(shp.points.length).toBe(2);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.className.baseVal).toBe("testClassName");
      expect(document.querySelector(".testClassName"));
    });
    it("Should construct with 3 points", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      expect(shp.points.length).toBe(3);
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
      expect(shp.node.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]).toBeObj({x:5,y:6});
      expect(shp.points[2]._pntRef).toBeObj(shp.node.points[2]);
    });
  });

  describe("Test PolyLine point manipulation", ()=>{
    it("Should move pt1", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      shp.points[1].point = [30,40];
      expect(shp.points[1]).toBeObj({x:30,y:40});
      expect(shp.node.points[1]).toBeObj({x:30,y:40});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
    it("Should insert pt0", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      shp.insertPoint([30,40], 0);
      expect(shp.points.length).toBe(4);
      expect(shp.node.points.length).toBe(4);
      expect(shp.points[0]).toBeObj({x:30,y:40});
      expect(shp.node.points[0]).toBeObj({x:30,y:40});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.offset).toBe(shp.points[0]);
      expect(shp.offset).toBeObj({x:30,y:40});
    });
    it("Should remove pt2", ()=>{
      const shp = createShape([{x:1,y:2},{x:3,y:4},{x:5,y:6}]);
      expect(shp.points.length).toBe(3);
      expect(shp.node.points.length).toBe(3);
      shp.removePoint(2);
      expect(shp.points.length).toBe(2);
      expect(shp.node.points.length).toBe(2);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.points[0]).toBeObj({x:1,y:2});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.points[1]).toBeObj({x:3,y:4});
      expect(shp.points[1]._pntRef).toBeObj(shp.node.points[1]);
    });
  })
});

registerTestSuite("testLine", ()=>{
  const createShape = (point1, point2, className)=>{
    glbl.shapes.push(new Line({
      parentElement: glbl.parentElement,
      point1, point2, className
    }));
    return glbl.shapes[glbl.shapes.length-1];
  };

  afterEach(glbl.cleanup);

  describe("Test line construction", ()=>{
    it("Should construct with default [0,0]", ()=>{
      const shp = createShape();
      expect(shp.points.length).toBe(2);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.x1.baseVal.value).toBe(0);
      expect(shp.node.y1.baseVal.value).toBe(0);
      expect(shp.points[1]).toBeObj({x:0,y:0});
      expect(shp.node.x2.baseVal.value).toBe(0);
      expect(shp.node.y2.baseVal.value).toBe(0);
    });
    it("Should construct with default endpoint", ()=>{
      const shp = createShape({x:1,y:2});
      expect(shp.points.length).toBe(2);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.x1.baseVal.value).toBe(1);
      expect(shp.node.y1.baseVal.value).toBe(2);
      expect(shp.points[1]).toBeObj({x:0,y:0});
      expect(shp.node.x2.baseVal.value).toBe(0);
      expect(shp.node.y2.baseVal.value).toBe(0);
    });
    it("Should construct with points", ()=>{
      const shp = createShape({x:1,y:2},{x:3,y:4});
      expect(shp.points.length).toBe(2);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.x1.baseVal.value).toBe(1);
      expect(shp.node.y1.baseVal.value).toBe(2);
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.x2.baseVal.value).toBe(3);
      expect(shp.node.y2.baseVal.value).toBe(4);
    });
    it("Should construct with className", ()=>{
      const shp = createShape({x:1,y:2},{x:3,y:4}, "testClassName");
      expect(shp.node.className.baseVal).toBe("testClassName");
      expect(document.querySelector(".testClassName")).toBe(shp.node);
    });
    it("Should construct with ref to pnt", ()=>{
      const pt0 = new Point({x:1,y:2});
      const shp = createShape(pt0, {x:3,y:4});
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.x1.baseVal.value).toBe(1);
      expect(shp.node.y1.baseVal.value).toBe(2);
      pt0.point = [10,20];
      expect(shp.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.x1.baseVal.value).toBe(10);
      expect(shp.node.y1.baseVal.value).toBe(20);
    });
    it("Should construct without overwriting pnt _lenRef", ()=>{
      const pt0 = new Point({x:1,y:2});
      const shp0 = createShape(pt0, {x:3,y:4}),
            shp1 = createShape(pt0, {x:3,y:4});
      expect(shp0.points[0]).toBeObj({x:1,y:2});
      expect(shp0.node.x1.baseVal.value).toBe(1);
      expect(shp0.node.y1.baseVal.value).toBe(2);
      expect(shp1.points[0]).toBeObj({x:1,y:2});
      expect(shp1.node.x1.baseVal.value).toBe(1);
      expect(shp1.node.y1.baseVal.value).toBe(2);
      pt0.point = [10,20];
      expect(shp0.points[0]).toBeObj({x:10,y:20});
      expect(shp0.node.x1.baseVal.value).toBe(10);
      expect(shp0.node.y1.baseVal.value).toBe(20);
      expect(shp1.points[0]).toBeObj({x:10,y:20});
      expect(shp1.node.x1.baseVal.value).toBe(10);
      expect(shp1.node.y1.baseVal.value).toBe(20);
    })
  });

  describe("Test line move", ()=>{
    it("Should move p1", ()=>{
      const pt1 = new Point({x:1,y:2}),
            pt2 = new Point({x:3,y:4});
      const shp = createShape(pt1, pt2);
      pt1.point = [10,20]
      expect(shp.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.x1.baseVal.value).toBe(10);
      expect(shp.node.y1.baseVal.value).toBe(20);
      expect(shp.points[1]).toBeObj({x:3,y:4});
      expect(shp.node.x2.baseVal.value).toBe(3);
      expect(shp.node.y2.baseVal.value).toBe(4);
    });
    it("Should move p2", ()=>{
      const pt1 = new Point({x:1,y:2}),
            pt2 = new Point({x:3,y:4});
      const shp = createShape(pt1, pt2);
      pt2.point = [30,40]
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.x1.baseVal.value).toBe(1);
      expect(shp.node.y1.baseVal.value).toBe(2);
      expect(shp.points[1]).toBeObj({x:30,y:40});
      expect(shp.node.x2.baseVal.value).toBe(30);
      expect(shp.node.y2.baseVal.value).toBe(40);
    });
    it("should scale by 2", ()=>{
      const shp = createShape({x:1,y:2},{x:3,y:4});
      shp.scale({factor:2})
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.node.x1.baseVal.value).toBe(1);
      expect(shp.node.y1.baseVal.value).toBe(2);
      expect(shp.points[1]).toBeObj({x:5,y:6});
      expect(shp.node.x2.baseVal.value).toBe(5);
      expect(shp.node.y2.baseVal.value).toBe(6);
    });
  });

  describe("Test point1 and point2", ()=>{
    it("Should get pt1", ()=>{
      const pt = new Point({x:1,x:2});
      const line = createShape(pt);
      expect(line.point1).toBe(pt);
    });
    it("Should get pt2", ()=>{
      const pt = new Point({x:1,x:2});
      const line = createShape(undefined, pt);
      expect(line.point2).toBe(pt);
    });
    it("Should move pt1", ()=>{
      const line = createShape();
      line.point1 = [1,2]
      expect(line.point1).toBeObj({x:1,y:2});
    });
    it("Should move pt2", ()=>{
      const line = createShape();
      line.point2 = {x:1,y:2};
      expect(line.point2).toBeObj({x:1,y:2});
    });
    it("Should move pt1 with a point", ()=>{
      const pt = new Point({x:1,y:2});
      const line = createShape();
      line.point1 = pt;
      expect(line.point1).toBeObj({x:1,y:2});
    });
    it("Should move pt2 with a point", ()=>{
      const pt = new Point({x:1,y:2});
      const line = createShape();
      line.point2 = pt;
      expect(line.point2).toBeObj({x:1,y:2});
    });
  })
});

registerTestSuite("testText", ()=>{
  const createLine = (point1, point2, className)=>{
    glbl.shapes.push(new Line({
      parentElement: glbl.parentElement,
      point1, point2, className
    }));
    return glbl.shapes[glbl.shapes.length-1];
  };

  const createText = (point, text, className, followPoint, offsetX, offsetY) => {
    glbl.shapes.push(new Text({
      parentElement: glbl.parentElement,
      point, text, className, followPoint,
      offsetX, offsetY
    }));
    return glbl.shapes[glbl.shapes.length-1];
  }

  afterEach(glbl.cleanup);

  describe("Test Text construction", ()=>{
    it("Should construct with {0,0} as default", ()=>{
      const shp = createText();
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.x.baseVal[0].value).toBe(0);
      expect(shp.node.y.baseVal[0].value).toBe(0);
    });
    it("Should construct at {2,4}", ()=>{
      const shp = createText({x:2,y:4});
      expect(shp.points[0]).toBeObj({x:2,y:4});
      expect(shp.node.x.baseVal[0].value).toBe(2);
      expect(shp.node.y.baseVal[0].value).toBe(4);
    });
    it("Should construct with className", ()=>{
      const shp = createText({x:2,y:4}, "", "testClassName");
      expect(shp.node.className.baseVal).toBe("testClassName");
      expect(document.querySelector(".testClassName")).toBe(shp.node);
    });
    it("Should construct with text", ()=>{
      const txt = "testText <span>html</span>";
      const shp = createText({x:2,y:4}, txt);
      expect(shp.node.innerHTML).toEqual(txt);
      expect(shp.text).toEqual(txt);
    });
    it("Should construct with followPoint", ()=>{
      const pt = new Point({x:10, y:20});
      const shp = createText({x:2,y:4}, undefined, undefined, pt);
      expect(shp.offset).toBeObj({x:10,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(20);
    });
    it("Should construct with followPoint offsetX", ()=>{
      const pt = new Point({x:10, y:20});
      const shp = createText({x:2,y:4}, undefined, undefined, pt, 5);
      expect(shp.offset).toBeObj({x:15,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      pt.point = [11,21];
      expect(shp.offset).toBeObj({x:16,y:21});
      expect(shp.node.x.baseVal[0].value).toBe(16);
      expect(shp.node.y.baseVal[0].value).toBe(21);
    });
    it("Should construct with followPoint offsetY", ()=>{
      const pt = new Point({x:10, y:20});
      const shp = createText({x:2,y:4}, undefined, undefined,
                              pt, undefined, 5);
      expect(shp.offset).toBeObj({x:10,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(25);
      pt.point = [11,21];
      expect(shp.offset).toBeObj({x:11,y:26});
      expect(shp.node.x.baseVal[0].value).toBe(11);
      expect(shp.node.y.baseVal[0].value).toBe(26);
    });
  });
  describe("Test Text set/get text", ()=>{
    it("Should set text", ()=>{
      const shp = createText();
      expect(shp.text).toEqual("");
      shp.text = "test";
      expect(shp.text).toEqual("test");
      expect(shp.node.innerHTML).toEqual("test");
    });
    it("Should get text from construction", ()=>{
      const shp = createText({x:2,y:4}, "testConstruct");
      expect(shp.text).toEqual("testConstruct");
      expect(shp.node.innerHTML).toEqual("testConstruct");
    });
    it("Should set text, and replace old text", ()=>{
      const shp = createText();
      expect(shp.text).toEqual("");
      shp.text = "test";
      expect(shp.text).toEqual("test");
      expect(shp.node.innerHTML).toEqual("test");
      shp.text = "test2";
      expect(shp.text).toEqual("test2");
      expect(shp.node.innerHTML).toEqual("test2");
    });
  });
  describe("Test Text followPoint", ()=>{
    it("Should move when setting followPoint", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      expect(shp.points[0]).toBeObj({x:2,y:4});
      shp.followPoint = point;
      expect(shp.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      point.point = [15,25];
      expect(shp.points[0]).toBeObj({x:15,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(25);
    });
    it("Should followPoint with offsetX", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      expect(shp.points[0]).toBeObj({x:2,y:4});
      shp.followPoint = point;
      shp.followOffsetX = 5;
      expect(shp.points[0]).toBeObj({x:15,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      point.point = [15,25];
      expect(shp.points[0]).toBeObj({x:20,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(20);
      expect(shp.node.y.baseVal[0].value).toBe(25);
    });
    it("Should followPoint with offsetY", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      expect(shp.points[0]).toBeObj({x:2,y:4});
      shp.followOffsetY = 5;
      shp.followPoint = point;
      expect(shp.points[0]).toBeObj({x:10,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(25);
      point.point = [15,25];
      expect(shp.points[0]).toBeObj({x:15,y:30});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(30);
    });
    it("Should only update offsetX", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      shp.followOffsetX = 5;
      shp.followPoint = point;
      expect(shp.points[0]).toBeObj({x:15,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      shp.followOffsetX = 10;
      expect(shp.points[0]).toBeObj({x:20,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(20);
      expect(shp.node.y.baseVal[0].value).toBe(20);
    });
    it("Should only update offsetY", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      shp.followOffsetY = 5;
      shp.followPoint = point;
      expect(shp.points[0]).toBeObj({x:10,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(25);
      shp.followOffsetY = 10;
      expect(shp.points[0]).toBeObj({x:10,y:30});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(30);
    });
    it("Should clear followPoint", ()=>{
      const point = new Point({x:10,y:20});
      const shp = createText({x:2,y:4});
      shp.followPoint = point;
      expect(shp.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      point.point = [15,25];
      expect(shp.points[0]).toBeObj({x:15,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(25);
      shp.followPoint = null;
      point.point = [20,30];
      expect(shp.points[0]).toBeObj({x:15,y:25});
      expect(shp.node.x.baseVal[0].value).toBe(15);
      expect(shp.node.y.baseVal[0].value).toBe(25);
    });
    it("Should clear old followPoint", ()=>{
      const point = new Point({x:10,y:20}),
            point2 = new Point({x:20,y:30});
      const shp = createText({x:2,y:4},"","",point);
      expect(shp.points[0]).toBeObj({x:10,y:20});
      expect(shp.node.x.baseVal[0].value).toBe(10);
      expect(shp.node.y.baseVal[0].value).toBe(20);
      shp.followPoint = point2;
      expect(shp.points[0]).toBeObj({x:20,y:30});
      expect(shp.node.x.baseVal[0].value).toBe(20);
      expect(shp.node.y.baseVal[0].value).toBe(30);
      point.point = [15,25];
      expect(shp.points[0]).toBeObj({x:20,y:30});
      expect(shp.node.x.baseVal[0].value).toBe(20);
      expect(shp.node.y.baseVal[0].value).toBe(30);
      point2.point = [40,50];
      expect(shp.points[0]).toBeObj({x:40,y:50});
      expect(shp.node.x.baseVal[0].value).toBe(40);
      expect(shp.node.y.baseVal[0].value).toBe(50);
    });
  });
});

registerTestSuite("testGroup", ()=>{
  const createGroup = (args)=>{
    args.parentElement = glbl.parentElement;
    glbl.shapes.push(new Group(args));
    return glbl.shapes[glbl.shapes.length-1];
  };
  const createShape = (args)=>{
    args.parentElement = glbl.parentElement;
    glbl.shapes.push(new Polygon(args));
    return glbl.shapes[glbl.shapes.length-1];
  };

  afterEach(glbl.cleanup);

  describe("Test Group construction", ()=>{
    it("Should construct with default [0,0]", ()=>{
      const shp = createGroup({});
      expect(shp.points.length).toBe(1);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.size).toBeInstanceOf(SizeRect);
      expect(shp.size.height).toBe(0);
      expect(shp.size.width).toBe(0);
      expect(shp.size.centerPoint).toBeObj({x:0,y:0});
      expect(shp.node.className.baseVal).toBe('');
    });
    it("Should construct with  [1,2]", ()=>{
      const shp = createGroup({centerPoint:{x:1,y:2},width:10,height:20,className:"testClassName"});
      expect(shp.points.length).toBe(1);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.size).toBeInstanceOf(SizeRect);
      expect(shp.size.height).toBe(20);
      expect(shp.size.width).toBe(10);
      expect(shp.size.centerPoint).toBeObj({x:1,y:2});
      expect(shp.node.className.baseVal).toBe('testClassName');
    });
    it("Should construct with Point(1,2)", ()=>{
      const pt = new Point({x:1,y:2});
      const shp = createGroup({centerPoint:pt});
      expect(shp.points.length).toBe(1);
      expect(shp.points[0]).toBeObj({x:1,y:2});
      expect(shp.size).toBeInstanceOf(SizeRect);
      expect(shp.size.centerPoint).toBeObj({x:1,y:2});
      pt.point = [10,20];
      expect(shp.size.centerPoint).toBeObj({x:10,y:20});
      expect(shp.offset).toBeObj({x:10,y:20});
    });
    it("Should construct with a shape", ()=>{
      const shp2 = createShape({points:[{x:-10,y:-10},{x:10,y:10}]});
      const shp = createGroup({shapes:[shp2]});
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
    });
  });

  describe("Test shapes", ()=>{
    it("Should add shape", ()=>{
      const shp = createGroup({});
      const shp2 = createShape({points:[{x:-10,y:-10},{x:10,y:10}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
    });
    it("Should move shapes", ()=>{
      const shp = createGroup({});
      const shp2 = createShape({points:[{x:-10,y:-10},{x:10,y:10}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
      expect(shp2.offset).toBeObj({x:-10,y:-10});
      shp.move([20,30]);
      expect(shp2.offset).toBeObj({x:10,y:20});

    });
    it("Should scale shapes", ()=>{
      const shp = createGroup({width:10,height:20});
      const shp2 = createShape({points:[{x:-10,y:-20},{x:10,y:20}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
      expect(shp2.offset).toBeObj({x:-10,y:-20});
      shp.scale({factor:2});
      expect(shp2.offset).toBeObj({x:-20,y:-40});
      expect(shp.size.width).toBe(20);
      expect(shp.size.height).toBe(40);
      expect(shp2.points[0]).toBeObj({x:-20,y:-40});
      expect(shp2.points[1]).toBeObj({x:20,y:40});
    });
    it("Should rotate shapes", ()=>{
      const shp = createGroup({width:10,height:20});
      const shp2 = createShape({points:[{x:-10,y:-20},{x:10,y:20}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
      expect(shp2.offset).toBeObj({x:-10,y:-20});
      shp.angle = 180
      expect(shp2.offset).toBeObj({x:10,y:20}, 2);
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
      expect(shp2.points[0]).toBeObj({x:10,y:20}, 2);
      expect(shp2.points[1]).toBeObj({x:-10,y:-20}, 2);
    });
    it("Should flip shapes at X", ()=>{
      const shp = createGroup({width:10,height:20});
      const shp2 = createShape({points:[{x:-10,y:-20},{x:10,y:20}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
      expect(shp2.offset).toBeObj({x:-10,y:-20});
      shp.flipX();
      expect(shp2.offset).toBeObj({x:10,y:-20});
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
      expect(shp2.points[0]).toBeObj({x:10,y:-20});
      expect(shp2.points[1]).toBeObj({x:-10,y:20});
    });
    it("Should flip shapes at Y", ()=>{
      const shp = createGroup({width:10,height:20});
      const shp2 = createShape({points:[{x:-10,y:-20},{x:10,y:20}]});
      expect(shp.shapes.length).toBe(0);
      shp.addShape(shp2);
      expect(shp.shapes.length).toBe(1);
      expect(shp.shapes[0]).toBe(shp2);
      expect(shp2.offset).toBeObj({x:-10,y:-20});
      shp.flipY();
      expect(shp2.offset).toBeObj({x:-10,y:20});
      expect(shp.size.width).toBe(10);
      expect(shp.size.height).toBe(20);
      expect(shp2.points[0]).toBeObj({x:-10,y:20});
      expect(shp2.points[1]).toBeObj({x:10,y:-20});
    });
  })
});