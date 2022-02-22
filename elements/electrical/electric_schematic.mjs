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
  constructor({parentElement, centerPoint, name, className, nets, width, height}) {
    if (!Array.isArray(nets))
      nets = [new ElectricNet({name})];
    super({parentElement, centerPoint, name, className, nets, width, height});
    this.node.classList.add("_electric_component")
  }
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
    this.terminal2 = new Line({parentElement,
      point1:{x:sz.centerPoint.x,y:this.size.bottom},
      point2:{x:sz.centerPoint.x,y:sz.bottom}
    });
    this.contact = new Line({parentElement,
      point1:this.terminal1.point2,
      point2:{
        x: open ? sz.right : sz.centerPoint.x,
        y:sz.bottom
      }
    });

    this.addShape(this.terminal1);
    this.addShape(this.terminal2);
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
