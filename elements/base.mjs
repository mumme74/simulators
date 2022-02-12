"use strict";

import { Point } from "./point.mjs";

export class BaseShape {
  offset = null;
  _points = [];

  constructor({parentElement, rootElement, startPoint, className}) {
    this.offset = startPoint;
    this._points.push(startPoint);
    this.node = rootElement;
    this.node.setAttribute("class", className);
    parentElement.appendChild(this.node);
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

export class Polygon extends BaseShape {

  constructor({parentElement, points, className}) {
    const rootElement = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(" "));
    const svgPts = rootElement.points;
    const pt = new Point({svgPntRef: svgPts[0]});

    super({parentElement, rootElement, startPoint: pt, className});

    for(let i = 1; i < svgPts.length; ++i)
        this._points.push(new Point({svgPntRef: svgPts[i]}));
  }
}