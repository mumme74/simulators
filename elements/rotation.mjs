"use strict";

import { Point } from "./point.mjs";


export class Rotation {
  _onChangeCallbacks = []
  _x = 0;
  _y = 0;
  _angle = 0;

  constructor({x, y, point={x:0,y:0}, angle, onChangeCallback, owner,
              rotateShapes=[]}) {
    this._x = !isNaN(x) ? x : point.x;
    this._y = !isNaN(y) ? y : point.y;
    this._angle = !isNaN(angle) ? angle : 0;
    this.owner = owner;
    this._rotateShapes = rotateShapes;
    this._rotateShapes.rotations = [];

    if (point instanceof Point)
      point.addChangeCallback((pnt) =>{
        this._x = pnt.x; this._y = pnt.y;
      });

    if (onChangeCallback)
      this.addChangeCallback(onChangeCallback);
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    if (newX !== this._x) {
      this._x = newX;
      this._updated();
    }
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    if (this._y !== newY) {
      this._y = newY;
      this._updated();
    }
  }

  get angle() {
    return this._angle;
  }

  set angle(newAngle) {
    if (!isNaN(newAngle) && this._angle !== newAngle) {
      this._angle = newAngle;
      this._updated();
    }
  }

  get point() {
    return {x:this._x, y:this._y}
  }

  get points() {
    return [this.point];
  }

  set point(newPnt) {
    const nX = Array.isArray(newPnt) ? newPnt[0] : newPnt.x,
          nY = Array.isArray(newPnt) ? newPnt[1] : newPnt.y;

    if (nX !== this._x || nY !== this._y) {
      this._x = nX;
      this._y = nY;
    }
  }

  addChangeCallback(cb) {
    if (this._onChangeCallbacks.indexOf(cb) < 0)
      this._onChangeCallbacks.push(cb);
  }

  removeChangeCallback(cb) {
    const idx = this._onChangeCallbacks.indexOf(cb);
    if (idx !== null && idx > -1)
      this._onChangeCallbacks.splice(idx, 1);
  }

  addRotateShape(shape) {
    const idx = this._rotateShapes.indexOf(shape);
    if (idx !== null && idx < 0)
      this._rotateShapes.push(shape);
  }

  removeRotateShape(shape) {
    const idx = this._rotateShapes.indexOf(shape);
    if (idx !== null && idx > -1)
      this._rotateShapes.splice(idx, 1);
  }

  _updated() {
    for (const cb of this._onChangeCallbacks)
      cb(this);

    const radian = (this._angle / 180) * Math.PI;

    for (const shp of this._rotateShapes) {
      // lookup possble previous rotation
      let beforeRotations = this._rotateShapes.rotations.find(o=>o.shp===shp);
      if (!beforeRotations) {
        beforeRotations = {shp, rot:0.0};
        this._rotateShapes.rotations.push(beforeRotations);
      }
      const rad = radian - beforeRotations.rot;
      //const rad = radian;

      for (const pnt of shp.points) {
        let x = pnt.x, y = pnt.y;
        const xDiff = x - this._x,
              yDiff = this._y - y; // y is reversed in computer graphics
        const hypotenuse = Math.sqrt(xDiff*xDiff + yDiff*yDiff); // pythagoras theorem
        const pointAngleToMe = Math.atan2(yDiff, xDiff); // get the internal angle from me
        y = Math.sin(rad + pointAngleToMe) * hypotenuse;
        x = Math.cos(rad + pointAngleToMe) * hypotenuse;
        pnt.point = [this._x + x, this._y - y]; // update pnt
      }

      beforeRotations.rot = radian;
    }
  }
}
