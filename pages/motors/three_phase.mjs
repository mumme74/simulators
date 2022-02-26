"use strict";

import { Circle } from "../../lib/trigenometry/index.mjs";
import { Line, Text } from "../../lib/base.mjs";
import { Point } from "../../lib/point.mjs";
import { Rotation } from "../../lib/rotation.mjs";
import { Wave } from "../../lib/diagrams/index.mjs";

const maxDeg = 720;
const vlu = [
  {deg:0, rad:0, sin:0, cos:1},
  {deg:120, rad:(120/180)*Math.PI,
    sin:Math.sin((120/180)*Math.PI),
    cos:Math.cos((120/180)*Math.PI)},
  {deg:240, rad:(240/180)*Math.PI,
    sin:Math.sin((240/180)*Math.PI),
    cos:Math.cos((240/180)*Math.PI)},
];

const parentElement = document.querySelector("svg");
const slider = document.querySelector("input[type=range]");
const showTexts = document.querySelector("#showTexts");

const vLine = new Line({parentElement, point1:{x:450,y:50}, point2:{x:450,y:250}}),
      hLine = new Line({parentElement, point1:{x:450,y:150}, point2:{x:850,y:150}});

const circle = new Circle({
  parentElement, centerPoint:{x:180,y:150},
  radii:100, classList:["circle"]});
const circleX = circle.offset.x,
      circleY = circle.offset.y,
      waveXScale = (circle.radii * 2) / 360;


// the points that rotate
const sinPts = [
  new Point({}), new Point({}), new Point({}),
].map((pnt,i)=>{
  const radii = circle.radii;
  const x = Math.round(vlu[i].cos*radii + circleX),
        y = Math.round(-vlu[i].sin*radii + circleY);
  pnt.point = [x,y];
    const radFactor = Math.PI / 180,
          degOffset = 120 * i;

  pnt.addChangeCallback((p)=>{
    // move ruler
    const vl = vlu[i];
    const xOffset = Math.round((vl.deg - degOffset)*(180/circle.radii))
    const x = waves[i].offset.x + ((vl.deg - degOffset) * waveXScale);
    const ruler = rulers[i],
          data = waveDatas[i];
    ruler.point2.point = [x, p.y];
    // update wave
    for(let j = 0; j < vlu[0].deg; ++j)
      // +1 to make sure we have a 0 at begin
      data[j+1] = Math.sin((j + degOffset) * radFactor);

    const deg = vl.deg - degOffset;
    data[deg+1] = vl.sin;
    data.fill(0, Math.min(deg + 2, 721));

    // update texts
    const pkV = Math.round(vl.sin*(230*Math.sqrt(2)));
    textsPk[i].text = showTexts.checked ? `Fas-${i} ${pkV}V topp-noll` : '';
    textsMean[i].text = showTexts.checked ? `${Math.round(pkV/Math.sqrt(2))} V AC` : '';
  });
  return pnt;
});

//The lines that rotate with the points
const rotLines = sinPts.map((pnt, i)=>{
  return new Line({parentElement, point1:pnt,
    point2:circle.offset, classList:["phase"]+i});
});
// the rulers for the phases
const rulers = sinPts.map((pnt,i)=>{
  return new Line({parentElement, point1:pnt,
    classList: ["ruler"+i],
                   point2:{x:hLine.offset.x, y:pnt.y}});
});

const axle = new Circle({
  parentElement, centerPoint:circle.offset,
  radii: 10, classList:["axle"]
});

// the waves
const waves = [
  // phase 0
  new Wave({parentElement, offset:hLine.offset,
    // +2 to make suer we have 0 at both begin and end
    classList:["wave0"], dataPoints:Array(maxDeg+2).fill(0),
      yScale:100, xScale: waveXScale}),
  // phase 1
  new Wave({parentElement, offset:hLine.offset,
    classList:["wave1"], dataPoints:Array(maxDeg+2).fill(0),
      yScale:100, xScale: waveXScale}),
  // phase 2
  new Wave({parentElement, offset:hLine.offset,
    classList:["wave2"], dataPoints:Array(maxDeg+2).fill(0),
      yScale:100, xScale: waveXScale}),
];

// the arrow witch shows min max values
const arrows = [
  new Line({
    parentElement,
    point1: {x:circleX + circle.radii + 80, y:circleY},
    point2: {x:circleX + circle.radii + 80, y:circleY-vlu[1].sin * circle.radii+10}
  }),
  new Line({
    parentElement,
    point1: {x:circleX + circle.radii + 80, y:circleY},
    point2: {x:circleX + circle.radii + 80, y:circleY-vlu[2].sin * circle.radii-10}
  }),
].map(a=>{
  a.node.setAttribute("marker-end", "url(#triangle)");
  return a;
});

const arrowText = new Text({parentElement, followPoint:arrows[0].point1, offsetX:-70, offsetY:120});

sinPts[0].addChangeCallback(()=>{
  const lowSin = Math.min(Math.min(vlu[0].sin, vlu[1].sin), vlu[2].sin),
        highSin = Math.max(Math.max(vlu[0].sin, vlu[1].sin), vlu[2].sin);
  arrows[0].point2.y = circleY - lowSin * circle.radii - 10;
  arrows[1].point2.y = circleY - highSin * circle.radii + 10;
  const pkV = Math.round((highSin-lowSin)*(230*Math.sqrt(2)));
  arrowText.text = `${pkV}V topp-topp ${Math.round((highSin-lowSin)*230)} V AC`;
})

// the texts
const textsPk = rulers.map(r=>r.point2).map((pnt,i)=>{
  return new Text({parentElement, text:`Fas-${i}`,
                   followPoint: pnt, offsetX:-200, offsetY:-8});
});
const textsMean = rulers.map(r=>r.point2).map((pnt,i)=>{
  return new Text({parentElement, followPoint:pnt, offsetX:-160, offsetY:13})
})

const waveDatas = waves.map(w=>w.dataPoints);

// update events from slider
slider.addEventListener("input", ()=>{
  const deg = +slider.value;
  slider.nextElementSibling.value = deg;
  const radii = circle.radii;

  sinPts.forEach((pnt,i)=>{
    const vl = vlu[i];
    vl.deg = i * 120 + deg;
    vl.rad = (vl.deg / 180) * Math.PI;
    vl.sin = Math.sin(vl.rad);
    vl.cos = Math.cos(vl.rad);
    if (vl.sin < 0.01 && vl.sin > -0.01) vl.sin = 0.0;
    if (vl.cos < 0.01 && vl.cos > -0.01) vl.cos = 0.0;

    pnt.point = [circleX + vl.cos * radii, circleY - vl.sin * radii];
  });
});
