"use strict";

import { Length } from "./length.mjs";

export class Point {
  _x = new Length({});
  _y = new Length({});
  _pntRef = null;
  _onChangeCallbacks = [];
  _followPoint = null;
  _followPoints = [];

  constructor({x, y, svgPntRef = null, owner=null,
              svgLenXRef, svgLenYRef,
              onChangeCallback, followPoint}) {
    this.owner = owner;
    if (svgLenXRef) {
      this._x._lenRef = svgLenXRef;
      this._x.length = svgLenXRef.baseVal.value;
    } else
      this._x.length = !isNaN(x) ? x : svgPntRef ? svgPntRef.x : 0;

    if (svgLenYRef) {
      this._y._lenRef = svgLenYRef;
      this._y.length = svgLenYRef.baseVal.value;
    } else
      this._y.length = !isNaN(y) ? y : svgPntRef ? svgPntRef.y : 0;

    this._pntRef = svgPntRef;
    if (onChangeCallback)
      this._onChangeCallbacks.push(onChangeCallback);

    if (followPoint)
      this.followPoint = followPoint;
  }

  get point() {
    return {x:this._x.length, y:this._y.length};
  }

  set point(arg) {
    if (this._followPoint)
      this._followPoint.point = arg;
    else if (Array.isArray(arg)) {
      if (this._x.length !== arg[0] || this._y.length !== arg[1]) {
        this._x.length = arg[0];
        this._y.length = arg[1];
        this._updated();
      }
    } else {
      if (this._x.length !== arg.x || this._y.length !== arg.y) {
        this._x.length = arg.x;
        this._y.length = arg.y;
        this._updated();
      }
    }
  }

  set x(xVlu) {
    if (this._followPoint)
      this._followPoint.x = xVlu;
    else if (this._x.length !== xVlu) {
      this._x.length = xVlu;
      this._updated();
    }
  }
  get x() {
    return this._x.length;
  }

  set y(yVlu) {
    if (this._followPoint)
      this._followPoint.y = yVlu;
    else if (this._y.length !== yVlu) {
      this._y.length = yVlu;
      this._updated();
    }
  }
  get y() {
    return this._y.length;
  }

  get followPoint(){
    return this._followPoint;
  }

  set followPoint(point) {
    if (point instanceof Point) {
      // clear old point
      if (this._followPoint)
        this.followPoint = null;
      this._followPoint = point;
      point._followPoints.push(this);
      this._x.length = this._followPoint._x.length;
      this._y.length = this._followPoint._y.length;
      this._updated();
    } else if (!point && this._followPoint) {
      const idx = this._followPoint._followPoints.indexOf(this);
      if (idx > -1)
        this._followPoint._followPoints.splice(idx);
      this._followPoint = null;
    }
  }

  addChangeCallback(cb) {
    this._onChangeCallbacks.push(cb);
  }

  removeChangeCallback(cb) {
    const idx = this._onChangeCallbacks.indexOf(cb);
    if (idx !== null && idx > -1)
      this._onChangeCallbacks.splice(idx, 1);
  }

  detachEverything() {
    for(const trackPt of this._followPoints)
      trackPt._followPoint = null;
    this._followPoints.splice(0);
  }

  _updated() {
    if (this._pntRef) {
      this._pntRef.x = Math.round(this._x.length);
      this._pntRef.y = Math.round(this._y.length);
    }
    // call event listeners
    if (this._onChangeCallbacks.length) {
      for(const cb of this._onChangeCallbacks)
        cb();
    }
    // update all our points that follow this point
    if (this._followPoints.length) {
      for(const pt of this._followPoints) {
        pt._x.length = this._x.length;
        pt._y.length = this._y.length;
        pt._updated();
      }
    }
  }
}