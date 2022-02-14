"use strict";

import { BaseShape } from "../base.mjs";
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