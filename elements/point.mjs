"use strict";

export class Point {
  _x = 0;
  _y = 0;

  constructor({x, y, svgPntRef = null}) {
    this._x = !isNaN(x) ? x : svgPntRef ? svgPntRef.x : 0;
    this._y = !isNaN(y) ? y : svgPntRef ? svgPntRef.y : 0;
    this._pntRef = svgPntRef;
  }

  get point() {
    return {x:this._x, y:this._y};
  }

  set point(arg) {
    if (Array.isArray(arg)) {
      this._x = arg[0];
      this._y = arg[1];
    } else {
      this._x = arg.x;
      this._y = arg.y;
    }
    this._updated();
  }

  set x(xVlu) {
    this._x = xVlu;
    this._updated();
  }
  get x() {
    return this._x;
  }

  set y(yVlu) {
    this._y = yVlu;
    this._updated();
  }
  get y() {
    return this._y;
  }

  _updated() {
    if (this._pntRef) {
      this._pntRef.x = this._x;
      this._pntRef.y = this._y;
    }
  }
}