import { Triangle, Circle } from '../../lib/trigenometry/index.mjs';
import { Text, Line } from '../../lib/base.mjs';
import { Point } from '../../lib/point.mjs';
import { Wave } from '../../lib/diagrams/index.mjs';
import { toFraction } from '../../lib/helpers/index.mjs';

const vlu = { deg:0, rad:0, sin:0, cos:1 };
const maxDeg = 720;

// create graphical elements
const parentElement = document.querySelector("svg");
const vLine = new Line({parentElement, point1:{x:450,y:50}, point2:{x:450,y:250}}),
      hLine = new Line({parentElement, point1:{x:450,y:150}, point2:{x:850,y:150}});

const circle = new Circle({
  parentElement, centerPoint:{x:180,y:150},
  radii:100, classList:["circle"]});
const circleX = circle.offset.x,
      circleY = circle.offset.y,
      waveXScale = (circle.radii * 2) / 360;

const sinPt = new Point({x:circleX + circle.radii, y:circleY}),
      cosPt = new Point({x:sinPt.x, y:sinPt.y});
const triangle = new Triangle({parentElement, classList:["triangle"], points:[
                    circle.offset, cosPt, sinPt]}),
      wave = new Wave({parentElement, offset:hLine.offset,
        classList:["wave"], dataPoints:Array(maxDeg).fill(0), yScale:100, xScale: waveXScale});
const degTxt = new Text({parentElement, text:"deg: 0°", followPoint:sinPt, offsetX:10, offsetY:-30}),
      radianTxt = new Text({parentElement, text:"radian", followPoint:sinPt, offsetX:10, offsetY:-8}),
      sinTxt = new Text({parentElement, text:"sin", followPoint:sinPt, offsetX:10, offsetY:15}),
      cosTxt = new Text({parentElement, text:"cos", followPoint:cosPt, offsetX:-65, offsetY:15});
const ruler = new Line({parentElement, point1:new Point({followPoint:sinPt}), classList: ["ruler"],
                        point2:{x:hLine.offset.x, y:hLine.offset.y}});

const waveData = wave.dataPoints;

sinPt.addChangeCallback(()=>{
  cosPt.x = sinPt.x;
  // move ruler
  const x = wave.offset.x + vlu.deg * waveXScale;
  ruler.point2.point = [x, sinPt.y];
  // update wave
  const radFactor = Math.PI / 180;
  for(let i = 0; i < vlu.deg; ++i)
    waveData[i] = Math.sin(i * radFactor);
  waveData[vlu.deg] = vlu.sin;
  waveData.fill(0, vlu.deg+1);
  // update texts
  const frac = toFraction({vlu:vlu.rad / Math.PI});
  const intStr = frac.int > 0 ? ''+frac.int : '',
        frStr = frac.num > 0 ? `${frac.num}/${frac.den}`: "";
  degTxt.text = `deg: ${vlu.deg}°`;
  radianTxt.text = `radian: ${intStr} ${frStr}&pi; (${vlu.rad.toPrecision(3)})`;
  sinTxt.text = `sin: ${vlu.sin.toPrecision(3)}`;
  cosTxt.text = `cos: ${vlu.cos.toPrecision(3)}`;
});

const slider = document.querySelector("input[type=range]");

slider.addEventListener("input", function(evt) {
  vlu.deg = +this.value;
  vlu.rad = (+this.value) * (Math.PI / 180);
  vlu.sin = Math.sin(vlu.rad);
  vlu.cos = Math.cos(vlu.rad);
  if (vlu.sin < 0.01 && vlu.sin > -0.01) vlu.sin = 0.0;
  if (vlu.cos < 0.01 && vlu.cos > -0.01) vlu.cos = 0.0;

  const radii = circle.radii;
  sinPt.point = [circleX + vlu.cos * radii, circleY - vlu.sin * radii];
});