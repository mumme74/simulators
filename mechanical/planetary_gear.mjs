"use strict";

import { Circle } from "../elements/trigenometry/index.mjs";
import { Rotation } from "../elements/rotation.mjs";
import { BaseShape, Line, Polygon } from "../elements/base.mjs";
import { StateFromHash } from "../helpers/index.mjs";


const maxDeg = 1440, maxSunRadii = 140, minSunRadii = 65;
const parentElement = document.querySelector("svg");

const slider = document.querySelector("input[type=range]");
slider.max = maxDeg;

const stateObj = new StateFromHash({forceIn:"sun",lock:"carrier",sunRadii:100}),
      state = stateObj.ref;
if (state.sunRadii > maxSunRadii) state.sunRadii = maxSunRadii;
if (state.sunRadii < minSunRadii) state.sunRadii = minSunRadii;


class PlanetaryGear extends BaseShape {
  constructor({
    parentElement, centerPoint={x:300,y:300}, holderWidth=45,
    planetGearAxleRadii=35,sunGearAxleRadii=50, sunRadii=100,
    state={lock:"carrier", forceIn:"sun"}
  }) {

    const rootElement = document.createElementNS('http://www.w3.org/2000/svg','g');
    super({parentElement, rootElement, points:centerPoint,classList:[""]})

    parentElement = rootElement;

    this.outerCircle = new Circle({
        parentElement, centerPoint,
        radii:240, classList: ["ringGear"]
    });

    this.state = state;
    this.sunRadii = sunRadii;
    this.centerPoint = centerPoint;
    this.ringRadii = this.outerCircle.radii - 10;
    this.planetRadii = this.ringRadii / 2 - this.sunRadii / 2;
    this.planetOffset = this.sunRadii + this.planetRadii;
    this.holderWidth = holderWidth;
    this.planetGearAxleRadii = planetGearAxleRadii;
    this.sunGearAxleRadii = sunGearAxleRadii;

    this.ringLines = [
      new Line({parentElement, classList:["marker"],
        point1: {x:centerPoint.x-this.outerCircle.radii, y:centerPoint.y},
        point2:{x:centerPoint.x+this.outerCircle.radii, y:centerPoint.y},
      }),
      new Line({parentElement, classList:["marker"],
        point1: {y:centerPoint.y-this.outerCircle.radii, x:centerPoint.x},
        point2:{y:centerPoint.y+this.outerCircle.radii, x:centerPoint.x},
      }),
    ];

    this.rotRing = new Rotation({
      x:centerPoint.x,y:centerPoint.y,rotateShapes:this.ringLines
    });

    this.ringGear = new Circle({
      parentElement, centerPoint:this.outerCircle.offset,
      radii: this.ringRadii, classList: ["inner"]});
    this.carrier = new Polygon({parentElement,points:[
      {x:centerPoint.x+this.planetOffset,y:centerPoint.y-this.holderWidth},
      {x:centerPoint.x+this.holderWidth, y:centerPoint.y-this.holderWidth},
      {x:centerPoint.x+this.holderWidth, y:centerPoint.y-this.planetOffset},
      {x:centerPoint.x-this.holderWidth, y:centerPoint.y-this.planetOffset},
      {x:centerPoint.x-this.holderWidth, y:centerPoint.y-this.holderWidth},
      {x:centerPoint.x-this.planetOffset, y:centerPoint.y-this.holderWidth},
      {x:centerPoint.x-this.planetOffset, y:centerPoint.y+this.holderWidth},
      {x:centerPoint.x-this.holderWidth, y:centerPoint.y+this.holderWidth},
      {x:centerPoint.x-this.holderWidth, y:centerPoint.y+this.planetOffset},
      {x:centerPoint.x+this.holderWidth, y:centerPoint.y+this.planetOffset},
      {x:centerPoint.x+this.holderWidth, y:centerPoint.y+this.holderWidth},
      {x:centerPoint.x+this.planetOffset, y:centerPoint.y+this.holderWidth}
    ], classList:["planetaryHolder"]});
    this.carrierLine = new Line({parentElement,
      point1: {x:centerPoint.x, y:centerPoint.y-this.outerCircle.radii-5},
      point2:{x:centerPoint.x, y:centerPoint.y-this.outerCircle.radii-15}
    });
    this.planetGears = [
      new Circle({parentElement,
        centerPoint:{x:centerPoint.x+this.planetOffset, y:centerPoint.y},
        radii:this.planetRadii, classList:["planetaryGear"]}),
      new Circle({parentElement,
        centerPoint:{x:centerPoint.x, y:centerPoint.y-this.sunRadii-this.planetRadii},
        radii:this.planetRadii, classList:["planetaryGear"]}),
      new Circle({parentElement,
        centerPoint:{x:centerPoint.x-this.sunRadii-this.planetRadii, y:centerPoint.y},
        radii:this.planetRadii, classList:["planetaryGear"]}),
      new Circle({parentElement,
        centerPoint:{x:centerPoint.x, y:centerPoint.y+this.planetOffset},
        radii:this.planetRadii, classList:["planetaryGear"]}),
    ];
    this.planetGearsLines = this.planetGears.map((planetGear, i)=>{
      const xOffset = (i % 2) === 0 ? this.planetRadii : 0,
            yOffset = (i % 2) !== 0 ? this.planetRadii : 0;
      const point1 = {x:planetGear.offset.x+xOffset, y:planetGear.offset.y-yOffset},
            point2 = {x:planetGear.offset.x-xOffset, y:planetGear.offset.y+yOffset}
      return new Line({parentElement, point1, point2, classList:["marker"]})
    });
    this.planetGearsRotations = this.planetGears.map((planetGear, i)=>{
      return new Rotation({point:planetGear.offset, rotateShapes:[this.planetGearsLines[i]]})
    });
    this.planetGearAxles = this.planetGears.map(p=>{
      return new Circle({
        parentElement, centerPoint:p.offset,
        radii:this.planetGearAxleRadii, classList:["axle"]
      })
    });
    this.carrierRotation = new Rotation({
      point: {x:centerPoint.x, y:centerPoint.y}, rotateShapes:[
        this.carrier, ...this.planetGears, ...this.planetGearAxles,
        ...this.planetGearsLines, ...this.planetGearsRotations,
        this.carrierLine
      ]
    });
    this.sunGear = new Circle({
      parentElement, centerPoint:this.outerCircle.offset,
      radii: this.sunRadii, classList:["sunGear"]
    });
    this.sunGearLines = [
      new Line({parentElement, classList:["marker"],
       point1:{x:centerPoint.x,y:centerPoint.y-this.sunRadii},
       point2:{x:centerPoint.x, y:centerPoint.y+this.sunRadii}
      }),
      new Line({parentElement, classList:["marker"],
       point1:{x:centerPoint.x+this.sunRadii, y:centerPoint.y},
       point2:{x:centerPoint.x-this.sunRadii, y:centerPoint.y}
      })
    ];
    this.sunGearRotation = new Rotation({
      point:this.sunGear.offset, rotateShapes:[
        ...this.sunGearLines,
      ]
    });
    this.sunGearAxle = new Circle({
      parentElement, centerPoint:this.sunGear.offset,
       radii:this.sunGearAxleRadii, classList:["axle"]
    });

    this._calcRatios();
    this.colorParts();
  }

  // color our parts
  colorParts() {
    const nodes = {
      sun: this.sunGear.node,
      carrier:this.carrier.node,
      ring: this.outerCircle.node
    };
    const parts = Object.entries(nodes);
    parts.forEach(([key,node])=>{
      node.classList.remove("forceIn");
      node.classList.remove("forceOut");
      node.classList.remove("locked");
      if (state.forceIn === key) node.classList.add("forceIn");
      else if (state.lock === key) node.classList.add("locked");
      else node.classList.add("forceOut");
    });
  }

  currentRatio() {
    return this.rotations[this._currentRotationKey()].out[0].ratio;
  }

  rotate(deg) {
    const key = this._currentRotationKey();

    this.rotations[key].in.angle = deg;
    this.rotations[key].out.forEach(r=>{
      r.rots.forEach(rot=>{
        rot.angle = deg * r.ratio;
      });
    });
  }

  _currentRotationKey() {
    const key = [this.state.forceIn, this.state.lock];
    return key[1] !== 'together' ? key.join('_lock_') : 'together';
  }

  // planetary ger ratio
  // nr⋅zr=nc⋅(zr+zs)–zs⋅ns
  // where n is rotations, z is number of koggs
  // r is ring gear
  // c is carrier
  // s is sun gear

  // example r=400, s=100

  // ring is locked, in at ns=1, nr=0 so..
  // 0⋅400=nc⋅(400+100)-100⋅1
  // 0=nc⋅500-100
  // 100=nc⋅500
  // 100/500=nc => 0.2:1

  // example2 sun is locked in at ring nr=1, ns=0
  // 1⋅400=nc⋅(400+100)-100⋅0
  // 400=nc⋅500-0
  // 400/500=nc => 0.8:1
  _calcRatios() {
    const ratios = {
      // driven / driving = ratio
      sun_lock_ring:     this.sunRadii / (this.ringRadii + this.sunRadii),
      sun_lock_carrier:  -this.sunRadii / this.ringRadii,
      ring_lock_sun:     this.ringRadii / (this.ringRadii + this.sunRadii),
      ring_lock_carrier: -this.ringRadii / this.sunRadii,
      carrier_lock_sun:  1 / (this.ringRadii / (this.ringRadii + this.sunRadii)),
      carrier_lock_ring: 1 / (this.sunRadii / (this.ringRadii + this.sunRadii)),
      together:          1,

      // only for implementation
      sun_to_planet:  this.sunRadii / this.planetRadii,
      sun_to_planet_carrier: (this.planetOffset / this.planetRadii) * (this.sunRadii / this.ringRadii),
      ring_to_planet:  this.ringRadii / this.planetRadii,
      ring_to_planet_carrier: (this.planetOffset / this.planetRadii) * (this.sunRadii / this.ringRadii),
      carrier_to_planet_sun: ((this.planetOffset-(this.planetOffset-this.ringRadii)) / this.planetRadii),
      carrier_to_planet_ring: ((this.planetOffset-(this.planetOffset-this.sunRadii)) / this.planetRadii),
    }

    this.rotations = {
      sun_lock_carrier: {in: this.sunGearRotation, out: [
        {rots:[this.rotRing], ratio:ratios.sun_lock_carrier},
        {rots:[...this.planetGearsRotations], ratio:-ratios.sun_to_planet}
      ]},
      sun_lock_ring: {in: this.sunGearRotation, out: [
        {rots:[this.carrierRotation], ratio: ratios.sun_lock_ring},
        {rots:[...this.planetGearsRotations], ratio:-ratios.sun_to_planet_carrier}
      ]},
      ring_lock_carrier:   {in: this.rotRing, out: [
        {rots:[this.sunGearRotation], ratio:ratios.ring_lock_carrier},
        {rots:[...this.planetGearsRotations], ratio:ratios.ring_to_planet}
      ]},
      ring_lock_sun:{in: this.rotRing, out: [
        {rots:[this.carrierRotation], ratio:ratios.ring_lock_sun},
        {rots:[...this.planetGearsRotations], ratio:ratios.ring_to_planet_carrier}
      ]},
      carrier_lock_ring: {in: this.carrierRotation, out:[
        {rots:[this.sunGearRotation], ratio:ratios.carrier_lock_ring},
        {rots:[...this.planetGearsRotations], ratio:-ratios.carrier_to_planet_sun}
      ]},
      carrier_lock_sun:{in: this.carrierRotation, out:[
        {rots:[this.rotRing], ratio:ratios.carrier_lock_sun},
        {rots:[...this.planetGearsRotations], ratio:ratios.carrier_to_planet_ring}
      ]},
      together: {in: this.sunGearRotation, out:[
        {rots:[this.rotRing, this.carrierRotation], ratio:ratios.together},
        {rots:[...this.planetGearsRotations], ratio:0}
      ]},
    }
  }
} // end class planetary gear

class InfoDisplay {
  constructor() {
    const root = this.node = document.createElement("section");
    root.classList.add("displayRoot");
    this.colors = document.createElement("div");
    root.appendChild(this.colors)
    document.body.appendChild(root);
  }

  update() {
    this.colors.innerHTML="";
    this._createExplainRows(this.colors);
    this._createRatio(this.node);
  }

  _createExplainRows(parent){
    const tr = {sun: "Solhjul", carrier: "Planethjulshållare", ring:"Ringhjul"};
    const takenKeys = [state.forceIn, state.lock];
    const outKey = Object.keys(tr).find(k=>takenKeys.indexOf(k)<0);
    return [
      {txt:"Låst", cssCls:"locked", stateKey:"lock"},
      {txt:"Kraft in", cssCls:"forceIn", stateKey:"forceIn"},
      {txt:"Kraft ut", cssCls:"forceOut", stateKey:"forceOut"},
    ].map(itm=>{
      const node = document.createElement("div");
      node.classList.add("displayItm");
      const color = document.createElement("div");
      color.classList.add(itm.cssCls, "partColor");
      node.appendChild(color);
      const key = itm.stateKey in state ? state[itm.stateKey] : outKey
      node.appendChild(document.createTextNode(`${itm.txt} ${tr[key]}`));
      parent.appendChild(node);
      return node;
    });
  }

  _createRatio(parent) {
    if (this.ratio)
      this.ratio.innerHTML = "";
    const node = this.ratio = document.createElement("div");
    const ratio = mainGear.currentRatio(),
          leftRatio = Math.round(1 * (1000 / ratio)) / 1000;
    node.textContent = `Utväxlingsförhållande ${leftRatio}:1`;
    parent.appendChild(node);
  }
}

let infoDisplay = new InfoDisplay(),
    mainGear;

function createMainGear() {
  mainGear = new PlanetaryGear({
    parentElement, centerPoint:{x:300,y:300}, holderWidth:35,
    planetGearAxleRadii:35, sunGearAxleRadii:50, state,
    sunRadii:state.sunRadii
  });
  infoDisplay.update();
  return mainGear;
}
mainGear = createMainGear();


// create radio buttons
function createRadioBtn(label, name, value, cb) {
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = name;
  radio.value = value;
  if (state[name] == value)
    radio.checked = true;
  radio.addEventListener("click", cb);

  const lbl = document.createElement("label");
  lbl.textContent = label;
  lbl.classList.add("toggleButton");
  lbl.appendChild(radio);
  return lbl;
}

let lockBtns = [], forceInBtns = [];

function createSelections(parent, key, oppositeKey, oppositeBtns, arrObjSelections) {
  const lockForceTwins = {
    sun: "ring", ring:"sun", carrier:"ring"
  }
  return arrObjSelections.map(o=>{
    const lblAndBtn = createRadioBtn(o.txt, key, o.vlu, (evt)=>{
      if (evt.target.value === state[oppositeKey]) {
        state[oppositeKey] = lockForceTwins[state[oppositeKey]];
        oppositeBtns.find(b=>b.value===state[oppositeKey]).checked = true;
      }
      state[key] = evt.target.value;
      mainGear.colorParts();
      infoDisplay.update();
      slider.focus();
    });
    parent.appendChild(lblAndBtn);
    return lblAndBtn.firstElementChild;
  });
}

forceInBtns.splice(0,0, ...createSelections(
  document.querySelector("#forceIn"), "forceIn", "lock", lockBtns, [
    {txt:"Solhjul", vlu:"sun"},
    {txt:"Ringhjul", vlu:"ring"},
    {txt:"Planethjulshållare", vlu:"carrier"}
  ]
));

lockBtns.splice(0,0, ...createSelections(
  document.querySelector("#lock"), "lock", "forceIn", forceInBtns, [
    {txt:"Solhjul", vlu:"sun"},
    {txt:"Ringhjul", vlu:"ring"},
    {txt:"Planethjulshållare", vlu:"carrier"},
    {txt:"2 ihopkopplade", vlu:"together"}]
));

// make it possible to change size of sungear
const sizeLbl = document.createElement("label");
sizeLbl.textContent = "Storlek på solhjul";
const spinner = document.createElement("input");
spinner.type = "number";
spinner.value = state.sunRadii;
spinner.min = minSunRadii;
spinner.max = maxSunRadii;
spinner.addEventListener("change", ()=>{
  if (+spinner.value !== state.sunRadii) {
    mainGear.node.parentElement.removeChild(mainGear.node);
    state.sunRadii = +spinner.value;
    mainGear = createMainGear();
  };
});
sizeLbl.appendChild(spinner);
document.querySelector("fieldset").appendChild(sizeLbl);


// rotate gear
slider.addEventListener("input", ()=>{
  slider.nextElementSibling.value = slider.value;
  mainGear.rotate(+slider.value);
});

slider.focus();
