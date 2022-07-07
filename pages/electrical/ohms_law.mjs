"use strict";

import { BatteryCell, Resistor } from "../../lib/electrical/electric_schematic.mjs";
import { Arrow } from "../../lib/trigenometry/index.mjs";
import { Wire } from "../../lib/schematic.mjs";
import { Text } from "../../lib/base.mjs";

const svg = document.querySelector("svg");

const batt = new BatteryCell({parentElement:svg, centerPoint:{x:60,y:150}}),
      resistor = new Resistor({parentElement:svg, centerPoint:{x:600,y:150}});

/*const wirePlus =*/ new Wire({
  parentElement:svg,
  startPnt:batt.terminal1.point1,
  betweenPnts:[
    {x:batt.size.centerPoint.x, y:20},
    {x:resistor.size.centerPoint.x, y:20}
  ],
  endPnt:resistor.terminal1.point1
});
/*const wireMinus =*/ new Wire({
  parentElement: svg,
  startPnt: resistor.terminal2.point1,
  betweenPnts:[
    {x:batt.size.centerPoint.x, y:280},
    {x:resistor.size.centerPoint.x, y:280}
  ],
  endPnt: batt.terminal2.point1
});

class VluArrow extends Arrow {
  constructor({parentElement, classList, point1, point2, end1, end2, value=1}) {
    super({parentElement, classList, point1, point2, end1, end2});
    this._value = value;
    this.axis = (point1.x === point2.x) ? "y" : "x";
    this.initial1 = this.point1[this.axis];
    this.initial2 = this.point2[this.axis];
  }

  get value() { return this._value; }
  set value(vlu) {
    this._value = +vlu;
    this.point1[this.axis] = this.initial1 - this._value * 1.4;
    this.point2[this.axis]  = this.initial2 + this._value * 1.4;
  }
}

const arrowU = new VluArrow({
  parentElement:svg, classList: "potential", end2:false, end1: true,
  point1:{x:batt.size.centerPoint.x -30, y:batt.size.centerPoint.y -10},
  point2:{x:batt.size.centerPoint.x -30, y:batt.size.centerPoint.y +10}
});
const arrowR = new VluArrow({
  parentElement:svg, classList: "resistance", end2:false, end1: true,
  point1: {x:resistor.size.centerPoint.x +20, y:resistor.size.centerPoint.y-10},
  point2: {x:resistor.size.centerPoint.x +20, y:resistor.size.centerPoint.y+10}
})
const midPnt = (resistor.size.centerPoint.x - batt.size.centerPoint.x) / 2 + batt.size.centerPoint.x;
const arrowI = new VluArrow({
  parentElement:svg, classList: "current",
  point1: {x:midPnt -10, y:30},
  point2: {x:midPnt +10, y:30}
});

const textU = new Text({
  parentElement:svg, classList: "potential",
  followPoint: arrowU.point1, offsetX: -25, offsetY: 25,
  text: "Volt"
});
const textR = new Text({
  parentElement:svg, classList: "resistance",
  followPoint: arrowR.point1, offsetX: 10, offsetY:25,
  text: "Ohm"
});
const textI = new Text({
  parentElement:svg, classList: "current",
  followPoint: arrowI.point2, offsetY: 25, offsetX:-10,
  text: "Ampere"
});

class Input {
  constructor(id, arrow, annotation, unit,  onChange = ()=>{}) {
    this.arrow = arrow;
    this.annotation = annotation;
    this.unit = unit;
    this.onChange = onChange;
    this.slider = document.querySelector(`#${id}-slider`);
    this.input = document.querySelector(`#${id}`);
    this.slider.addEventListener("change", ()=>{
      this.input.value = +this.slider.value;
      this.onChange(+this.slider.value);
      this._updated();
    });
    this.input.addEventListener("change", ()=>{
      this.slider.value = +this.input.value;
      this.onChange(+this.input.value);
      this._updated();
    });
    this._updated();
  }

  set value(value) {
    this.input.value = +value;
    this.slider.value = +value;
    this._updated();
  }

  get value() {
    return +this.input.value;
  }

  _updated() {
    const vlu = +this.input.value
    this.arrow.value = vlu;
    this.annotation.text = vlu + this.unit;
  }
}


const potential = new Input("potential", arrowU, textU, "V", (volts)=>{
  current.value = volts / resistance.value;
  mathml.recalulate("I");
});

const resistance = new Input("resistance", arrowR, textR, "Ω", (ohms)=>{
  current.value = potential.value / ohms;
  mathml.recalulate("U");
});

const current = new Input("current", arrowI, textI, "A", (amps)=>{
  resistance.value = potential.value / amps;
  mathml.recalulate("R");
});


const calcNode = document.querySelector("#calculation");
// fixme when equations solver is complete
function MathEquationSolver() {}

const mathml = new MathEquationSolver({
  parentElement: calcNode,
  identifiers:[
    /*new Ident("U", potential),
    new Ident("I", current),
    new Ident("R", resistance)*/
  ],
  formula: "U = 1(I x R)"
});



