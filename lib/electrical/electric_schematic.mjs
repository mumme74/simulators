"use strict";

import { ComponentBase, Net } from "../schematic.mjs";
import { Point } from "../point.mjs";
import { Line, Polygon, SizeRect, Group } from "../base.mjs";
import { Arrow, Circle, Rect } from "../trigenometry/index.mjs";


/**
 * Base Net class for all electrics
 */
export class ElectricNet extends Net {
  constructor({name, namePrefix, points=[]}){
    super({name, namePrefix: namePrefix || "el-net", type:"electric", points});
  }
}

/**
 * Base Component class for all electrics
 */
export class ElectricComponentBase extends ComponentBase {
  _resistance = 0;
  _inductance = 0;
  _capacitance = 0;

  constructor({parentElement, centerPoint, name, classList, nets, width, height}) {
    if (!Array.isArray(nets))
      nets = [new ElectricNet({name})];
    super({parentElement, centerPoint, name, classList, nets, width, height});
    this.node.classList.add("_electric_component")
  }

  get resistance() {
    return this._resistance;
  }
  set resistance(resistance) {
    this._resistance = resistance;
  }

  get inductance() {
    return this._inductance;
  }
  set inductance(inductance) {
    this._inductance = inductance;
  }

  get capacitance() {
    return this._capacitance;
  }
  set capacitance(capacitance) {
    this._capacitance = capacitance;
  }

  /**
   * Feed is feeding into this component
   * @param {number} circuitResistance The resistance to this component
   * @param {number} feedVolt The feed volt by other components
   * @param {number} ms The number of ms this occurs
   * @returns {{feeds:number,draws:number}} feeds as voltage feed to circuit, draws as number of amps, negative in power sources
   */
  /*feed(circuitResistance=Number.MAX_VALUE, feedVolt=0, ms=1) {
    const noDrawVolt = this.nominalVolt  + 0.2 * this.soc - 0.1;
    const amp = (noDrawVolt - feedVolt) / Math.min(
            Number.MAX_VALUE, (circuitResistance + this.resistance));
    const volt = (noDrawVolt - feedVolt) - (amp * this.resistance);
    this.soc -= amp * (1 / (1000 * 3600)) * ms; // make to Ah
    return {feeds:volt, draws:-amp};
  }*/
}

export class Fuse extends ElectricComponentBase {
  rating = 1;
  constructor({parentElement, centerPoint, name, classList}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          classList, nets, width:16, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 15;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.centerPoint.y}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.centerPoint.y}
    });
    this.rect = new Rect({
      parentElement, classList, topLeft:sz.topLeft,
      width:sz.width, height: sz.height
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.rect);
  }

  currentThrough(amps) {
    if (amps > this.rating) {
      this.state = 1;
    }
  }

  get broken() {
    return this.state !== 0;
  }

  set broken(broken) {
    this.state = broken ? 1 : 0;
  }

  _stateChanged(newState) {
    this.terminal1.point2.y -= newState !== 0 ? 5 : -5;
    this.terminal2.point2.y += newState !== 0 ? 5 : -5;
  }
}

export class Switch extends ElectricComponentBase {
  constructor({parentElement, centerPoint, open=true, classList, name}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
      classList, nets, width:16, height:50});


    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 25;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.dot1 = new Circle({parentElement, classList:["dot"],
      centerPoint:this.terminal1.point2, radii:2
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.dot2 = new Circle({parentElement, classList:["dot"],
      centerPoint:this.terminal2.point2, radii:2
    });
    this.contact = new Line({parentElement,
      point1:new Point(this.terminal1.point2),
      point2:{
        x: open ? sz.right : sz.centerPoint.x,
        y:sz.bottom
      }
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.dot1);
    this.addShape(this.dot2);
    this.addShape(this.contact);

    this.open = open;
  }

  get open(){
    return this.state === 0;
  }

  set open(opened) {
    this.state = opened ? 0 : 1;
  }

  get closed() { return !this.open }
  set closed(close) { this.open = !close }

  _stateChanged(newState) {
    const sz = this.size;
    this.contact.point2.x =  newState === 0 ? sz.right : sz.centerPoint.x;
  }
}

export class Lamp extends ElectricComponentBase {
  rating = 5;
  constructor({parentElement, centerPoint, broken=false, rating=5, classList, name}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
      classList, nets, width:35, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height = sz.width;
    const radii = sz.width / 2;
    const linePts = [45,225,135,315].map(deg=>{
      const radians = (deg / 180) * Math.PI;
      const ptx = Math.cos(radians) * radii,
            pty = Math.sin(radians) * -radii;
      return {x:ptx+sz.centerPoint.x, y:pty+sz.centerPoint.y};
    })

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.outerCircle = new Circle({parentElement,
      centerPoint: sz.centerPoint, radii: sz.width / 2
    });
    this.lightNode = new Circle({parentElement, classList:["litUp"],
      centerPoint:sz.centerPoint, radii: sz.width / 2
    });
    this.lightNode.node.style.stroke = "none";

    this.lineCross1 = new Line({parentElement,
      point1:linePts[0], point2: linePts[1]
    });
    this.lineCross2 = new Line({parentElement,
      point1:linePts[2], point2:linePts[3]
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.outerCircle);
    this.addShape(this.lightNode);
    this.addShape(this.lineCross1);
    this.addShape(this.lineCross2);

    this.rating = rating || 5; // as in watts

    this.broken = broken;
  }

  currentThrough(amps) {
    if (!this.broken) {
      const max = this.rating / 12;
      if (amps > max) {
        this.broken = true;
        return 0;
      }
      this.state = amps / max;
    }
  }

  get broken() {
    return this.state < 0;
  }

  set broken(broken) {
    this.state = broken ? -1 : 0;
  }

  _stateChanged(newState) {
    this.lightNode.node.style.opacity = newState >= 0 ? newState : 0.0;
  }
}

/**
 * A battery cell class
 * @prop
 */
export class BatteryCell extends ElectricComponentBase {
  /**
   * Create a new BatteryCell
   * @param {SVGElement} parentElement The parent to attach this node to
   * @param {Point|{x:number,y:number}} centerPoint the center for this component
   * @param {string} [classList] The css classes to use
   * @param {string} [name] The name of this component
   * @param {number} [capacity] The number of Ah of this cell
   * @param {number} [voltage] Nominal Volt of this cell
   * @param {number} [soc] The State of charge
   * @param {number} [resistance] The internal resitance of this cell
   */
  constructor({
    parentElement, centerPoint, classList, name,
    capacity=100, voltage=2, soc=1.0, resistance=0.01
  }) {
    const nets = [
      new ElectricNet({namePrefix:"plus"}),
      new ElectricNet({namePrefix:"minus"})
    ];
    super({parentElement, centerPoint, name,
      classList, nets, width:40, height:20});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 12;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.plusLine = new Line({parentElement, classList:["plusLine"],
      point1:sz.topLeft, point2:sz.topRight
    });
    sz.width -= 12;
    this.minusLine = new Line({parentElement, classList:["minusLine"],
      point1: sz.bottomLeft, point2:sz.bottomRight
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.plusLine);
    this.addShape(this.minusLine);

    this.nominalVolt = voltage;
    this.soc = soc;
    this.capacity = capacity;
    this.resistance = resistance;
  }

  /**
   * Feed is feeding into this component
   * @param {number} circuitResistance The resistance to this component
   * @param {number} feedVolt The feed volt by other components
   * @param {number} ms The number of ms this occurs
   * @returns {{feeds:number,draws:number}} feeds as voltage feed to circuit, draws as number of amps, negative in power sources
   */
  feed(circuitResistance=Number.MAX_VALUE, feedVolt=0, ms=1) {
    const noDrawVolt = this.nominalVolt  + 0.2 * this.soc - 0.1;
    const amp = (noDrawVolt - feedVolt) / Math.min(
            Number.MAX_VALUE, (circuitResistance + this._resistance));
    const volt = (noDrawVolt - feedVolt) - (amp * this._resistance);
    this.soc -= amp * (1 / (1000 * 3600)) * ms; // make to Ah
    return {feeds:volt, draws:-amp};
  }
}

export class Resistor extends ElectricComponentBase {

  constructor({parentElement, centerPoint, name, classList, resistance=1}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
      classList, nets, width:16, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 15;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.rect = new Rect({
      parentElement, classList, topLeft:sz.topLeft,
      width:sz.width, height: sz.height
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.rect);

    this.resistance = resistance;
  }

  currentThrough(amps) {
    if (amps > this.rating) {
      this.state = 1;
    }
  }

  get broken() {
    return this.state !== 0;
  }

  set broken(broken) {
    this.state = broken ? 1 : 0;
  }
}

/**
 * A capacitor class
 * @prop
 */
 export class Capacitor extends ElectricComponentBase {
  /**
   * Create a new Capacitor
   * @param {SVGElement} parentElement The parent to attach this node to
   * @param {Point|{x:number,y:number}} centerPoint the center for this component
   * @param {string} [classList] The css classes to use
   * @param {string} [name] The name of this component
   * @param {number} [capacity] The number of capacitance in Farad
   * @param {number} [resistance] The internal resitance
   * @param {number} [polarized] It capacitor should be polarized
   */
  constructor({
    parentElement, centerPoint, classList, name,
    capacitance=0.001, resistance=0.05, polarized=false
  }) {
    const nets = [
      new ElectricNet({namePrefix:"plus"}),
      new ElectricNet({namePrefix:"minus"})
    ];
    const height = polarized ? 33 : 25
    super({parentElement, centerPoint, name,
      classList, nets, width:40, height});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height = 8;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.plusLine = new Line({parentElement, classList:["plusLine"],
      point1:sz.topLeft, point2:sz.topRight
    });

    sz.centerPoint.y += polarized ? 8 : 5;
    sz.height = polarized ? 6 : 0;
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.minusShape = new Polygon({parentElement, classList:["minusLine"],
      points: [sz.topLeft, sz.topRight, sz.bottomRight, sz.bottomLeft]
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.plusLine);
    this.addShape(this.minusShape);

    this.capacitance = capacitance;
    this.resistance = resistance;
    this.polarized = polarized;
  }
}

/**
 * A Solenoid class
 * @prop
 */
 export class Solenoid extends ElectricComponentBase {
  /**
   * Create a new Solenoid
   * @param {SVGElement} parentElement The parent to attach this node to
   * @param {Point|{x:number,y:number}} centerPoint the center for this component
   * @param {string} [classList] The css classes to use
   * @param {string} [name] The name of this component
   * @param {number} [inductance] The number of capacitance in Farad
   * @param {number} [resistance] The internal resitance
   */
  constructor({
    parentElement, centerPoint, classList, name,
    inductance=0.001, resistance=100
  }) {
    const nets = [
      new ElectricNet({}),
      new ElectricNet({})
    ];
    super({parentElement, centerPoint, name,
      classList, nets, width:30, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 28;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.rectShape = new Polygon({parentElement,
      points: [sz.topLeft, sz.topRight, sz.bottomRight, sz.bottomLeft]
    });
    sz.width /= 2;
    this.lineCross1 = new Line({parentElement,
      point1:sz.bottomLeft, point2:sz.topRight
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.lineCross1);
    this.addShape(this.rectShape);

    this.inductance = inductance;
    this.resistance = resistance;
  }
}

/**
 * A Diode class
 * @prop
 */
 export class Diode extends ElectricComponentBase {
  /**
   * Create a new Diode
   * @param {SVGElement} parentElement The parent to attach this node to
   * @param {Point|{x:number,y:number}} centerPoint the center for this component
   * @param {string} [classList] The css classes to use
   * @param {string} [name] The name of this component
   * @param {number} [maxCurrent] The number of capacitance in Farad
   * @param {number} [voltForward] The voltage drop
   */
  constructor({
    parentElement, centerPoint, classList, name,
    maxCurrent=1, voltForward=0.6
  }) {
    const nets = [
      new ElectricNet({}),
      new ElectricNet({})
    ];
    super({parentElement, centerPoint, name,
      classList, nets, width:16, height:40});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 28;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.arrowShape = new Polygon({parentElement,
      points: [sz.topLeft, sz.topRight, sz.bottomPoint]
    });
    this.lineShape = new Line({parentElement,
      point1:sz.bottomLeft, point2:sz.bottomRight
    });

    this.addTerminal(this.terminal1, nets[0]);
    this.addTerminal(this.terminal2, nets[1]);
    this.addShape(this.lineShape);
    this.addShape(this.arrowShape);

    this.maxCurrent = maxCurrent;
    this.voltForward = voltForward;
  }
}

/**
 * A npn or pnp class
 */
export class BipolarTransistor extends ElectricComponentBase {
  /**
   * Create a new Diode
   * @param {SVGElement} parentElement The parent to attach this node to
   * @param {Point|{x:number,y:number}} centerPoint the center for this component
   * @param {string} [classList] The css classes to use
   * @param {string} [name] The name of this component
   * @param {number} [maxCurrent] The number of capacitance in Farad
   * @param {number} [voltForward] The voltage drop base-emitter
   * @param {number} [hfe] The gain of this transistor
   */
   constructor({
    parentElement, centerPoint, classList, name, isPnp=false,
    maxCurrent=1, voltForward=0.6, hfe=100
  }) {
    const nets = [
      new ElectricNet({namePrefix:"base"}),
      new ElectricNet({namePrefix:"collector"}),
      new ElectricNet({namePrefix:"emitter"})
    ];
    super({parentElement, centerPoint, name,
      classList, nets, width:50, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});

    this.base = new Line({parentElement,
      point1:{x:sz.left,y:this.size.centerPoint.y},
      point2:{x:sz.centerPoint.x,y:sz.centerPoint.y}
    });
    this.collector = new Line({parentElement,
      point1:sz.centerPoint.point,
      point2:{x:sz.right,y:isPnp ? sz.bottom : sz.top}
    });

    const eRec = new SizeRect({topLeft:sz.centerPoint.point,
      width:isPnp ? (sz.width/2) : (sz.width/3*2),
      height:isPnp ? (sz.height/2) : (sz.width/3*2)
    });
    if (isPnp)
    eRec.centerPoint.moveBy({x:0,y:-eRec.height});
    const emitterEndPnt = { x:sz.right, y:isPnp ? sz.top : sz.bottom };
    this.emitter = new Group({parentElement,
      shapes:[
        new Arrow({parentElement,
          point1: isPnp ? emitterEndPnt : sz.centerPoint.point,
          point2: isPnp ? eRec.centerPoint.point : eRec.centerPoint.point
        }),
        new Line({parentElement,
          point1: isPnp ? eRec.centerPoint.point : eRec.centerPoint.point,
          point2: isPnp ? sz.centerPoint.point : sz.bottomRight,
        })
      ]
    });
    this.lineShape = new Line({parentElement,
      point1:{x:sz.centerPoint.x, y:sz.top},
      point2:{x:sz.centerPoint.x, y:sz.bottom}
    });

    this.addTerminal(this.base, nets[0]);
    this.addTerminal(this.collector, nets[1]);
    this.addTerminal(this.emitter, nets[2]);
    this.addShape(this.lineShape);

    this.maxCurrent = maxCurrent;
    this.voltForward = voltForward;
    this.hfe = hfe;
    this.isPnp = isPnp;
  }
}


export class Relay extends ElectricComponentBase {

  constructor({parentElement, centerPoint, name, classList, resistance=100}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
      classList, nets, width:60, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 15; sz.width -= 5;

    this.rect = new Polygon({
      parentElement, classList:["outline"], points:[
        sz.topLeft, sz.topRight, sz.bottomRight, sz.bottomLeft
      ]
    });

    this.addShape(this.rect);
    sz.width -= 30; sz.centerPoint.x += 3;
    this.switch = new Switch({parentElement,
      centerPoint:{x:sz.right, y:sz.centerPoint.y}
    });
    this.solenoid = new Solenoid({parentElement,
      centerPoint:{x:sz.left, y:sz.centerPoint.y}, resistance
    });

    this.addComponent(this.switch);
    this.addComponent(this.solenoid);
  }

  get resistance() {
    return this.solenoid.resistance;
  }

  set resistance(resistance) {
    this.solenoid.resistance = resistance
  }
}