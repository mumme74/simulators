"use strict";

import { Polyline } from "./base.mjs";
import { Point } from "./point.mjs";

export class Wire extends Polyline {
  constructor({parentElement, startPnt={x:0,y:0}, endPnt={x:0,y:0}, betweenPnts=[], className}) {
    let points = [
      new Point({x: startPnt.x, y: startPnt.y}),
      new Point({x: endPnt.x, y: endPnt.y})
    ];
    if (startPnt instanceof Point)
      points[0].followPoint = startPnt;
    if (endPnt instanceof Point)
      points[1].followPoint = endPnt;

    super({parentElement, points, className});

    this.recalculate.bound = this.recalculate.bind(this);
    points.forEach(p=>p._onChangeCallbacks.push(this.recalculate.bound))

    this.betweenPnts = betweenPnts;
  }

  setPoint(idx, newPoint) {
    if (idx < 0 || idx > this.points.length) return;
    const myPnt = this.points[idx];
    const isPnt = newPoint instanceof Point;
    if (myPnt.followPoint || isPnt)
      myPnt.followPoint = isPnt ? newPoint : null;
    else
      myPnt.point = newPoint;
  }

  get startPnt() {
    return this._points[0];
  }

  set startPnt(point) {
    this.setPoint(0, point);
  }

  get endPnt() {
    return this._points[this._points.length-1];
  }

  set endPnt(point) {
    this.setPoint(this._points.length-1, point);
  }

  get betweenPnts() {
    const endIdx = this._points.length-1;
    return this._points.filter((p,idx)=>idx!==0 && idx!==endIdx && p.pinned);
  }

  set betweenPnts(points) {
    points = points.map(p=>{
      if (!(p instanceof Point))
        p = new Point({x:p.x, y:p.y});
      p.pinned=true
      p.addChangeCallback(this.recalculate.bound);
      return p;
    });

    this.points = this._autoMiddlePoints(
      [this.startPnt, ...points, this.endPnt]);
  }

  // finds shortest distance and
  recalculate() {
    // find all pinned points
    const pinnedPts = [
      this.startPnt,
      ...this._points.filter(p=>p.pinned===true),
      this.endPnt
    ];

    this.points = this._autoMiddlePoints(pinnedPts);
  }

  /**
   * @brief find all points connected to this and attached wires
   *        should be to all components
   */
  connections() {
    const visited = [], endPts = [];
    // recursivly look up ends connected to all sub wires
    const endLookUp = (wire, point) => {
      for (const pnt of point.connectedPoints()) {
        if (pnt.owner instanceof Wire) {
          if (visited.indexOf(pnt) === -1) {
            visited.push(pnt);
            if (pnt.owner !== wire) {
              for (const p of pnt.owner._points)
                endLookUp(pnt.owner, p);
            }
          }
        } else if (endPts.indexOf(pnt) === -1)
          endPts.push(pnt);
      }
    }
    for (const p of this._points)
      endLookUp(this, p);

    return endPts;
  }

  _autoMiddlePoints(pinnedPts) {
    // track from first to last pinned points
    const newPts = [];
    let prevPnt = this.endPnt;

    for(let i = 0; i < pinnedPts.length-1; ++i) { // -1 to account for pt1 idx
      const pt0 = pinnedPts[i], pt1 = pinnedPts[i+1];
      const xDiff = pt1.x - pt0.x,
            yDiff = pt1.y - pt0.y;
      newPts.push(pt0);
      if (xDiff !== 0 && yDiff !== 0) {
        // insert a middle point between the 2
        let x, y;                   // p=prev, 0=pt0, n= new, 1=pt1
                                    //    p
                                    //    |
        if (prevPnt.x === pt0.x) {  //    0
          x = pt0.x;                //    |
          y = pt1.y;                //    n-1
        } else
          if (prevPnt.y === pt0.y) {  // p-0-n
          x = pt1.x;                  //     |
          y = pt0.y;                  //     1
        } else {
          x = (xDiff > yDiff) ? pt1.x : pt0.x;
          y = (xDiff > yDiff) ? pt0.y : pt1.y;
        }
        prevPnt = new Point({x, y,owner:this});
        newPts.push(prevPnt);
      } else
        prevPnt = pt0;
    }

    return [...newPts, pinnedPts[pinnedPts.length-1]];
  }
}
