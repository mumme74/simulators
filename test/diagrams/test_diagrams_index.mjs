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

  const createWave = ({offset, className, dataPoints, xScale, yScale})=>{
    return glbl.shape = new Wave({
      parentElement: glbl.parentElement,
      dataPoints, xScale, yScale,
      className, offset
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
    it("Should construct with className", ()=>{
      const shp = createWave({className: "testClassName"});
      expect(document.querySelector(".testClassName"));
      expect(shp.node.className.baseVal).toBe("testClassName")
    });
    it("Should construct with 1 datapoint", ()=>{
      const shp = createWave({dataPoints:[10]});
      expect(shp.dataPoints).toBeObj([10]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:10,y:0});
    });
    it("Should construct with 1 datapoint and offset 10,20", ()=>{
      const shp = createWave({dataPoints:[10], offset:{x:10,y:20}});
      expect(shp.dataPoints).toBeObj([10]);
      expect(shp.offset).toBeObj({x:10,y:20});
      expect(shp.points[0]).toBeObj({x:20,y:20});
    });
    it("Should construct with 2 datapoints and xScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20],xScale:2});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:20,y:0});
      expect(shp.points[1]).toBeObj({x:40,y:1});
    });
    it("Should construct with 2 datapoints and yScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20],yScale:2});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:0,y:0});
      expect(shp.points[0]).toBeObj({x:10,y:0});
      expect(shp.points[1]).toBeObj({x:20,y:2});
    });
    it("Should construct with 2 datapoints and xScale 2 offset 15,20", ()=>{
      const shp = createWave({dataPoints:[10,20],xScale:2,offset:{x:15,y:20}});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:15,y:20});
      expect(shp.points[0]).toBeObj({x:35,y:20});
      expect(shp.points[1]).toBeObj({x:55,y:21});
    });
    it("Should construct with 2 datapoints and yScale 20 offset 15,20", ()=>{
      const shp = createWave({dataPoints:[10,20],yScale:20,offset:{x:15,y:20}});
      expect(shp.dataPoints).toBeObj([10,20]);
      expect(shp.offset).toBeObj({x:15,y:20});
      expect(shp.points[0]).toBeObj({x:25,y:20});
      expect(shp.points[1]).toBeObj({x:35,y:40});
    });
  });

  describe("Test edit datapoints",()=>{
    it("Should get dataPoints", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      expect(shp.dataPoints).toBeObj([10,20,30,40]);
    });
    it("Should move pt0", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      expect(shp.points[0]).toBeObj({x:10,y:0});
      expect(shp.node.points[0]).toBeObj({x:10,y:0});
      pnts[0] = 11;
      expect(shp.points[0]).toBeObj({x:11,y:0});
      expect(shp.node.points[0]).toBeObj({x:11,y:0});
    });
    it("Should move pt1 and xScale 2", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40], xScale:2});
      const pnts = shp.dataPoints;
      expect(shp.points[0]).toBeObj({x:20,y:0});
      expect(shp.node.points[0]).toBeObj({x:20,y:0});
      pnts[0] = 11;
      expect(shp.points[0]).toBeObj({x:22,y:0});
      expect(shp.node.points[0]).toBeObj({x:22,y:0});
    });
    it("Should move pt3 and yScale 20", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40], yScale:20});
      const pnts = shp.dataPoints;
      expect(shp.points[3]).toBeObj({x:40,y:60});
      expect(shp.node.points[3]).toBeObj({x:40,y:60});
      pnts[3] = 11;
      expect(shp.points[3]).toBeObj({x:11,y:60});
      expect(shp.node.points[3]).toBeObj({x:11,y:60});
    });
    it("Should move all 4 points", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      for (let i = 0; i < pnts.length; ++i)
        pnts[i] = pnts[i] +1;
      expect(shp.dataPoints).toBeObj([11,21,31,41]);
      expect(shp.points[0]).toBeObj({x:11,y:0});
      expect(shp.points[1]).toBeObj({x:21,y:1});
      expect(shp.points[2]).toBeObj({x:31,y:2});
      expect(shp.points[3]).toBeObj({x:41,y:3});
    });
    it("Should add a point", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.push(50);
      expect(shp.points.length).toBe(5);
      expect(shp.points[0]).toBeObj({x:10,y:0});
      expect(shp.points[1]).toBeObj({x:20,y:1});
      expect(shp.points[2]).toBeObj({x:30,y:2});
      expect(shp.points[3]).toBeObj({x:40,y:3});
      expect(shp.points[4]).toBeObj({x:50,y:4});
    });
    it("Should remove a point at end", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.pop();
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:10,y:0});
      expect(shp.points[1]).toBeObj({x:20,y:1});
      expect(shp.points[2]).toBeObj({x:30,y:2});
    });
    it("should remove a point at middle", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.splice(2,1);
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:10,y:0});
      expect(shp.points[1]).toBeObj({x:20,y:1});
      expect(shp.points[2]).toBeObj({x:40,y:2});
    });
    it("Should remove a point at begin", ()=>{
      const shp = createWave({dataPoints:[10,20,30,40]});
      const pnts = shp.dataPoints;
      pnts.shift();
      expect(shp.points.length).toBe(3);
      expect(shp.points[0]).toBeObj({x:20,y:0});
      expect(shp.points[1]).toBeObj({x:30,y:1});
      expect(shp.points[2]).toBeObj({x:40,y:2});
    });
  });
});