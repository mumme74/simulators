"use strict";

import { BaseShape } from "./base.mjs";
import { Point } from "./point.mjs";

/**
 * A class that rotates all shapes and their points
 * @property {BaseShape} owner The instance that owns this
 * @property {number} x Rotate around this x
 * @property {number} y Rotate around this y
 * @property {number} angle Rotated angle
 * @property {Point|{x:number,y:number}} point Rotate around this x,y
 * @property {[{x:number,y:number}]} points Array with this points, ie rotate point
 */
export class Rotation {
  _onChangeCallbacks = []
  _x = 0;
  _y = 0;
  _angle = 0;

  /**
   * Create a new Rotation
   * @param {number} [x] The x to rotate around
   * @param {number} [y] The y to rotate around
   * @param {number} [angle] The angle to rotate
   * @param {Function} [onChangeCallback] The x to rotate around
   * @param {BaseShape} [owner] The owner of this rotation
   * @param {number} [rotateShapes] The shapes to rotate
   */
  constructor({x, y, point={x:0,y:0}, angle, onChangeCallback, owner,
              rotateShapes=[]}) {
    this._x = !isNaN(x) ? x : point.x;
    this._y = !isNaN(y) ? y : point.y;
    this.owner = owner;
    this._rotateShapes = rotateShapes;
    this._rotateShapes.rotations = [];

    if (point instanceof Point)
      point.addChangeCallback((pnt) =>{
        this._x = pnt.x; this._y = pnt.y;
      });

    if (onChangeCallback)
      this.addChangeCallback(onChangeCallback);

    this.angle = !isNaN(angle) ? angle : 0;
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    if (newX !== this._x) {
      this._x = newX;
    }
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    if (this._y !== newY) {
      this._y = newY;
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

  /**
   * Add a callback which is called before any rotation
   * @param {Function} cb The callback function
   */
  addChangeCallback(cb) {
    if (this._onChangeCallbacks.indexOf(cb) < 0)
      this._onChangeCallbacks.push(cb);
  }

  /**
   * Remove a callback from event chain
   * @param {Function} cb The callback to remove
   */
  removeChangeCallback(cb) {
    const idx = this._onChangeCallbacks.indexOf(cb);
    if (idx !== null && idx > -1)
      this._onChangeCallbacks.splice(idx, 1);
  }

  /**
   * Add a shape to be rotated by this rotation object
   * @param {BaseShape} shape The shape to add
   */
  addRotateShape(shape) {
    const idx = this._rotateShapes.indexOf(shape);
    if (idx !== null && idx < 0)
      this._rotateShapes.push(shape);
  }

  /**
   * Remove shape from rotation
   * @param {BaseShape} shape The shape to remove
   */
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
