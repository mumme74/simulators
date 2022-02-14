"use strict";

import { Polygon } from "../base.mjs"
import { Length } from "../length.mjs";
import { Point } from "../point.mjs";
import { observeObject } from "../../helpers/index.mjs";

export class Wave extends Polygon {
  _xScale = 1;
  _yScale = 1;
  // need to specialcase offset here as point[0] might move with data
  _offset = null;
  constructor({parentElement, offset={x:0,y:0}, className,
              dataPoints=[], xScale=1, yScale=1}) {
    super({parentElement, points:[offset], className});

    this._xScale = xScale;
    this._yScale = yScale;

    if (offset instanceof Point)
      this._offset = offset;
    else if (offset instanceof SVGPoint)
      this._offset = new Point({svgPntRef: offset});
    else
      this._offset = new Point({x:offset.x, y: offset.y});

    this._dataPoints = observeObject(
        this._dataPointDeleted.bind(this),
        this._dataPointChanged.bind(this),
        dataPoints
    );

    // set initial values
    let pnts = [];
    for (let i = 0; i < dataPoints.length; ++i)
      pnts.push(this._genPnt(dataPoints[i], i));
    this.points = pnts;
  }

  get dataPoints() {
    return this._dataPoints;
  }

  get offset() {
    return this._offset;
  }

  set offset(newOffset) {
    this._offset.point = newOffset;
  }

  _genPnt(vlu, idx) {
    return {
      x:this.offset.x + idx * this._xScale,
      y:this.offset.y + vlu * this._yScale
    };
  }

  _dataPointChanged(target, property, value) {
    const idx = +property;
    if (idx >= this.points.length)
      this.insertPoint(this._genPnt(value, idx));
    else
      this.points[idx].point = this._genPnt(value, idx);
  }

  _dataPointDeleted(target, property) {
    const idx = +property;
    if (idx <= this.points.length)
      this.removePoint(idx);
  }
}