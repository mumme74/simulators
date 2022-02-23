"use strict";

import { ComponentBase, Net } from "../schematic.mjs";
import { Point } from "../point.mjs";
import { Line, Polygon, SizeRect } from "../base.mjs";
import { Circle, Rect } from "../trigenometry/index.mjs";


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
  resistance = 0;
  inductance = 0;
  capacitance = 0;

  constructor({parentElement, centerPoint, name, className, nets, width, height}) {
    if (!Array.isArray(nets))
      nets = [new ElectricNet({name})];
    super({parentElement, centerPoint, name, className, nets, width, height});
    this.node.classList.add("_electric_component")
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
  constructor({parentElement, centerPoint, name, className}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          className, nets, width:16, height:50});

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
      parentElement, className, topLeft:sz.topLeft,
      width:sz.width, height: sz.height
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
  constructor({parentElement, centerPoint, open=true, className, name}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          className, nets, width:16, height:50});


    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 25;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.dot1 = new Circle({parentElement, className:"dot",
      centerPoint:this.terminal1.point2, radii:2
    });
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.dot2 = new Circle({parentElement, className:"dot",
      centerPoint:this.terminal2.point2, radii:2
    });
    this.contact = new Line({parentElement,
      point1:this.terminal1.point2,
      point2:{
        x: open ? sz.right : sz.centerPoint.x,
        y:sz.bottom
      }
    });

    this.addShape(this.terminal1);
    this.addShape(this.dot1);
    this.addShape(this.terminal2);
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
  constructor({parentElement, centerPoint, broken=false, rating=5, className, name}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          className, nets, width:35, height:50});

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
    this.lightNode = new Circle({parentElement, className:"litUp",
      centerPoint:sz.centerPoint, radii: sz.width / 2
    });
    this.lightNode.node.style.stroke = "none";

    this.lineCross1 = new Line({parentElement,
      point1:linePts[0], point2: linePts[1]
    });
    this.lineCross2 = new Line({parentElement,
      point1:linePts[2], point2:linePts[3]
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
   * @param {string} [className] The className string to use
   * @param {string} [name] The name of this component
   * @param {number} [capacity] The number of Ah of this cell
   * @param {number} [voltage] Nominal Volt of this cell
   * @param {number} [soc] The State of charge
   * @param {number} [resistance] The internal resitance of this cell
   */
  constructor({
    parentElement, centerPoint, className, name,
    capacity=100, voltage=2, soc=1.0, resistance=0.01
  }) {
    const nets = [
      new ElectricNet({namePrefix:"plus"}),
      new ElectricNet({namePrefix:"minus"})
    ];
    super({parentElement, centerPoint, name,
          className, nets, width:40, height:20});

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
    this.plusLine = new Line({parentElement, className:"plusLine",
      point1:sz.topLeft, point2:sz.topRight
    });
    sz.width -= 12;
    this.minusLine = new Line({parentElement, className:"minusLine",
      point1: sz.bottomLeft, point2:sz.bottomRight
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
            Number.MAX_VALUE, (circuitResistance + this.resistance));
    const volt = (noDrawVolt - feedVolt) - (amp * this.resistance);
    this.soc -= amp * (1 / (1000 * 3600)) * ms; // make to Ah
    return {feeds:volt, draws:-amp};
  }
}

export class Resistor extends ElectricComponentBase {

  constructor({parentElement, centerPoint, name, className, resistance=1}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          className, nets, width:16, height:50});

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
      parentElement, className, topLeft:sz.topLeft,
      width:sz.width, height: sz.height
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
   * @param {string} [className] The className string to use
   * @param {string} [name] The name of this component
   * @param {number} [capacity] The number of capacitance in Farad
   * @param {number} [resistance] The internal resitance
   * @param {number} [polarized] It capacitor should be polarized
   */
  constructor({
    parentElement, centerPoint, className, name,
    capacitance=0.001, resistance=0.05, polarized=false
  }) {
    const nets = [
      new ElectricNet({namePrefix:"plus"}),
      new ElectricNet({namePrefix:"minus"})
    ];
    const height = polarized ? 33 : 25
    super({parentElement, centerPoint, name,
          className, nets, width:40, height});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height = 8;

    this.terminal1 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.top},
      point2:{x:sz.centerPoint.x,y:sz.top}
    });
    this.plusLine = new Line({parentElement, className:"plusLine",
      point1:sz.topLeft, point2:sz.topRight
    });

    sz.centerPoint.y += polarized ? 8 : 5;
    sz.height = polarized ? 6 : 0;
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.minusShape = new Polygon({parentElement, className:"minusLine",
      points: [sz.topLeft, sz.topRight, sz.bottomRight, sz.bottomLeft]
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
   * @param {string} [className] The className string to use
   * @param {string} [name] The name of this component
   * @param {number} [inductance] The number of capacitance in Farad
   * @param {number} [resistance] The internal resitance
   */
  constructor({
    parentElement, centerPoint, className, name,
    inductance=0.001, resistance=100
  }) {
    const nets = [
      new ElectricNet({}),
      new ElectricNet({})
    ];
    super({parentElement, centerPoint, name,
          className, nets, width:30, height:50});

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

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
    this.addShape(this.lineCross1);
    this.addShape(this.rectShape);

    this.inductance = inductance;
    this.resistance = resistance;
  }
}


export class Relay extends ElectricComponentBase {

  constructor({parentElement, centerPoint, name, className, resistance}) {
    const nets = [new ElectricNet({}), new ElectricNet({})];
    super({parentElement, centerPoint, name,
          className, nets, width:60, height:50});

    parentElement = this.node;
    const sz = new SizeRect({cloneFromRect:this.size});
    sz.height -= 15; sz.width -= 5;

    this.rect = new Polygon({
      parentElement, className:"outline", points:[
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
    this.solenoid.resistance;
  }

  set resistance(resistance) {
    this.solenoid.resistance = this.resistance
  }
}