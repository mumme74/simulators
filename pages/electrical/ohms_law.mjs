"use strict";

import { BatteryCell, Resistor } from "../../lib/electrical/electric_schematic.mjs";
import { Arrow } from "../../lib/trigenometry/index.mjs";
import { Wire } from "../../lib/schematic.mjs";
import { Text } from "../../lib/base.mjs";

const svg = document.querySelector("svg");

const batt = new BatteryCell({parentElement:svg, centerPoint:{x:60,y:150}}),
      resistor = new Resistor({parentElement:svg, centerPoint:{x:600,y:150}});

const wirePlus = new Wire({
  parentElement:svg,
  startPnt:batt.terminal1.point1,
  betweenPnts:[
    {x:batt.size.centerPoint.x, y:20},
    {x:resistor.size.centerPoint.x, y:20}
  ],
  endPnt:resistor.terminal1.point1
});
const wireMinus = new Wire({
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

class Indentifier {
  constructor(id, value = null) {
    this.id = id;
    this.value = value;
  }
  get shw() {
    return this.value === null ? `<mi>${this.id}</mi>` : `<mn>${this.value}<mn>`;
  }
}

class Oper {
  static types = {eq:"=", mul:'x', div:'/', add:'+', sub:'-'};
  constructor(type) {
    this.id = type;
  }
  get shw() {
    return `<mo>${this.id}</mo>`
  }
  get type() {
    return Object.entries(Oper.types).find(({k,v})=>v===this.id);
  }
}

class Calculate {
  constructor(potential, current, resistance) {
    this.potential = potential;
    this.current = current;
    this.resistance = resistance;
    this.outNode = document.querySelector("#calculation");
    const header = document.createElement("h3");
    header.textContent = "Uträkning";
    this.outNode.appendChild(header);

    this.recalulate('I');
  }

  recalulate(unknown) {
    while(this.outNode.childNodes.length > 1)
      this.outNode.removeChild(this.outNode.lastChild);

    this.rows = [];

    // formula
    let row = this._newRow();
    row.innerHTML = `<mrow><mi>U</mi> <mo>=</mo> <mi>I</mi> <mo>×</mo> <mi>R</mi></mrow>`;

    switch (unknown) {
    case 'U': this._recalulateUnkown_U(); break;
    case 'R': this._recalulateUnkown_R(); break;
    case 'I': default:
      this._recalulateUnkown_I(); break;
    }

    for(const row of this.rows)
      this.outNode.appendChild(row);
  }

  _recalulateUnkown_I() {
    const U = this.potential.value,
          R = this.resistance.value;
    let row = this._newRow();
    row.innerHTML = `<mrow>
      <mn>${U}</mn> <mo>=</mo> <mi>I</mi> <mo>×</mo> <mn>${R}</mn>
      </mrow>
    `;

    row = this._newRow();
    row.innerHTML = `<mrow>
      <mfrac><mn>${U}</mn> <mn>${R}</mn></mfrac>
        <mo>=</mo> <mfrac><mrow><mi>I</mi> <mo>×</mo> <mn>${R}</mn></mrow> <mn>${R}</mn></mfrac>
      </mrow>
      `
    row = this._newRow();
    row.innerHTML = `<mrow>
      <mfrac><mn>${U}</mn> <mn>${R}</mn></mfrac>
        <mo>=</mo> <mrow><mi>I</mi>
      </mrow>
    `;

    row = this._newRow();
    row.innerHTML = `<mrow>
      <mi>I</mi><mo>=</mo><mn>${U/R}</mn>
    </mrow>`
  }

  _recalulateUnkown_R() {

  }

  _recalulateUnkown_U() {

  }

  _newRow() {
    const mathRow = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
    this.rows.push(mathRow);
    return this.rows[this.rows.length-1];
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

const mathml = new Calculate(potential, current, resistance);


