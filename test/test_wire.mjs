"use strict";

import { Point } from "../elements/point.mjs";
import { Wire } from "../elements/wire.mjs";

const glbl = {
  shapes: [],
  parentElement: document.querySelector("svg"),
  point: null,
};

registerTestSuite("testWire", ()=>{
  afterEach(()=>{
    if (glbl.shapes.length) {
      for(const shp of glbl.shapes)
        glbl.parentElement.removeChild(shp.node);
      glbl.shapes = [];
      glbl.point = null;
    }
  });

  const createWire = ({startPnt, endPnt, betweenPnts, className})=>{
    glbl.shapes.push(new Wire({
      parentElement: glbl.parentElement,
      startPnt, endPnt, betweenPnts,
      className
    }));
    return glbl.shapes[glbl.shapes.length-1];
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
    it("Should construct horizontal with 2 attached points", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:100, y:2});
      const wire = createWire({startPnt:pt0,endPnt:pt1});
      expect(wire.points.length).toBe(2);
      expect(wire.points[0]).toBeObj({x:1,y:2});
      expect(wire.startPnt.followPoint).toBe(pt0);
      expect(wire.points[1]).toBeObj({x:100,y:2});
      expect(wire.endPnt.followPoint).toBe(pt1);
    });
    it("Should construct vertical with 2 attached points", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:1, y:200});
      const wire = createWire({startPnt:pt0,endPnt:pt1});
      expect(wire.points.length).toBe(2);
      expect(wire.points[0]).toBeObj({x:1,y:2});
      expect(wire.startPnt.followPoint).toBe(pt0);
      expect(wire.points[1]).toBeObj({x:1,y:200});
      expect(wire.endPnt.followPoint).toBe(pt1);
    });
    it("Should construct horizontal reversed", ()=>{
      const pt0 = new Point({x:100,y:2}),
            pt1 = new Point({x:1, y:2});
      const wire = createWire({startPnt:pt0,endPnt:pt1});
      expect(wire.points.length).toBe(2);
      expect(wire.points[0]).toBeObj({x:100,y:2});
      expect(wire.startPnt.followPoint).toBe(pt0);
      expect(wire.points[1]).toBeObj({x:1,y:2});
      expect(wire.endPnt.followPoint).toBe(pt1);
    });
    it("Should construct horizontal with 2 attached points", ()=>{
      const pt0 = new Point({x:1,y:200}),
            pt1 = new Point({x:1, y:2});
      const wire = createWire({startPnt:pt0,endPnt:pt1});
      expect(wire.points.length).toBe(2);
      expect(wire.points[0]).toBeObj({x:1,y:200});
      expect(wire.startPnt.followPoint).toBe(pt0);
      expect(wire.points[1]).toBeObj({x:1,y:2});
      expect(wire.endPnt.followPoint).toBe(pt1);
    });
    it("Should construct with a auto betweenPoint x", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:30}});
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:30,y:20});
      expect(wire.endPnt).toBeObj({x:30,y:30});
    });
    it("Should construct with a auto betweenPoint y", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:20,y:40}});
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:10,y:40});
      expect(wire.endPnt).toBeObj({x:20,y:40});
    });
    it("Should construct with a betweenPoints", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:100, y:20}),
            pt2 = new Point({x:50,y:10});
      const wire = createWire({startPnt:pt0,endPnt:pt1, betweenPnts:[pt2]});
      expect(wire.points.length).toBe(5);
      expect(wire.points[0]).toBeObj({x:1,y:2});
      expect(wire.startPnt.followPoint).toBe(pt0);
      expect(wire.points[1]).toBeObj({x:50,y:2});
      expect(wire.points[2]).toBeObj({x:50,y:10});
      expect(wire.points[3]).toBeObj({x:50,y:20});
      expect(wire.points[4]).toBeObj({x:100,y:20});
      expect(wire.endPnt.followPoint).toBe(pt1);
    });
  });

  describe("Test endpoints manipulation", ()=>{
    it("Should auto edit betweenPoint x from startPoint", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:30}});
      wire.startPnt.y -= 5;
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:15});
      expect(wire.points[1]).toBeObj({x:30,y:15});
      expect(wire.endPnt).toBeObj({x:30,y:30});
    });
    it("Should auto edit betweenPoint y from startPoint", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:20,y:40}});
      wire.startPnt.x -= 5;
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:5,y:20});
      expect(wire.points[1]).toBeObj({x:5,y:40});
      expect(wire.endPnt).toBeObj({x:20,y:40});
    });
    it("Should auto edit betweenPoint x from endPoint", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:19,y:30}});
      wire.endPnt.y += 5;
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:10,y:35});
      expect(wire.endPnt).toBeObj({x:19,y:35});
    });
    it("Should auto edit betweenPoint y from endPoint", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:22,y:30}});
      wire.endPnt.x += 5;
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:27,y:20});
      expect(wire.endPnt).toBeObj({x:27,y:30});
    });
    it("Should auto edit betweenPoint x from startPoint pinned betweenPnt", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:30},
                               betweenPnts:[{x:30,y:20}]});
      wire.startPnt.y -= 5;
      expect(wire.points.length).toBe(4); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:15});
      expect(wire.points[1]).toBeObj({x:30,y:15});
      expect(wire.points[2]).toBeObj({x:30,y:20});
      expect(wire.endPnt).toBeObj({x:30,y:30});
    });
  });

  describe("Test betweePoints manipulation", ()=>{
    it("Should add a betweenPnt", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:20}});
      wire.betweenPnts = [{x:20,y:0}];
      expect(wire.points.length).toBe(5);
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:20,y:20});
      expect(wire.points[2]).toBeObj({x:20,y:0});
      expect(wire.points[2].pinned).toEqual(true);
      expect(wire.points[3]).toBeObj({x:20,y:20});
      expect(wire.endPnt).toBeObj({x:30,y:20});
    });
    it("Should remove betweenPnt", ()=>{
      const wire = createWire({
        startPnt:{x:10,y:0}, endPnt:{x:30,y:20},
        betweenPnts: [{x:20,y:10}]
      });
      wire.betweenPnts = [];
      expect(wire.points.length).toBe(3); // middle point automatically inserted
      expect(wire.startPnt).toBeObj({x:10,y:0});
      expect(wire.points[1]).toBeObj({x:10,y:20});
      expect(!!wire.points[1].pinned).toEqual(false);
      expect(wire.endPnt).toBeObj({x:30,y:20});
    });
    it("Should move betweenPnt", ()=>{
      const middlePnt = new Point({x:20,y:0});
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:20},
        betweenPnts: [middlePnt]
      });
      expect(wire.points.length).toBe(5);
      middlePnt.x += 5;
      expect(wire.points.length).toBe(5);
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:25,y:20});
      expect(wire.points[2]).toBeObj({x:25,y:0});
      expect(wire.points[2].pinned).toEqual(true);
      expect(wire.points[3]).toBeObj({x:25,y:20});
      expect(wire.endPnt).toBeObj({x:30,y:20});
    });
    it("Should add 3 betweenPnts", ()=>{
      const wire = createWire({startPnt:{x:10,y:20}, endPnt:{x:30,y:20}});
      wire.betweenPnts = [{x:20,y:20},{x:20,y:0},{x:20,y:20}];
      expect(wire.points.length).toBe(5);
      expect(wire.startPnt).toBeObj({x:10,y:20});
      expect(wire.points[1]).toBeObj({x:20,y:20});
      expect(wire.points[1].pinned).toEqual(true);
      expect(wire.points[2]).toBeObj({x:20,y:0});
      expect(wire.points[2].pinned).toEqual(true);
      expect(wire.points[3]).toBeObj({x:20,y:20});
      expect(wire.points[3].pinned).toEqual(true);
      expect(wire.endPnt).toBeObj({x:30,y:20});
    });
  });

  describe("Test connections", ()=>{
    it("Should get endPnts of this wire and connected points", ()=>{
      const pt0 = new Point({x:1,y:2}), pt1 = new Point({x:3,y:4});
      const wire0 = createWire({startPnt:pt0, endPnt:pt1});
      const conns = wire0.connections();
      expect(conns.length).toBe(2);
      expect(conns[0]).toBe(pt0);
      expect(conns[1]).toBe(pt1);
    });
    it("Should have not connection", ()=>{
      // wire has no connections
      const wire = createWire({startPnt:{x:1,y:2}, endPnt:{x:3,y:4}});
      const conns = wire.connections();
      expect(conns.length).toBe(0);
    });
    it("Should have 1 connection", ()=>{
      const pt0 = new Point({x:1,y:2});
      const wire = createWire({startPnt:pt0, endPnt:{x:3,y:4}});
      const conns = wire.connections();
      expect(conns.length).toBe(1);
      expect(conns[0]).toBe(pt0);
    });
    it("Should connect 2 wires in series", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:5,y:6});
      const wire0 = createWire({startPnt:pt0, endPnt:{x:3,y:4}}),
            wire1 = createWire({startPnt:wire0.endPnt, endPnt:pt1});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections();
      expect(conns0.length).toBe(2);
      expect(conns1.length).toBe(2);
      expect(conns0[0]).toBe(pt0);
      expect(conns0[1]).toBe(pt1);
      expect(conns1[0]).toBe(pt0);
      expect(conns1[1]).toBe(pt1);
    });
    it("Should connect 2 wires in parallell", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:5,y:6});
      const wire0 = createWire({startPnt:pt0, endPnt:pt1}),
            wire1 = createWire({startPnt:wire0.endPnt, endPnt:wire0.startPnt});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections();
      expect(conns0.length).toBe(2);
      expect(conns1.length).toBe(2);
      expect(conns0[0]).toBe(pt0);
      expect(conns0[1]).toBe(pt1);
      expect(conns1[0]).toBe(pt1);
      expect(conns1[1]).toBe(pt0);
    });
    it("Should connect 3 wires in series", ()=>{
      const pt0 = new Point({x:1,y:2}),
            pt1 = new Point({x:5,y:6});
      const wire0 = createWire({startPnt:pt0}),
            wire1 = createWire({startPnt:wire0.endPnt}),
            wire2 = createWire({startPnt:wire1.endPnt, endPnt: pt1});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections(),
            conns2 = wire2.connections();
      expect(conns0.length).toBe(2);
      expect(conns1.length).toBe(2);
      expect(conns2.length).toBe(2);
      expect(conns0[0]).toBe(pt0);
      expect(conns0[1]).toBe(pt1);
      expect(conns1[0]).toBe(pt0);
      expect(conns1[1]).toBe(pt1);
      expect(conns2[0]).toBe(pt0);
      expect(conns2[1]).toBe(pt1);
    });
    it("Should connect 3 wires in Y pattern", ()=>{
      const pt0 = new Point({x:1,y:2, owner:0}),
            pt1 = new Point({x:5,y:6, owner:1}),
            pt2 = new Point({x:7,y:8, owner:2});
      const wire0 = createWire({startPnt:pt0}),
            wire1 = createWire({startPnt:wire0.endPnt, endPnt:pt1}),
            wire2 = createWire({startPnt:wire0.endPnt, endPnt:pt2});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections(),
            conns2 = wire2.connections();
      expect(conns0.length).toBe(3);
      expect(conns1.length).toBe(3);
      expect(conns2.length).toBe(3);
      expect(conns0).toContain(pt0);
      expect(conns0).toContain(pt1);
      expect(conns0).toContain(pt2);
      expect(conns1).toContain([pt0,pt1,pt2]);
      expect(conns2).toContain([pt0,pt1,pt2]);
    });
    it("Should connect 3 wires in N pattern", ()=>{
      const pt0 = new Point({x:1,y:2, owner:0}),
            pt1 = new Point({x:5,y:6, owner:1}),
            pt2 = new Point({x:7,y:8, owner:2});
      const wire0 = createWire({startPnt:pt0}),
            wire1 = createWire({startPnt:wire0.startPnt, endPnt:pt1}),
            wire2 = createWire({startPnt:wire1.endPnt, endPnt:pt2});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections(),
            conns2 = wire2.connections();
      expect(conns0).toContain([pt0,pt1,pt2]);
      expect(conns1).toContain([pt0,pt1,pt2]);
      expect(conns2).toContain([pt0,pt1,pt2]);
    });
    it("Should connect 3 wires in H pattern", ()=>{
      const pt0 = new Point({x:1,y:2, owner:0}),
            pt1 = new Point({x:2,y:12, owner:1}),
            pt2 = new Point({x:10,y:2, owner:2}),
            pt3 = new Point({x:11,y:12, owner:3});
      const wire0 = createWire({startPnt:pt0, endPnt:pt1}),
            wire1 = createWire({startPnt:pt2, endPnt:pt3}),
            wire2 = createWire({startPnt:wire0.points[1],
                                endPnt:wire1.points[1]});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections(),
            conns2 = wire2.connections();
      expect(conns0.length).toBe(4);
      expect(conns1.length).toBe(4);
      expect(conns2.length).toBe(4);
      expect(conns0).toContain([pt0,pt1,pt2,pt3]);
      expect(conns1).toContain([pt0,pt1,pt2,pt3]);
      expect(conns2).toContain([pt0,pt1,pt2,pt3]);
    });
    it("Should connect 4 wires in M pattern", ()=>{
      const pt0 = new Point({x:1,y:2, owner:0}),
            pt1 = new Point({x:1,y:12, owner:1}),
            pt2 = new Point({x:5,y:5, owner:2}),
            pt3 = new Point({x:10,y:2, owner:3}),
            pt4 = new Point({x:10,y:12, owner:4});
      const wire0 = createWire({startPnt:pt0, endPnt:pt1}),
            wire1 = createWire({startPnt:pt0, endPnt:pt2}),
            wire2 = createWire({startPnt:pt2, endPnt:pt4}),
            wire3 = createWire({startPnt:pt3, endPnt:pt4});
      const conns0 = wire0.connections(),
            conns1 = wire1.connections(),
            conns2 = wire2.connections(),
            conns3 = wire3.connections();
      expect(conns0.length).toBe(5);
      expect(conns1.length).toBe(5);
      expect(conns2.length).toBe(5);
      expect(conns3.length).toBe(5);
      expect(conns0).toContain([pt0,pt1,pt2,pt3,pt4]);
      expect(conns1).toContain([pt0,pt1,pt2,pt3,pt4]);
      expect(conns2).toContain([pt0,pt1,pt2,pt3,pt4]);
      expect(conns3).toContain([pt0,pt1,pt2,pt3,pt4]);
    });
  })
});