"use strict";
import { Polygon } from "../base.mjs";
import { Point } from "../point.mjs";

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