"use strict";

import { Length } from "./length.mjs";

/**
 * A Point object class
 * @property {number} x The x value
 * @property {number} y The y value
 * @property {Point|null} followPoint The point this point is attached to follows when it moves
 */
export class Point {
  _x = new Length({});
  _y = new Length({});
  _pntRef = null;
  _onChangeCallbacks = [];
  _followPoint = null;
  _followPoints = [];

  /**
   * Creates a new Point
   * @param {number} [x] The X value, if svgPntRef is set it gets this x value
   * @param {number} [y] The y Value, if svgPntRef is set it gets this y value
   * @param {SVGPoint} [svgPntRef] The svgPoint this point is controlling
   * @param {SVGLength} [svgLenXRef] The x svgLength this x value is controlling, ie cx in a svg circle
   * @param {SVGLength} [svgLenYRef] The y svgLength this y value is controlling, ie cy of a svg circle
   * @param {function} [onChangeCallback] A callback thats called when this point moves
   * @param {Point} [followPoint] A point to follow and move with
   */
  constructor({x, y, svgPntRef = null, owner=null,
              svgLenXRef, svgLenYRef,
              onChangeCallback, followPoint}) {
    this.owner = owner;
    if (svgLenXRef) {
      this._x._lenRef = svgLenXRef;
      this._x.length = svgLenXRef.value;
    } else if (svgPntRef) {
      if (!isNaN(x)) svgPntRef.x = x;
      this._x.length = svgPntRef.x;
    } else
      this._x.length = !isNaN(x) ? x : 0;

    if (svgLenYRef) {
      this._y._lenRef = svgLenYRef;
      this._y.length = svgLenYRef.value;
    } else if (svgPntRef) {
      if (!isNaN(y)) svgPntRef.y = y;
      this._y.length = svgPntRef.y;
    } else
      this._y.length = !isNaN(y) ? y : 0;

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
      // move up tree to attach to the root most point
      let pntIt = point, visited = [];
      while(pntIt._followPoint && visited.indexOf(pntIt) === -1){
        visited.push(pntIt);
        pntIt = pntIt._followPoint;
      }
      this._followPoint = pntIt;
      pntIt._followPoints.push(this);
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

  /**
   * Gets the SVGPoint this point controls
   * @returns {SVGPoint|null} the SVGPoint this point controls
   */
  svgPntRef() {
    return this._pntRef;
  }

  /**
   * Add a callback that gets called when this point moves
   * @param {function} cb A callback function
   */
  addChangeCallback(cb) {
    const idx = this._onChangeCallbacks.indexOf(cb);
    if (idx !== null && idx < 0)
      this._onChangeCallbacks.push(cb);
  }

  /**
   * Remove cb from onChangeCallbacks
   * @param {function} cb  The callback to remove
   */
  removeChangeCallback(cb) {
    const idx = this._onChangeCallbacks.indexOf(cb);
    if (idx !== null && idx > -1)
      this._onChangeCallbacks.splice(idx, 1);
  }

  /**
   * Detach all followPoints and onChangeCallbacks
   */
  detachEverything() {
    for(const trackPt of this._followPoints)
      trackPt._followPoint = null;
    this._followPoints.splice(0);
    this._onChangeCallbacks.splice(0);
  }

  /**
   * Gets all points attached to this point and it's followPoint
   * @returns {Array.<Point>} All points attached to this and its followPoint
   */
  connectedPoints() {
    if (this._followPoint)
      return [this._followPoint, ...this._followPoint._followPoints];
    return [this, ...this._followPoints];
  }

  _updated() {
    if (this._pntRef) {
      this._pntRef.x = Math.round(this._x.length);
      this._pntRef.y = Math.round(this._y.length);
    }
    // call event listeners
    if (this._onChangeCallbacks.length) {
      for(const cb of this._onChangeCallbacks)
        cb(this);
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
