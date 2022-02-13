"use strict";

import { Point } from "./point.mjs";

export class BaseShape {
  offset = null;
  _points = [];

  constructor({parentElement, rootElement, points, className}) {
    for (let i = 0; i < points.length; ++i) {
      const pt = points[i];
      if (pt instanceof Point)
        this._points.push(pt);
      else {
        const svgPntRef = rootElement?.points[i];
        this._points.push(new Point({x:pt.x, y:pt.y, svgPntRef}));
      }
    }
    this.offset = this._points[0];
    this.node = rootElement;
    this.node.setAttribute("class", className);
    parentElement.appendChild(this.node);
  }

  move(newPoint) {
    const newX = Array.isArray(newPoint) ? newPoint[0] : newPoint.x,
          newY = Array.isArray(newPoint) ? newPoint[1] : newPoint.y;
    const xDiff = !isNaN(newX) ? newX - this.offset.x : 0,
          yDiff = !isNaN(newY) ? newY - this.offset.y : 0;
    for(const pt of this._points)
      pt.point = [pt.x + xDiff, pt.y + yDiff];
  }

  scale({factor=1, xFactor=null, yFactor=null}) {
    xFactor = xFactor === null ? factor : xFactor;
    yFactor = yFactor === null ? factor : yFactor;

    // dont move our scaled object, only scale it
    const anchorPt = this._points[0];
    const xDiff = (anchorPt.x * xFactor) - anchorPt.x,
          yDiff = (anchorPt.y * yFactor) - anchorPt.y;

    for(let i = 1; i < this._points.length; ++i) {
      const pt = this._points[i];
      pt.point = [
        pt.x * xFactor - xDiff,
        pt.y * yFactor - yDiff
      ];
    }
  }

  get points() {
    return this._points;
  }

  set points(points) {
    let newIter = 0;
    for (const pt of this.points) {
      if (points.length === newIter) break;
      const newPt = points[newIter++];
      const x = !isNaN(newPt.x) ? newPt.x : 0,
            y = !isNaN(newPt.y) ? newPt.y : 0;
      pt.point = {x, y};
    }
  }
}

export class Polygon extends BaseShape {

  constructor({parentElement, points, className}) {
    const rootElement = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(" "));

    super({parentElement, rootElement, points: rootElement.points, className});
  }
}