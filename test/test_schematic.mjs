"use strict";

import { Polygon } from "../elements/base.mjs";
import { Point } from "../elements/point.mjs";
import { ComponentBase, Net } from "../elements/schematic.mjs";
import { Wire } from "../elements/schematic.mjs";

const glbl = {
  shapes: [],
  parentElement: document.querySelector("svg"),
  point: null,
  cleanup: ()=>{
    if (glbl.shapes.length) {
      for(const shp of glbl.shapes)
        glbl.parentElement.removeChild(shp.node);
      glbl.shapes = [];
      glbl.point = null;
    }
  }
};

registerTestSuite("testNet", ()=>{
  afterEach(()=>{
    Net._netNames = {__cnt:0};
    glbl.cleanup();
  });

  const createNet = ({startPnt, endPnt, betweenPnts, className})=>{
    /*glbl.shapes.push(new Wire({
      parentElement: glbl.parentElement,
      startPnt, endPnt, betweenPnts,
      className
    }));
    return glbl.shapes[glbl.shapes.length-1];*/
  };

  describe("Test net construction", ()=>{
    it("Should construct with autogen name and generic typ", ()=>{
      const net = new Net({});
      expect(net.name).toBe("net0_generic");
      expect(net.type).toBe("generic");
      expect(net.net.gen).toBe("autoGen");
    });
    it("Should construct with namePrefix and type", ()=>{
      const net = new Net({name:"mynet-VCC",type:"electric"});
      expect(net.name).toBe("mynet-VCC");
      expect(net.type).toBe("electric");
      expect(net.net.gen).toBe("userGen");
    });
    it("Should allow double name with differing type", ()=>{
      const net1 = new Net({name:"mynet-VCC",type:"elec"});
      const net2 = new Net({name:"mynet-VCC",type:"pneu"});
      expect(net1.name).toBe("mynet-VCC");
      expect(net1.type).toBe("elec");
      expect(net1.net.gen).toBe("userGen");
      expect(net2.name).toBe("mynet-VCC");
      expect(net2.type).toBe("pneu");
      expect(net2.net.gen).toBe("userGen");
    });
    it("Should not allow double name same type", ()=>{
      const net1 = new Net({name:"mynet-VCC",type:"elec"});
      expect(()=>{
        new Net({name:"mynet-VCC",type:"elec"});
      }).toThrow();
    });
    it("Should create points", ()=>{
      const points = [new Point({x:1,y:2}), new Point({x:3,y:4})];
      const net = new Net({points})
      expect(net.points.length).toBe(2);
      expect(net.points[0]).toBe(points[0]);
      expect(net.points[1]).toBe(points[1]);
    });
  });

  describe("Test points", ()=>{
    it("Should add points", ()=>{
      const points = [new Point({x:1,y:2}), new Point({x:3,y:4})];
      const net = new Net({})
      expect(net.points.length).toBe(0);
      net.points = points;
      expect(net.points.length).toBe(2);
      expect(net.points[0]).toBe(points[0]);
      expect(net.points[1]).toBe(points[1]);
    });
    it("Should remove points", ()=>{
      const points = [new Point({x:1,y:2}), new Point({x:3,y:4})];
      const net = new Net({points})
      expect(net.points.length).toBe(2);
      net.points = null;
      expect(net.points.length).toBe(0);
      net.points = points;
      expect(net.points.length).toBe(2);
      net.points = 0;
      expect(net.points.length).toBe(0);
    });
  });

  describe("Test canConnect",()=>{
    it("Should test non net owned point", ()=>{
      const pt0 = new Point({x:0,y:1}),
            pt1 = new Point({x:3,y:4}),
            pt2 = new Point({x:5,y:6});
      const net = new Net({points:[pt1,pt2]});
      expect(net.canConnect(pt0)).toBe(false);
    });
    it("Should test a net owned point, contained net", ()=>{
      const net0 = new Net({});
      const owner = {_nets:[net0]};
      const pt0 = new Point({x:0,y:1, owner}),
            pt1 = new Point({x:3,y:4}),
            pt2 = new Point({x:5,y:6});
      net0.points = [pt0];

      const net1 = new Net({points:[pt1,pt2]});
      expect(net1.canConnect(pt0)).toBe(false);
      pt0.point = [3,4];
      expect(net1.canConnect(pt0)).toBe(true);
      pt0.point = [3,3];
      expect(net1.canConnect(pt0)).toBe(false);
    });
    it("Should test a net owned point, contained net my point", ()=>{
      const net0 = new Net({}), net1 = new Net({});
      const owner0 = {_nets:[net0]}, owner1 = {_nets:[net1]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:0,y:1, owner:owner0}),
            pt2 = new Point({x:0,y:1, owner:owner1});
      net0.points = [pt0, pt1]; net1.points = [pt2];
      expect(net1.canConnect(pt0)).toBe(true);
      expect(net1.canConnect(pt1)).toBe(true);
      expect(net1.canConnect(pt2)).toBe(false);
    });
  });

  describe("Test connect", ()=>{
    it("Should reject, non net point", ()=>{
      const pt0 = new Point({x:0,y:1}),
            pt1 = new Point({x:3,y:4}),
            pt2 = new Point({x:5,y:6});
      const net = new Net({points:[pt1,pt2]});
      expect(net.connect(pt0)).toBe(false);
    });
    it("Should reject, my point", ()=>{
      const net0 = new Net({});
      const owner0 = {_nets:[net0]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:0,y:1, owner:owner0});
      net0.points = [pt0, pt1];
      expect(net0.connect(pt0)).toBe(false);
      expect(net0.connect(pt1)).toBe(false);
    });
    it("Should connect 0,1", ()=>{
      const net0 = new Net({}), net1 = new Net({});
      const owner0 = {_nets:[net0]}, owner1 = {_nets:[net1]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:1,y:2, owner:owner0}),
            pt2 = new Point({x:0,y:1, owner:owner1});
      net0.points = [pt0, pt1]; net1.points = [pt2];
      expect(net0.connect(pt2)).toBe(true);
      expect(pt0.followPoint).toBe(pt2);
    });
    it("Should connect 1,2", ()=>{
      const net0 = new Net({}), net1 = new Net({});
      const owner0 = {_nets:[net0]}, owner1 = {_nets:[net1]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:1,y:2, owner:owner0}),
            pt2 = new Point({x:1,y:2, owner:owner1});
      net0.points = [pt0, pt1]; net1.points = [pt2];
      expect(net0.connect(pt2)).toBe(true);
      expect(pt1.followPoint).toBe(pt2);
    });
  });

  describe("Test disconnect", ()=>{
    it("Should fail, no followPoint", ()=>{
      const net0 = new Net({}), net1 = new Net({});
      const owner0 = {_nets:[net0]}, owner1 = {_nets:[net1]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:1,y:2, owner:owner0}),
            pt2 = new Point({x:1,y:2, owner:owner1});
      net0.points = [pt0, pt1]; net1.points = [pt2];
      expect(net0.disconnect(pt2)).toBe(false);
    });
    it("Should fail, not connected to me", ()=>{
      const net0 = new Net({}),
            net1 = new Net({}),
            net2 = new Net({});
      const owner0 = {_nets:[net0]},
            owner1 = {_nets:[net1]},
            owner2 = {_nets:[net2]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:1,y:2, owner:owner1}),
            pt2 = new Point({x:1,y:2, owner:owner2}),
            pt3 = new Point({x:1,y:2, owner:owner2});
      net0.points = [pt0, pt1]; net1.points = [pt3]
      expect(net1.connect(pt2)).toBe(true);
      expect(net0.disconnect(pt2)).toBe(false);
      expect(net2.disconnect(pt2)).toBe(false);
      expect(net1.disconnect(pt2)).toBe(true);
    });
    it("Should succeed", ()=>{
      const net0 = new Net({}), net1 = new Net({});
      const owner0 = {_nets:[net0]}, owner1 = {_nets:[net1]};
      const pt0 = new Point({x:0,y:1, owner:owner0}),
            pt1 = new Point({x:1,y:2, owner:owner0}),
            pt2 = new Point({x:1,y:2, owner:owner1});
      net0.points = [pt0, pt1]; net1.points = [pt2];
      expect(net0.connect(pt2)).toBe(true);
      expect(net0.disconnect(pt2)).toBe(true);
    });
  });

  describe("Test connections", ()=>{
    it("Should get this nets end points", ()=>{

    });
    it("Should get this nets and connected nets end points", ()=>{

    });
  });
});

registerTestSuite("testComponentBase", ()=>{
  afterEach(glbl.cleanup);

  const createComp = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new ComponentBase(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  const createShape = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Polygon(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should contruct with defaults", ()=>{
      const comp = createComp({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(0);
      expect(comp.size.width).toBe(0);
      expect(comp.size.height).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(0);
      expect(comp.node.className.baseVal).toBe("");
    });
    it("Should contruct with className", ()=>{
      const comp = createComp({className:"testClassName"});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(0);
      expect(comp.node.className.baseVal).toBe("testClassName");
      expect(document.querySelector(".testClassName")).toBe(comp.node);
    });
    it("Should contruct with width & height 100,200", ()=>{
      const comp = createComp({width: 100, height:200});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.size.width).toBe(100);
      expect(comp.size.height).toBe(200);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(0);
    });
    it("Should contruct with centerPoint as {1,2}", ()=>{
      const comp = createComp({centerPoint:{x:1,y:2}});
      expect(comp.size.centerPoint).toBeObj({x:1,y:2});
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(1);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(2);
    });
    it("Should contruct with centerPoint as Point", ()=>{
      const centerPoint = new Point({x:1,y:2});
      const comp = createComp({centerPoint});
      expect(comp.size.centerPoint).toBeObj({x:1,y:2});
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(1);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(2);
      centerPoint.point = [3,4];
      expect(comp.size.centerPoint).toBeObj({x:3,y:4});
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(3);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(4);
    });
    it("Should contruct with centerPoint with nets", ()=>{
      const nets = [new Net({}), new Net({})];
      const comp = createComp({centerPoint:{x:1,y:2},nets});
      expect(comp.size.centerPoint).toBeObj({x:1,y:2});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0]).toBe(nets[0]);
      expect(comp.nets[1]).toBe(nets[1]);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(1);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(2);
    });
    it("Should construct with name 'test'", ()=>{
      const comp = createComp({name:"test", height:10, width:20});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("test");
      expect(comp.size.width).toBe(20);
      expect(comp.size.height).toBe(10);
    })
  });

  describe("Test nets property", ()=>{
    it("Should get default net", ()=>{
      const comp = createComp({});
      expect(comp.nets.length).toBe(0);
    });
    it("Should have a net attached", ()=>{
      const nets = [new Net({}), new Net({})];
      const comp = createComp({nets});
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0]).toBe(nets[0]);
      expect(comp.nets[1]).toBe(nets[1]);
    });
  })

  describe("Test shapes", ()=>{
    it("Should get all shapes for component", ()=>{
      const comp = createComp({});
      expect(comp.shapes.length).toBe(0);
      const shp = createShape({points:[{x:20,y:30}]});
      comp.addShape(shp);
      expect(comp.shapes[0]).toBe(shp);
      expect(comp.shapes.length).toBe(1);
    });
  });

  describe("Test state", ()=>{
    it("Should get state", ()=>{
      const comp = createComp({});
      expect(comp.state).toBe(0);
    });
    it("Should set state", ()=>{
      const comp = createComp({});
      expect(comp.state).toBe(0);
      comp.state = 2;
      expect(comp.state).toBe(2);
    });
    it("Should call _stateChanged()", ()=>{
      const comp = createComp({});
      let called = 0, newState = -1;
      comp._stateChanged = (s)=>{ called++; newState=s;}
      expect(called).toBe(0);
      expect(newState).toBe(-1);
      comp.state = {customObj:true};
      expect(called).toBe(1);
      expect(newState).toBeObj({customObj:true});
      comp.state = {another:1};
      expect(called).toBe(2);
      expect(newState).toBeObj({another:1});
    })
  });
})

registerTestSuite("testWire", ()=>{
  afterEach(glbl.cleanup);

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