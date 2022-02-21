"use strict";

import { Point } from "../elements/point.mjs";
import { Rotation } from "../elements/rotation.mjs";
import { BaseShape } from "../elements/base.mjs";

const glbl = {
  shapes: [],
  parentElement: document.querySelector("svg")
};

registerTestSuite("testRotation", ()=>{
  afterEach(()=>{
    if (glbl.shapes.length) {
      while(glbl.shapes.length)
        glbl.parentElement.removeChild(glbl.shapes.pop().node);
    }
  });

  const createShape = (points = [{x:1,y:2}, {x:10,y:20}])=>{
    const shp = document.createElementNS('http://www.w3.org/2000/svg', "line");
    const lens = glbl.lengths = [shp.x1,shp.y1,shp.x2,shp.y2];
    for(let i = 0; i < lens.length; ++i) {
      const prop = i % 2 == 0 ? 'x' : 'y'
      lens[i].baseVal.value = points[Math.floor(i/2)][prop];
    }
    glbl.point = new Point({svgLenXRef: shp.x1.baseVal, svgLenYRef: shp.y1.baseVal});
    const pts = [glbl.point, new Point({svgLenYRef:shp.y2.baseVal, svgLenXRef: shp.x2.baseVal})];
    glbl.shapes.push(new BaseShape({
      parentElement: glbl.parentElement, rootElement: shp,
      points: pts
    }));
    return glbl.shapes[glbl.shapes.length-1];
  };


  describe("Test Rotation constructor", ()=>{
    it("Should construct a rotation with zero as default", ()=>{
      const rot = new Rotation({});
      expect(rot).toBeObj({x:0,y:0});
      expect(rot.angle).toBe(0);
    });
    it("Should construct a rotation with non zero x rest default", ()=>{
      const rot = new Rotation({x:1});
      expect(rot).toBeObj({x:1,y:0});
      expect(rot.angle).toBe(0);
    });
    it("Should construct a rotation with non zero y rest default", ()=>{
      const rot = new Rotation({y:2});
      expect(rot).toBeObj({x:0,y:2});
      expect(rot.angle).toBe(0);
    });
    it("Should construct a rotation with x,y and angle", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2});
      expect(rot.angle).toBe(3);
    });
    it("Should construct a rotation with a point", ()=>{
      const rot = new Rotation({point:{x:1,y:2}});
      expect(rot).toBeObj({x:1,y:2});
      expect(rot.angle).toBe(0);
    });
    it("Should construct a rotation with a point instance", ()=>{
      const point = new Point({x:1,y:2});
      const rot = new Rotation({point});
      expect(rot).toBeObj({x:1,y:2});
      expect(rot.angle).toBe(0);
      point.point = [10,20];
      expect(rot.x)
    });
    it("Should construct a rotation with owner", ()=>{
      const owner = {};
      const rot = new Rotation({owner});
      expect(rot.owner).toBe(owner);
    });
    it("Should construct a rotation with onChangeCallback", ()=>{
      let rotCb, angle, called = 0;
      const onChangeCallback = (r)=> { called++; rotCb = r; angle = r.angle}
      const rot = new Rotation({onChangeCallback});
      expect(rotCb).toBe(undefined);
      expect(angle).toBe(undefined);
      rot.x = 1;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
      expect(angle).toBe(0);
      rot.angle = 3;
      expect(called).toBe(2);
      expect(angle).toBe(3);
    });
  });

  describe("Test x,y,angle properties", ()=>{
    it("Should test get x", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      expect(rot.x).toBe(1);
    });
    it("Should test set x", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      rot.x = 10;
      expect(rot).toBeObj({x:10,y:2,angle:3});
    });
    it("Should test get y", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      expect(rot.y).toBe(2);
    });
    it("Should test set y", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      rot.y = 10;
      expect(rot).toBeObj({x:1,y:10,angle:3});
    });
    it("Should test get angle", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      expect(rot.angle).toBe(3);
    });
    it("Should test set angle", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      rot.angle = 90;
      expect(rot).toBeObj({x:1,y:2,angle:90});
    });
    it("Should test get point", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot.point).toBeObj({x:1,y:2});
    });
    it("Should test set point {x,y}", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      rot.point = {x:10,y:20};
      expect(rot).toBeObj({x:10,y:20,angle:3});
    });
    it("Should test set point [x,y]", ()=>{
      const rot = new Rotation({x:1,y:2,angle:3});
      expect(rot).toBeObj({x:1,y:2,angle:3});
      rot.point = [10,20];
      expect(rot).toBeObj({x:10,y:20,angle:3});
    });
  });

  describe("Test onChangeCallback", ()=>{
    let called = 0, rotCb;
    const onChangeCallback = (r)=>{ called++; rotCb=r; }
    afterEach(()=>{ called=0; rotCb=undefined; });

    it("Should call onChangeCallback on x", ()=>{
      const rot = new Rotation({onChangeCallback});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.x = 10;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
    });
    it("Should call onChangeCallback on y", ()=>{
      const rot = new Rotation({onChangeCallback});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.y = 10;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
    });
    it("Should call onChangeCallback on point", ()=>{
      const rot = new Rotation({onChangeCallback});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.point = [10,12];
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
      rot.point = {x:1,y:2};
      expect(called).toBe(2);
    });
    it("Should call onChangeCallback on angle", ()=>{
      const rot = new Rotation({onChangeCallback});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.angle = 75;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
    });
    it("Should test addChangeCallback", ()=>{
      const rot = new Rotation({});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.x = 10;
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.addChangeCallback(onChangeCallback);
      rot.x = 20;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
    });
    it("Should test removeChangeCallback", ()=>{
      const rot = new Rotation({onChangeCallback});
      expect(called).toBe(0);
      expect(rotCb).toBe(undefined);
      rot.angle = 75;
      expect(called).toBe(1);
      expect(rotCb).toBe(rot);
      rot.removeChangeCallback(onChangeCallback);
      rot.angle = 90;
      expect(called).toBe(1);
    });
  });

  describe("Test rotateShape", ()=>{
    it("Should add rotateShape", ()=>{
      const rot = new Rotation({});
      const shp = createShape([{x:100,y:0},{x:0,y:100}]);
      rot.addRotateShape(shp);
      rot.angle = 90;
      expect(shp.points[0]).toBeObj({x:0,y:-100}, 1);
      expect(shp.points[1]).toBeObj({x:100,y:0}, 1);
    });
    it("Should remove rotateShape", ()=>{
      const rot = new Rotation({});
      const shp = createShape([{x:100,y:0},{x:0,y:100}]);
      rot.addRotateShape(shp);
      rot.angle = 90;
      expect(shp.points[0]).toBeObj({x:0,y:-100},1);
      expect(shp.points[1]).toBeObj({x:100,y:0},1);
      rot.removeRotateShape(shp);
      rot.angle = -90;
      expect(shp.points[0]).toBeObj({x:0,y:-100},1);
      expect(shp.points[1]).toBeObj({x:100,y:0},1);
    });
    it("Should add 2 rotateShapes", ()=>{
      const rot = new Rotation({});
      const shp1 = createShape([{x:100,y:0},{x:0,y:100}]);
      const shp2 = createShape([{x:0,y:200},{x:200,y:0}]);
      rot.addRotateShape(shp1);
      rot.addRotateShape(shp2);
      rot.angle = 90;
      expect(shp1.points[0]).toBeObj({x:0,y:-100},1);
      expect(shp1.points[1]).toBeObj({x:100,y:0},1);
      expect(shp2.points[0]).toBeObj({x:200,y:0},1);
      expect(shp2.points[1]).toBeObj({x:0,y:-200},1);
    });
    it("Should add 2 rotateShapes from constructor", ()=>{
      const shp1 = createShape([{x:100,y:0},{x:0,y:100}]);
      const shp2 = createShape([{x:0,y:200},{x:200,y:0}]);
      const rot = new Rotation({rotateShapes:[shp1,shp2]});
      rot.angle = 90;
      expect(shp1.points[0]).toBeObj({x:0,y:-100},1);
      expect(shp1.points[1]).toBeObj({x:100,y:0},1);
      expect(shp2.points[0]).toBeObj({x:200,y:0},1);
      expect(shp2.points[1]).toBeObj({x:0,y:-200},1);
    });
    it("Should should rotate the shape forward and backward", ()=>{
      const shp = createShape([{x:100,y:0},{x:0,y:100}]);
      const rot = new Rotation({rotateShapes:[shp]});
      rot.angle = 90;
      expect(shp.points[0]).toBeObj({x:0,y:-100},1);
      expect(shp.points[1]).toBeObj({x:100,y:0},1);
      rot.angle = 0;
      expect(shp.points[0]).toBeObj({x:100,y:0},1);
      expect(shp.points[1]).toBeObj({x:0,y:100},1);
    });
    it("Should should rotate the shape with offset center", ()=>{
      const shp = createShape([{x:100,y:0},{x:0,y:100}]);
      const rot = new Rotation({x:100,y:100,rotateShapes:[shp]});
      rot.angle = 90;
      expect(shp.points[0]).toBeObj({x:0,y:100},1);
      expect(shp.points[1]).toBeObj({x:100,y:200},1);
      rot.angle = 0;
      expect(shp.points[0]).toBeObj({x:100,y:0},1);
      expect(shp.points[1]).toBeObj({x:0,y:100},1);
    });
  })
});