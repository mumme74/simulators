"use strict";

export class Point {
  _x = 0;
  _y = 0;
  _pntRef = null;
  _onChangeCallback = null;
  _followPoint = null;
  _followPoints = [];

  constructor({x, y, svgPntRef = null, onChangeCallback, followPoint}) {
    this._x = !isNaN(x) ? x : svgPntRef ? svgPntRef.x : 0;
    this._y = !isNaN(y) ? y : svgPntRef ? svgPntRef.y : 0;
    this._pntRef = svgPntRef;
    this._onChangeCallback = onChangeCallback;
    if (followPoint)
      this.followPoint(followPoint);
  }

  get point() {
    return {x:this._x, y:this._y};
  }

  set point(arg) {
    if (this._followPoint)
      this._followPoint.point = arg;
    else if (Array.isArray(arg)) {
      if (this._x !== arg[0] || this._y !== arg[1]) {
        this._x = arg[0];
        this._y = arg[1];
        this._updated();
      }
    } else {
      if (this._x !== arg.x || this._y !== arg.y) {
        this._x = arg.x;
        this._y = arg.y;
        this._updated();
      }
    }
  }

  set x(xVlu) {
    if (this._followPoint)
      this._followPoint.x = xVlu;
    else if (this._x !== xVlu) {
      this._x = xVlu;
      this._updated();
    }
  }
  get x() {
    return this._x;
  }

  set y(yVlu) {
    if (this._followPoint)
      this._followPoint.y = yVlu;
    else if (this._y !== yVlu) {
      this._y = yVlu;
      this._updated();
    }
  }
  get y() {
    return this._y;
  }

  followPoint(point) {
    if (point instanceof Point) {
      // clear old point
      if (this._followPoint)
        this.followPoint(null);
      this._followPoint = point;
      point._followPoints.push(this);
      this._x = this._followPoint._x;
      this._y = this._followPoint._y;
      this._updated();
    } else if (!point && this._followPoint) {
      const idx = this._followPoint._followPoints.indexOf(this);
      if (idx > -1)
        this._followPoint._followPoints.splice(idx);
      this._followPoint = null;
    }
  }

  _updated() {
    if (this._pntRef) {
      this._pntRef.x = Math.round(this._x);
      this._pntRef.y = Math.round(this._y);
    }
    if (this._onChangeCallback)
      this._onChangeCallback();
    // update all our points that follow this point
    for(const pt of this._followPoints) {
      pt._x = this._x; pt._y = this._y;
      pt._updated();
    }
  }
}