"use strict";

import { Point } from "../../point.mjs"
import { Net } from "../../schematic.mjs";
import {
  BatteryCell,
  ElectricComponentBase,
  ElectricNet,
  Fuse,
  Lamp,
  Switch,
  Resistor,
  Capacitor,
  Solenoid,
  Diode,
  BipolarTransistor,
  Relay,
} from "../../electrical/electric_schematic.mjs";

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
      expect(comp.node.className.baseVal).toBe("_electric_component");
    });
    it("Should contruct with options", ()=>{
      const nets = [new ElectricNet({}),new ElectricNet({})];
      const comp = createComp({
        centerPoint:{x:1,y:2}, name:"test",classList:["_electric_component", "testClassList"],
        nets, width:40, height:30
      });
      expect(comp.size.centerPoint).toBeObj({x:1,y:2});
      expect(comp.name).toBe("test");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0]).toBe(nets[0]);
      expect(comp.nets[1]).toBe(nets[1]);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(30);
      expect(comp.node.className.baseVal).toBe("_electric_component testClassList");
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
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toEqualOrGt(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(3);
    });
    it("Should construct with options", ()=>{
      const comp = createFuse({centerPoint:{x:50,y:50},name:"fuse",classList:["nofill"]});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("fuse");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(3);
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

registerTestSuite("testSwitch", ()=>{
  afterEach(glbl.cleanup);

  const createSwitch = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Switch(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createSwitch({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(5);
    });
    it("Should construct with options", ()=>{
      const comp = createSwitch({centerPoint:{x:50,y:50},open:false,name:"switch",classList:["nofill"]});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("switch");
      expect(comp.open).toBe(false);
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(5);
    });
  })

  describe("Test open/close", ()=>{
    it("Should be open", ()=>{
      const comp = createSwitch({});
      expect(comp.open).toBe(true);
    });
    it("Should be closed", ()=>{
      const comp = createSwitch({open:false});
      expect(comp.open).toBe(false);
    });
    it("Should test set open and closed", ()=>{
      const comp = createSwitch({centerPoint:{x:50,y:50}});
      expect(comp.open).toBe(true);
      comp.open = false;
      expect(comp.open).toBe(false);
      expect(comp.closed).toBe(true);
      expect(comp.contact.point2.x).toBe(comp.terminal2.point2.x);
      comp.closed = false;
      expect(comp.closed).toBe(false);
      expect(comp.open).toBe(true);
      expect(comp.contact.point2.x).toNotBe(comp.terminal2.point2.x);
    });
  });
});

registerTestSuite("testLamp", ()=>{
  afterEach(glbl.cleanup);

  const createLamp = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Lamp(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createLamp({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(35);
      expect(comp.size.height).toBe(50);
      expect(comp.rating).toBe(5);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(6);
    });
    it("Should construct with options", ()=>{
      const comp = createLamp({centerPoint:{x:50,y:50},broken:true,name:"lamp",classList:["nofill"], rating:10});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("lamp");
      expect(comp.broken).toBe(true);
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(35);
      expect(comp.size.height).toBe(50);
      expect(comp.rating).toBe(10);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(6);
    });
  });
  describe("Test broken", ()=>{
    it("Should be intact", ()=>{
      const comp = createLamp({});
      expect(comp.broken).toBe(false);
    });
    it("Should test set broken and reset", ()=>{
      const comp = createLamp({centerPoint:{x:50,y:50}});
      expect(comp.broken).toBe(false);
      comp.currentThrough(comp.rating/12);
      expect(+comp.lightNode.node.style.opacity).toBe(1);
      comp.broken = true;
      expect(comp.broken).toBe(true);
      expect(+comp.lightNode.node.style.opacity).toBe(0);
      comp.currentThrough(comp.rating/12);
      expect(+comp.lightNode.node.style.opacity).toBe(0);
      comp.broken = false;
      expect(comp.broken).toBe(false);
      expect(+comp.lightNode.node.style.opacity).toBe(0);
      comp.currentThrough (comp.rating / 24);
      expect(+comp.lightNode.node.style.opacity).toBe(0.5);
    });
    it("Should trip and set comp as broken", ()=>{
      const comp = createLamp({});
      comp.currentThrough(comp.rating/12);
      expect(+comp.lightNode.node.style.opacity).toBe(1);
      comp.currentThrough(comp.rating/12+0.1);
      expect(comp.broken).toBe(true);
      expect(+comp.lightNode.node.style.opacity).toBe(0);
      comp.currentThrough(comp.rating/12);
      expect(+comp.lightNode.node.style.opacity).toBe(0);
    });
  });
})

registerTestSuite("testBattery", ()=>{
  afterEach(glbl.cleanup);


  const createCell = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new BatteryCell(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createCell({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(20);
      expect(comp.nominalVolt).toBe(2);
      expect(comp.soc).toBe(1);
      expect(comp.capacity).toBe(100);
      expect(comp.resistance).toBe(0.01);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(4);
    });
    it("Should construct with options", ()=>{
      const comp = createCell({soc:0.5,capacity:20,
        centerPoint:{x:50,y:50},name:"cell",
        classList:["nofill"], voltage:3.7, resistance:0.1
      });
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("cell");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(20);
      expect(comp.nominalVolt).toBe(3.7);
      expect(comp.soc).toBe(0.5);
      expect(comp.capacity).toBe(20);
      expect(comp.resistance).toBe(0.1);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(4);
    });
  });

  describe("Test feed", ()=>{
    it("Should get unloaded voltage", ()=>{
      const comp = createCell({});
      expect(comp.feed()).toBeObj({feeds:2.1, draws:0}, 2);
    });
    it("Should get lower with soc 50%", ()=>{
      const comp = createCell({soc:0.5});
      expect(comp.feed()).toBeObj({feeds:2.0, draws:0}, 2);
    });
    it("Should get lower with soc 0%", ()=>{
      const comp = createCell({soc:0});
      expect(comp.feed()).toBeObj({feeds:1.9, draws:0}, 2);
    });
    it("Should get lower volt when drawing amps", ()=>{
      const comp = createCell({resistance:1,soc:0.5});
      expect(comp.feed(1)).toBeObj({feeds:1, draws:-1}, 2);
    });
    it("Should get lower volt when drawing amps charged", ()=>{
      const comp = createCell({resistance:1,soc:1.0});
      expect(comp.feed(1)).toBeObj({feeds:1.05, draws:-1.05}, 2);
    });
    it("Should decrease soc", ()=>{
      const comp = createCell({resistance:1,soc:1.0,capacity:1});
      expect(comp.feed(1, 0, 30*60*1000)).toBeObj({feeds:1.05, draws:-1.05}, 2);
      expect(comp.soc).toBe(0.5, 1);
      expect(comp.feed(1, 0, 30*60*1000)).toBeObj({feeds:1.0, draws:-1.0}, 2);
      expect(comp.soc).toBe(0, 2);
    });
    it("Should increase soc", ()=>{
      const comp = createCell({resistance:1,soc:0,capacity:1});
      expect(comp.feed(1, 2.1, 30*60*10000)).toBeObj({feeds:-0.1, draws:0.1}, 2);
      expect(comp.soc).toBe(0.5, 2);
      expect(comp.feed(1, 2.2, 30*60*10000)).toBeObj({feeds:-0.1, draws:0.1}, 2);
      expect(comp.soc).toBe(1, 2);
    });
  });
});

registerTestSuite("testResistor", ()=>{
  afterEach(glbl.cleanup);

  const createResistor = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Resistor(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createResistor({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toEqualOrGt(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(3);
      expect(comp.resistance).toBe(1);
    });
    it("Should construct with options", ()=>{
      const comp = createResistor({centerPoint:{x:50,y:50},name:"resistor",classList:["nofill"], resistance:10});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("resistor");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(3);
      expect(comp.resistance).toBe(10);
    });
  });
});

registerTestSuite("testCapacitor", ()=>{
  afterEach(glbl.cleanup);

  const createCapacitor = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Capacitor(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createCapacitor({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(25);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.resistance).toBe(0.05);
      expect(comp.capacitance).toBe(0.001);
      expect(comp.polarized).toBe(false);
    });
    it("Should construct with options", ()=>{
      const comp = createCapacitor({centerPoint:{x:50,y:50},
        name:"capacitor",classList:["nofill"], polarized:true, capacitance:0.01, resistance:10});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("capacitor");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(40);
      expect(comp.size.height).toBe(33);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.resistance).toBe(10);
      expect(comp.capacitance).toBe(0.01);
      expect(comp.polarized).toBe(true);
    });
  });
});


registerTestSuite("testSolenoid", ()=>{
  afterEach(glbl.cleanup);

  const createSolenoid = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Solenoid(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createSolenoid({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(30);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.resistance).toBe(100);
      expect(comp.inductance).toBe(0.001);
    });
    it("Should construct with options", ()=>{
      const comp = createSolenoid({centerPoint:{x:50,y:50},
        name:"capacitor",classList:["nofill"], inductance:0.01, resistance:10});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("capacitor");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(30);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.resistance).toBe(10);
      expect(comp.inductance).toBe(0.01);
      comp.move([100,89])
      comp.move([250,89])
      comp.flipX();
      comp.flipY();
      comp.angle = 60;
    });
  });
});

registerTestSuite("testDiode", ()=>{
  afterEach(glbl.cleanup);

  const createDiode = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Diode(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createDiode({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(40);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.maxCurrent).toBe(1);
      expect(comp.voltForward).toBe(0.6);
    });
    it("Should construct with options", ()=>{
      const comp = createDiode({centerPoint:{x:50,y:50},
        name:"diode",classList:["nofill"], maxCurrent:0.01, voltForward:1});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("diode");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(16);
      expect(comp.size.height).toBe(40);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.maxCurrent).toBe(0.01);
      expect(comp.voltForward).toBe(1);
      comp.move([100,89])
      comp.move([250,89])
      comp.flipX();
      comp.flipY();
      comp.angle = 60;
    });
  });
});

registerTestSuite("testTransistor", ()=>{
  afterEach(glbl.cleanup);

  const createTransistor = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new BipolarTransistor(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createTransistor({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(3);
      expect(comp.nets[0]).toBeInstanceOf(ElectricNet);
      expect(comp.nets[1]).toBeInstanceOf(ElectricNet);
      expect(comp.nets[2]).toBeInstanceOf(ElectricNet);
      expect(comp.size.width).toBe(50);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.maxCurrent).toBe(1);
      expect(comp.voltForward).toBe(0.6);
      expect(comp.hfe).toBe(100);
      expect(comp.isPnp).toBe(false);
    });
    it("Should construct with options", ()=>{
      const comp = createTransistor({centerPoint:{x:50,y:50},
        name:"transistor",classList:["nofill"], maxCurrent:0.01,
        voltForward:1, hfe:200, isPnp:true});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("transistor");
      expect(comp.nets.length).toBe(3);
      expect(comp.nets[0]).toBeInstanceOf(ElectricNet);
      expect(comp.nets[1]).toBeInstanceOf(ElectricNet);
      expect(comp.nets[2]).toBeInstanceOf(ElectricNet);
      expect(comp.size.width).toBe(50);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(4);
      expect(comp.maxCurrent).toBe(0.01);
      expect(comp.voltForward).toBe(1);
      expect(comp.hfe).toBe(200);
      expect(comp.isPnp).toBe(true);
      comp.move([100,89])
      comp.move([250,89])
      comp.flipX();
      comp.flipY();
      comp.angle = 60;
    });
  });
});


registerTestSuite("testRelay", ()=>{
  afterEach(glbl.cleanup);

  const createRelay = (obj)=>{
    obj.parentElement = glbl.parentElement;
    glbl.shapes.push(new Relay(obj));
    return glbl.shapes[glbl.shapes.length-1];
  }

  describe("Test constructor", ()=>{
    it("Should construct with defaults", ()=>{
      const comp = createRelay({});
      expect(comp.size.centerPoint).toBeObj({x:0,y:0});
      expect(comp.name).toBe("");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(60);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('_electric_component')).toBe(true);
      expect(comp.shapes.length).toBe(3);
      expect(comp.resistance).toBe(100);
      expect(comp.components.length).toBeObj(2);
    });
    it("Should construct with options", ()=>{
      const comp = createRelay({centerPoint:{x:50,y:50},
        name:"capacitor",classList:["nofill"], resistance:10});
      expect(comp.size.centerPoint).toBeObj({x:50,y:50});
      expect(comp.name).toBe("capacitor");
      expect(comp.nets.length).toBe(2);
      expect(comp.nets[0] instanceof ElectricNet).toBe(true);
      expect(comp.nets[1] instanceof ElectricNet).toBe(true);
      expect(comp.size.width).toBe(60);
      expect(comp.size.height).toBe(50);
      expect(comp.node.classList.contains('nofill')).toBe(true);
      expect(comp.shapes.length).toBe(3);
      expect(comp.resistance).toBe(10);
      expect(comp.components.length).toBeObj(2);
      comp.move([250,89])
      comp.flipX();
      comp.flipY();
      comp.angle = 60;
    });
  });
});

