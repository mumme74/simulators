"use strict";

import { Point } from "./point.mjs";

export class BaseShape {
  offset = null;

  constructor({parentElement, rootElement, startPoint, className}) {
    this.offset = startPoint;
    this.node = rootElement;
    this.node.setAttribute("class", className);
    parentElement.appendChild(this.node);
  }
}

export class Polygon extends BaseShape {
  _points = [];

  constructor({parentElement, points, className}) {
    const rootElement = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(" "));
    const svgPts = rootElement.points;
    super({parentElement, rootElement, startPoint: svgPts[0], className});

    for(const svgPt of svgPts)
      this._points.push(new Point({svgPntRef: svgPt}));
  }

  get points() {
    return this._points;
  }

  set points(points) {
    for (const pt of this.points) {
      const x = !isNaN(pt.x) ? pt.x : 0,
            y = !isNaN(pt.y) ? pt.y : 0;
      this._points.setPoint({x, y});
    }
  }
}