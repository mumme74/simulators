"use strict";

export class Point {
  _x = 0;
  _y = 0;

  constructor({x=0, y=0, svgPntRef = null}) {
    this._x = x;
    this._y = y;
    this.pntRef = svgPntRef;
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
    this._x = x;
  }
  get x() {
    return this._x;
  }

  set y(yVlu) {
    this._y = y;
  }
  get y() {
    return this._y;
  }

  _updated() {
    if (this.pntRef) {
      this._pntRef.x.baseValue.value = this._x;
      this._pntRef.y.baseValue.value = this._y;
    }
  }
}