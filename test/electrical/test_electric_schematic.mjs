"use strict";

import { Point } from "../../elements/point.mjs"
import { Net } from "../../elements/schematic.mjs";
import { Polygon } from "../../elements/base.mjs";
import {
  ElectricComponentBase,
  ElectricNet,
  Fuse
} from "../../elements/electrical/electric_schematic.mjs";

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

registerTestSuite("testElectricNet", ()=>{
  afterEach(()=>{
    Net._netNames = {__cnt:0};
    glbl.cleanup();
  });

  Net._netNames = {__cnt:0};

  describe('Test construction', ()=>{
    it("Should test defaults", ()=>{
      const net = new ElectricNet({});
      expect(net.name).toBe("el-net0_electric");
      expect(net.type).toBe("electric");
      expect(net.net.gen).toBe("autoGen");
    });
    it("Should test namePrefix", ()=>{
      const net = new ElectricNet({namePrefix:"myprefix"});
      expect(net.name).toBe("myprefix0_electric");
      expect(net.type).toBe("electric");
      expect(net.net.gen).toBe("autoGen");
    });
    it("Should test points", ()=>{
      const points = [
        new Point({x:1,y:2}),new Point({x:3,y:4}),new Point({x:5,y:6})];
      const net = new ElectricNet({points});
      expect(net.name).toBe("el-net0_electric");
      expect(net.type).toBe("electric");
      expect(net.net.gen).toBe("autoGen");
      expect(net.points[0]).toBeObj(points[0]);
      expect(net.points[1]).toBeObj(points[1]);
      expect(net.points[2]).toBeObj(points[2]);
    });
    it("Should test name", ()=>{
      const net = new ElectricNet({name:"test"});
      expect(net.name).toBe("test");
      expect(()=>{
        new ElectricNet({name:"test"});
      }).toThrow();
      expect(()=>{
        new ElectricNet({name:"test2"})
      }).toNotThrow();
    });
  });
});

registerTestSuite("testElectricComponentBase", ()=>{
  afterEach(glbl.cleanup);

  const createComp = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new ElectricComponentBase(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should contruct with defaults", ()=>{
      const comp = createComp({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(1);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(0);
      expect(comp.size.height).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(0);
      expect(comp.node.className.baseVal).toBe("_electric_component");
    });
    it("Should contruct with options", ()=>{
      const nets = [new ElectricNet({}),new ElectricNet({})];
      const comp = createComp({
        centerPoint:{x:1,y:2}, name:"test",className:"_electric_component testClassName",
        nets, width:40, height:30
      });
      expect(comp.size.centerPoint).toBeObj({x:1,y:2});
      expect(comp.name).toBe("test");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0]).toBe(nets[0]);
      expect(comp.nets[1]).toBe(nets[1]);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(30);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(1);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(2);
      expect(comp.node.className.baseVal).toBe("_electric_component testClassName");
    });
  });
});

registerTestSuite("testFuse", ()=>{
  afterEach(glbl.cleanup);

  const createFuse = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Fuse(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createFuse({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toEqualOrGt(50);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(0);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(0);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toEqualOrGt(3);
    });
    it("Should construct with options", ()=>{
      const comp = createFuse({centerPoint:{x:50,y:50},name:"fuse",className:"nofill"});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("fuse");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(50);
      expect(comp.node.transform.baseVal[0].matrix.e).toBe(50);
      expect(comp.node.transform.baseVal[0].matrix.f).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toEqualOrGt(3);
    });
  });

  describe("Test broken", ()=>{
    it("Should be intact", ()=>{
      const fuse = createFuse({});
      expect(fuse.broken).toBe(false);
    });
    it("Should test set broken and reset", ()=>{
      const fuse = createFuse({centerPoint:{x:50,y:50}});
      expect(fuse.broken).toBe(false);
      fuse.broken = true;
      expect(fuse.broken).toBe(true);
      expect(fuse.terminal1.point2.y).toNotBe(fuse.size.centerPoint.y);
      expect(fuse.terminal2.point2.y).toNotBe(fuse.size.centerPoint.y);
      fuse.broken = false;
      expect(fuse.broken).toBe(false);
      expect(fuse.terminal1.point2.y).toBe(fuse.size.centerPoint.y);
      expect(fuse.terminal2.point2.y).toBe(fuse.size.centerPoint.y);
    });
    it("Should trip and set fuse as broken", ()=>{
      const fuse = createFuse({});
      expect(fuse.broken).toBe(false);
      fuse.currentThrough(1.5);
      expect(fuse.broken).toBe(true);
    });
  });
});