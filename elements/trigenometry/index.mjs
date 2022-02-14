"use strict";

import { BaseShape, Polygon } from "../base.mjs";
import { Length } from "../length.mjs";
import { Point } from "../point.mjs";

export class Circle extends BaseShape {
  _radii = new Length({});

  constructor({parentElement, centerPoint={x:0,y:0}, radii=0, className}) {
    const root = document.createElementNS('http://www.w3.org/2000/svg', "circle");

    const points = [new Point({svgLenXRef:root.cx, svgLenYRef:root.cy})];
    points[0].point = centerPoint;
    super({parentElement, rootElement:root, points, className});

    this._radii._lenRef = root.r;
    this._radii.length = radii;
  }

  get radii() {
    return this._radii.length;
  }

  set radii(newRadii) {
    if (newRadii !== this._radii.length && !isNaN(newRadii))
      this._radii.length = newRadii;
  }
}

export class Triangle extends Polygon {

  constructor({parentElement, points = [], className = ""}) {
    for (let i = 0; i < 3; ++i)
      if (points.length === i)
       points.push({x:0, y:0});
    super({parentElement, points: points.slice(0,3), className});
  }

  // ensure we only set 3 points
  set points(points) {
    super.points = points.slice(0, 3);
  }

  get points() {
    return this._points;
  }
}

function buildPnts(startPoint, width) {
  const x = startPoint.x, y = startPoint.y;
  return [{x, y},
          {x: x+width, y},
          {x:x+width, y: y+width},
          {x, y:y+width},
  ];
}

export class Square extends Polygon {
  _width = new Length({});

  constructor({parentElement, startPoint = {x:0,y:0}, width = 0, className}) {
    width = Math.round(width);
    const pnts = buildPnts(startPoint, width);
    super({parentElement, points: pnts, className});
    this._width.length = width;
  }

  set width(newWidth) {
    this._width.length = Math.round(newWidth);
    this.points = buildPnts(this.offset, this._width.length);
  }

  get width() {
    return this._width.length;
  }
}
