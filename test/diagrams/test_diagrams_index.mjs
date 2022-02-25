"use strict";

import { Wave } from '../../elements/diagrams/index.mjs';

const glbl = {
  shape: null,
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testWave", ()=>{
  afterEach(()=>{
    if (glbl.shape) {
      glbl.parentElement.removeChild(glbl.shape.node);
      glbl.shape = null;
      glbl.point = null;
    }
  });

  const createWave = ({offset, classList, dataPoints, xScale, yScale})=>{
    return glbl.shape = new Wave({
      parentElement: glbl.parentElement,
      dataPoints, xScale, yScale,
      classList, offset
    });
  };

  describe("Test Wave constructor", ()=>{
    it("Should construct with no datapoints", ()=>{
      const shp = createWave({});
      expect(shp.dataPoints.length).toBe(0);
      expect(shp.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.points[0]).toBeObj({x:0,y:0});
      expect(shp.node.className.baseVal).toBe("");
    });
    it("Should construct with classList", ()=>{
      const shp = createWave({classList: ["testClassList"]});
      expect(document.querySelector(".testClassList"));
      expect(shp.node.className.baseVal).toBe("testClassList")
    });
    it("Should construct with 1 datapoint", ()=>{
      const shp = createWave({dataPoints:[10]});
      expect(shp.dataPoints).toBeObj([10]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.points[0]._pntRef).toBeObj(shp.node.points[0]);
    });
    it("Should construct with 1 datapoint and offset 10,20", ()=>{
      const shp = createWave({dataPoints:[10], offset:{x:10,y:20}});
      expect(shp.dataPoints).toBeObj([10]);
      expect(shp.offset).toBeObj({x:10,y:20});
      expect(shp.points[0]).toBeObj({x:10,y:10});
    });
    it("Should construct with 2 datapoints and xScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20],xScale:2});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.points[1]).toBeObj({x:2,y:-20});
    });
    it("Should construct with 2 datapoints and yScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20],yScale:2});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:0,y:-20});
      expect(shp.points[1]).toBeObj({x:1,y:-40});
    });
    it("Should construct with 2 datapoints and xScale 2 offset 15,20", ()=>{
      const shp = createWave({dataPoints:[10,20],xScale:2,offset:{x:15,y:20}});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:15,y:20});
      expect(shp.points[0]).toBeObj({x:15,y:10});
      expect(shp.points[1]).toBeObj({x:17,y:0});
    });
    it("Should construct with 2 datapoints and yScale 20 offset 15,20", ()=>{
      const shp = createWave({dataPoints:[10,20],yScale:20,offset:{x:15,y:20}});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:15,y:20});
      expect(shp.points[0]).toBeObj({x:15,y:-180});
      expect(shp.points[1]).toBeObj({x:16,y:-380});
    });
  });

  describe("Test edit datapoints",()=>{
    it("Should get dataPoints", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      expect(shp.dataPoints).toBeObj([10,20,30,40]);
    });
    it("Should set datapoints update", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      shp.dataPoints = [11,21,31,41];
      expect(shp.dataPoints).toBeObj([11,21,31,41]);
      expect(shp.points[0]).toBeObj({x:0,y:-11});
      expect(shp.points[1]).toBeObj({x:1,y:-21});
      expect(shp.points[2]).toBeObj({x:2,y:-31});
      expect(shp.points[3]).toBeObj({x:3,y:-41});
    });
    it("Should set datapoints insert", ()=>{
      const shp = createWave({dataPoints:[10,20]});
      shp.dataPoints = [11,21,31,41];
      expect(shp.dataPoints).toBeObj([11,21,31,41]);
      expect(shp.points[0]).toBeObj({x:0,y:-11});
      expect(shp.points[1]).toBeObj({x:1,y:-21});
      expect(shp.points[2]).toBeObj({x:2,y:-31});
      expect(shp.points[3]).toBeObj({x:3,y:-41});
    });
    it("Should set datapoints delete", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      shp.dataPoints = [11];
      expect(shp.points.length).toBe(1);
      expect(shp.dataPoints).toBeObj([11]);
      expect(shp.points[0]).toBeObj({x:0,y:-11});
    });
    it("Should move pt0", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.node.points[0]).toBeObj({x:0,y:-10});
      const svgPnt = shp.node.points[0];
      expect(shp.points[0]._pntRef).toBeObj(svgPnt);
      pnts[0] = 11;
      expect(shp.node.points[0]).toBeObj(svgPnt);
      expect(shp.points[0]).toBeObj({x:0,y:-11});
      expect(shp.node.points[0]).toBeObj({x:0,y:-11});
    });
    it("Should move pt1 and xScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40], xScale:2});
      const pnts = shp.dataPoints;
      expect(shp.points[1]).toBeObj({x:2,y:-20});
      expect(shp.node.points[1]).toBeObj({x:2,y:-20});
      const svgPnt = shp.node.points[0];
      expect(shp.points[1]._pntRef).toBeObj(svgPnt);
      pnts[1] = 11;
      expect(shp.node.points[0]).toBeObj(svgPnt);
      expect(shp.points[1]).toBeObj({x:2,y:-11});
      expect(shp.node.points[1]).toBeObj({x:2,y:-11});
    });
    it("Should move pt3 and yScale 20", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40], yScale:20});
      const pnts = shp.dataPoints;
      expect(shp.points[3]).toBeObj({x:3,y:-800});
      expect(shp.node.points[3]).toBeObj({x:3,y:-800});
      pnts[3] = 11;
      expect(shp.points[3]).toBeObj({x:3,y:-220});
      expect(shp.node.points[3]).toBeObj({x:3,y:-220});
    });
    it("Should move all 4 points", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      for (let i = 0; i < pnts.length; ++i)
        pnts[i] = pnts[i] +1;
      expect(shp.dataPoints).toBeObj([11,21,31,41]);
      expect(shp.points[0]).toBeObj({x:0,y:-11});
      expect(shp.points[1]).toBeObj({x:1,y:-21});
      expect(shp.points[2]).toBeObj({x:2,y:-31});
      expect(shp.points[3]).toBeObj({x:3,y:-41});
    });
    it("Should add a point", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.push(50);
      expect(shp.points.length).toBe(5);
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.points[1]).toBeObj({x:1,y:-20});
      expect(shp.points[2]).toBeObj({x:2,y:-30});
      expect(shp.points[3]).toBeObj({x:3,y:-40});
      expect(shp.points[4]).toBeObj({x:4,y:-50});
    });
    it("Should remove a point at end", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.pop();
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.points[1]).toBeObj({x:1,y:-20});
      expect(shp.points[2]).toBeObj({x:2,y:-30});
    });
    it("should remove a point at middle", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.splice(2,1);
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:0,y:-10});
      expect(shp.points[1]).toBeObj({x:1,y:-20});
      expect(shp.points[2]).toBeObj({x:2,y:-40});
    });
    it("Should remove a point at begin", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.shift();
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:0,y:-20});
      expect(shp.points[1]).toBeObj({x:1,y:-30});
      expect(shp.points[2]).toBeObj({x:2,y:-40});
    });
  });
});