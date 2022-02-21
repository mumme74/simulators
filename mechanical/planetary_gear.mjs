"use strict";

import { Circle } from "../elements/trigenometry/index.mjs";
import { Rotation } from "../elements/rotation.mjs";
import { Line, Polygon } from "../elements/base.mjs";
import { StateFromHash } from "../helpers/index.mjs";


const maxDeg = 1440;
const parentElement = document.querySelector("svg");

const slider = document.querySelector("input[type=range]");
slider.max = maxDeg;

const stateObj = new StateFromHash(),
      state = stateObj.ref;

const outerCircle = new Circle({
        parentElement, centerPoint:{x:300,y:300},
        radii:240, className: "ringGear"
});

const midPointX = outerCircle.offset.x,
      midPointY = outerCircle.offset.y,
      sunRadii = 90,
      ringRadii = outerCircle.radii - 10,
      planetRadii = ringRadii / 2 - sunRadii / 2,
      planetOffset = sunRadii + planetRadii,
      holderWidth = 45,
      planetGearAxleRadii = 35,
      sunGearAxleRadii = 50;

const ringLines = [
  new Line({parentElement, className:"marker",
    point1: {x:midPointX-outerCircle.radii, y:midPointY},
    point2:{x:midPointX+outerCircle.radii, y:midPointY},
  }),
  new Line({parentElement, className:"marker",
    point1: {y:midPointY-outerCircle.radii, x:midPointX},
    point2:{y:midPointY+outerCircle.radii, x:midPointX},
  }),
];
const rotRing = new Rotation({x:midPointX,y:midPointY,rotateShapes:ringLines});

const ringGear = new Circle({
        parentElement, centerPoint:outerCircle.offset,
        radii: ringRadii, className: "inner"}),
      carrier = new Polygon({parentElement,points:[
        {x:midPointX+planetOffset,y:midPointY-holderWidth},
        {x:midPointX+holderWidth, y:midPointY-holderWidth},
        {x:midPointX+holderWidth, y:midPointY-planetOffset},
        {x:midPointX-holderWidth, y:midPointY-planetOffset},
        {x:midPointX-holderWidth, y:midPointY-holderWidth},
        {x:midPointX-planetOffset, y:midPointY-holderWidth},
        {x:midPointX-planetOffset, y:midPointY+holderWidth},
        {x:midPointX-holderWidth, y:midPointY+holderWidth},
        {x:midPointX-holderWidth, y:midPointY+planetOffset},
        {x:midPointX+holderWidth, y:midPointY+planetOffset},
        {x:midPointX+holderWidth, y:midPointY+holderWidth},
        {x:midPointX+planetOffset, y:midPointY+holderWidth}
      ], className:"planetaryHolder"}),
      carrierLine = new Line({parentElement,
        point1: {x:midPointX, y:midPointY-outerCircle.radii-5},
        point2:{x:midPointX, y:midPointY-outerCircle.radii-15}
      }),
      planetGears = [
        new Circle({parentElement,
          centerPoint:{x:midPointX+planetOffset, y:midPointY},
          radii:planetRadii, className:"planetaryGear"}),
        new Circle({parentElement,
          centerPoint:{x:midPointX, y:midPointY-sunRadii-planetRadii},
          radii:planetRadii, className:"planetaryGear"}),
        new Circle({parentElement,
          centerPoint:{x:midPointX-sunRadii-planetRadii, y:midPointY},
          radii:planetRadii, className:"planetaryGear"}),
        new Circle({parentElement,
          centerPoint:{x:midPointX, y:midPointY+planetOffset},
          radii:planetRadii, className:"planetaryGear"}),
      ],
      planetGearsLines = planetGears.map((planetGear, i)=>{
        const xOffset = (i % 2) === 0 ? planetRadii : 0,
              yOffset = (i % 2) !== 0 ? planetRadii : 0;
        const point1 = {x:planetGear.offset.x+xOffset, y:planetGear.offset.y-yOffset},
              point2 = {x:planetGear.offset.x-xOffset, y:planetGear.offset.y+yOffset}
        return new Line({parentElement, point1, point2, className:"marker"})
      }),
      planetGearsRotations = planetGears.map((planetGear, i)=>{
        return new Rotation({point:planetGear.offset, rotateShapes:[planetGearsLines[i]]})
      }),
      planetGearAxles = planetGears.map(p=>{
        return new Circle({
          parentElement, centerPoint:p.offset,
          radii:planetGearAxleRadii, className:"axle"
        })
      }),
      carrierRotation = new Rotation({
        point: {x:midPointX, y:midPointY}, rotateShapes:[
          carrier, ...planetGears, ...planetGearAxles,
          ...planetGearsLines, ...planetGearsRotations,
          carrierLine
        ]
      }),
      sunGear = new Circle({
        parentElement, centerPoint:outerCircle.offset,
        radii: sunRadii, className:"sunGear"
      }),
      sunGearLines = [
        new Line({parentElement, className:"marker",
         point1:{x:midPointX,y:midPointY-sunRadii},
         point2:{x:midPointX, y:midPointY+sunRadii}
        }),
        new Line({parentElement, className:"marker",
         point1:{x:midPointX+sunRadii, y:midPointY},
         point2:{x:midPointX-sunRadii, y:midPointY}
        })
      ],
      sunGearRotation = new Rotation({
        point:sunGear.offset, rotateShapes:[
          ...sunGearLines,
        ]
      }),
      sunGearAxle = new Circle({
        parentElement, centerPoint:sunGear.offset,
         radii:sunGearAxleRadii, className:"axle"
      });

/*
// system state from reload
const state = {
  forceIn: "ring", lock: "carrier",
  $set(name, value) {
    state[name] = value;
    location.hash = Object.entries(state).map(a=>{
      if (a[0].indexOf('$') < 0)
        return `${a[0]}=${a[1]}`;
    }).filter(p=>p).join("&");
  },
  $init: ()=>{
    if (location.hash.length > 5) {
      location.hash.substring(1).split("&").forEach(itm=>{
        const pair = itm.split("=");
        if (pair.length > 1) state[pair[0]] = pair[1];
      });
    }
  }
}
state.$init();
*/

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

const lockForceTwins = {
  sun: "ring", ring:"sun", carrier:"ring"
}

const forceInBtns = [{txt:"Solhjul", vlu:"sun"},{txt:"Ringhjul", vlu:"ring"},
 {txt:"Planethjulshållare", vlu:"carrier"}].map(o=>{
   const parent = document.querySelector("#forceIn");
   const lblAndBtn = createRadioBtn(o.txt, "forceIn", o.vlu, (evt)=>{
     if (evt.target.value === state.lock) {
       state.lock = lockForceTwins[state.lock];
       lockBtns.find(b=>b.value===state.lock).checked = true;
     }
     state.forceIn = evt.target.value;
     slider.focus();
   });
   parent.appendChild(lblAndBtn);
   return lblAndBtn.firstElementChild;
 });

 const lockBtns = [{txt:"Solhjul", vlu:"sun"},{txt:"Ringhjul", vlu:"ring"},
 {txt:"Planethjulshållare", vlu:"carrier"},
 {txt:"2 ihopkopplade", vlu:"together"}].map(o=>{
   const parent = document.querySelector("#lock");
   const lblAndBtn = createRadioBtn(o.txt, "lock", o.vlu, (evt)=>{
     if (evt.target.value === state.forceIn) {
       state.forceIn = lockForceTwins[state.forceIn];
       forceInBtns.find(b=>b.value===state.forceIn).checked = true;
     }
     state.lock = evt.target.value;
     slider.focus();
   });
   parent.appendChild(lblAndBtn);
   return lblAndBtn.firstElementChild;
 });
const planetToRingRatio = planetOffset / ringRadii,
      planetToSunRatio  = planetOffset / sunRadii;

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

const ratios = {
  // driven / driving = ratio
  sun_lock_ring:     sunRadii / (ringRadii + sunRadii),
  sun_lock_carrier:  -sunRadii / ringRadii,
  ring_lock_sun:     ringRadii / (ringRadii + sunRadii),
  ring_lock_carrier: -ringRadii / sunRadii,
  carrier_lock_sun:  1 / (ringRadii / (ringRadii + sunRadii)),
  carrier_lock_ring: 1 / (sunRadii / (ringRadii + sunRadii)),
  together:          1,

  // only for implementation
  sun_to_planet:  sunRadii / planetRadii,
  sun_to_planet_carrier: (planetOffset / planetRadii) * (sunRadii / ringRadii),
  ring_to_planet:  ringRadii / planetRadii,
  ring_to_planet_carrier: (planetOffset / planetRadii) * (sunRadii / ringRadii),
  carrier_to_planet_sun: ((planetOffset-(planetOffset-ringRadii)) / planetRadii),
  carrier_to_planet_ring: ((planetOffset-(planetOffset-sunRadii)) / planetRadii),
}

const rotations = {
  sun_lock_carrier: {in: sunGearRotation, out: [
    {rots:[rotRing], ratio:ratios.sun_lock_carrier},
    {rots:[...planetGearsRotations], ratio:-ratios.sun_to_planet}
  ]},
  sun_lock_ring: {in: sunGearRotation, out: [
    {rots:[carrierRotation], ratio: ratios.sun_lock_ring},
    {rots:[...planetGearsRotations], ratio:-ratios.sun_to_planet_carrier}
  ]},
  ring_lock_carrier:   {in: rotRing, out: [
    {rots:[sunGearRotation], ratio:ratios.ring_lock_carrier},
    {rots:[...planetGearsRotations], ratio:ratios.ring_to_planet}
  ]},
  ring_lock_sun:{in: rotRing, out: [
    {rots:[carrierRotation], ratio:ratios.ring_lock_sun},
    {rots:[...planetGearsRotations], ratio:ratios.ring_to_planet_carrier}
  ]},
  carrier_lock_ring: {in: carrierRotation, out:[
    {rots:[sunGearRotation], ratio:ratios.carrier_lock_ring},
    {rots:[...planetGearsRotations], ratio:-ratios.carrier_to_planet_sun}
  ]},
  carrier_lock_sun:{in: carrierRotation, out:[
    {rots:[rotRing], ratio:ratios.carrier_lock_sun},
    {rots:[...planetGearsRotations], ratio:ratios.carrier_to_planet_ring}
  ]},
  together: {in: sunGearRotation, out:[
    {rots:[rotRing, carrierRotation], ratio:ratios.together},
    {rots:[...planetGearsRotations], ratio:0}
  ]},
}


slider.addEventListener("input", ()=>{
  slider.nextElementSibling.value = slider.value;
  const deg = +slider.value;

  // get ratio
  let key = [state.forceIn, state.lock];
  key = key[1] !== 'together' ? key.join('_lock_') : 'together';

  rotations[key].in.angle = deg;
  rotations[key].out.forEach(r=>{
    r.rots.forEach(rot=>{
      rot.angle = deg * r.ratio;
    });
  });
});

slider.focus();
