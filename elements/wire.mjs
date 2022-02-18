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
      points[0].followPoint(startPnt);
    if (endPnt instanceof Point)
      points[1].followPoint(endPnt);

    super({parentElement, points, className});

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
    let i = 0;
    for (; i < Math.min(points.length, this._points.length); ++i)
      this._points[i].point = points[i];
    // delete old pnts that is are not needed
    while(Math.max(i,2) < this._points.length) { // we rely on removeitem shortens array
      const pt = this._points[i];
      pt.detachEverything();
      this.removePoint(pt);
    }
    if (i < points.length) {
      // insert new ones
      const startPnt = this.startPnt, endPnt = this.endPnt;
      for(;i < points.length; ++i) {
        const pt = points[i];
        if ((pt.x === startPnt && pt.y === startPnt.y) ||
            (pt.x === endPnt.x && pt.y === endPnt.y))
            continue; // don't insert a between point over start or endPoints
        this.insertPoint(
          this._createBetweenPnt(pt.x, pt.y, true), i+1); // +1 to not mess with startPoint
      }
    }
    this.recalculate();
  }

  // finds shortest distance and
  recalculate() {
    // find all pinned points
    const pinnedPts = [this.startPnt];
    for(let i = 0; i < this._points.length; ++i) {
      const pt = this._points[i];
      if (pt.pinned) pinnedPts.push(pt); // i+1 for startPnt not accounted for
    }
    pinnedPts.push(this.endPnt);

    // track from first to last pinned points
    const newPts = [];
    for(let i = 0; i < pinnedPts.length-1; ++i) { // -1 to account for pt1 idx
      const pt0 = pinnedPts[i], pt1 = pinnedPts[i+1];
      const xDiff = pt1.x - pt0.x,
            yDiff = pt1.y - pt0.y;
      newPts.push(pt0);
      if (xDiff !== 0 && yDiff !== 0) {
        // insert a middle point between the 2
        const x = (xDiff > yDiff) ? pt1.x : pt0.x;
        const y = (xDiff > yDiff) ? pt0.y : pt1.y;
        newPts.push(this._createBetweenPnt(x, y, false));
      }
      newPts.push(pt1);
    }
    this.points = newPts;
  }

  /**
   * @brief find all points connected to this and attached wires
   *        should be to all components
   */
  connections() {
    const visited = [], endPts = [];
    // recursivly look up ends connected to all sub wires
    const endLookUp = (wire, whichEnd) => {
      for (const pnt of wire[whichEnd].connectedPoints()) {
        if (pnt.owner instanceof Wire) {
          if (visited.indexOf(pnt) === -1) {
            visited.push(pnt);
            endLookUp(pnt.owner, whichEnd);
          }
        } else if (endPts.indexOf(pnt) === -1)
          endPts.push(pnt);
      }
    }
    endLookUp(this, 'startPnt');
    endLookUp(this, 'endPnt');

    return endPts;
  }

  _createBetweenPnt(x, y, pinned) {
    const svgPt = this._svgElem.createSVGPoint();
    svgPt.x = x; svgPt.y = y;
    const newPt = new Point({svgPntRef:svgPt, owner:this});
    newPt.pinned = pinned;
    return newPt;
  }
}
