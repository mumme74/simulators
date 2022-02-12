"use strict";
import { Polygon } from "../base.mjs";

function buildPnts(startPoint, width) {
  const x = startPoint.x, y = startPoint.y;
  return [{x, y},
          {x: x+width, y},
          {x, y:y+width},
          {x:x+width, y: y.width}
  ];
}

export class Square extends Polygon {
  _width = 0;

  constructor({parentElement, startPoint, width, className}) {
    width = Math.round(width);
    const pnts = buildPnts(startPoint);
    super({parentElement, points: pnts, className});
    this._width = width;
  }

  set width(newWidth) {
    this._width = Math.round(newWidth);
    this.points = buildPnts(this.offset, this._width);
  }

  get width() {
    return this._width;
  }
}
