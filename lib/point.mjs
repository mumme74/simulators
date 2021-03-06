"use strict";

import { Length } from "./length.mjs";

/**
 * A Point object class
 * @property {number} x The x value
 * @property {number} y The y value
 * @property {Point|null} followPoint The point this point is attached to follows when it moves
 * @property {{x:number, y:number}} followOffset Follow point with this offset
 */
export class Point {
  _x = new Length({});
  _y = new Length({});
  _pntRef = null;
  _onChangeCallbacks = [];
  _followPoint = null;
  _followPoints = [];
  _connectedToPoint = null;
  _connectedPoints = [];

  /**
   * Creates a new Point
   * @param {number} [x] The X value, if svgPntRef is set it gets this x value
   * @param {number} [y] The y Value, if svgPntRef is set it gets this y value
   * @param {object} [owner] The instance that owns this point
   * @param {SVGPoint} [svgPntRef] The svgPoint this point is controlling
   * @param {SVGLength} [svgLenXRef] The x svgLength this x value is controlling, ie cx in a svg circle
   * @param {SVGLength} [svgLenYRef] The y svgLength this y value is controlling, ie cy of a svg circle
   * @param {function} [onChangeCallback] A callback thats called when this point moves
   * @param {Point} [followPoint] A point to follow and move with
   * @param {{x:number,y:number}} [followOffset] Follow point with this offset
   * @param {Point} [connect] Connect logically to this point, used for schematics etc
   */
  constructor({x, y, svgPntRef = null, owner=null,
              svgLenXRef, svgLenYRef, onChangeCallback,
              followPoint, followOffset, connect}) {
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

    if (followOffset)
      this.followOffset = followOffset;
    if (followPoint)
      this.followPoint = followPoint;
    if (connect)
      this.connect(connect);
  }

  get point() {
    return {x:this._x.length, y:this._y.length};
  }

  set point(arg) {
    const pt = Array.isArray(arg) ? [arg[0] || 0, arg[1] || 0] : [arg.x || 0, arg.y || 0];
    if (this._x.length !== pt[0] || this._y.length !== pt[1]) {
      if (this._followPoint) {
        this._followPoint._x.length = pt[0] - this._x.followOffset;
        this._followPoint._y.length = pt[1] - this._y.followOffset;
        this._followPoint._updated();
      }
      this._x.length = pt[0];
      this._y.length = pt[1];
      this._updated();
    }
  }

  set x(xVlu) {
    if (this._x.length !== xVlu) {
      if (this._followPoint) {
        this._followPoint._x.length = xVlu - this._x.followOffset;
        this._followPoint._updated();
      }
      this._x.length = xVlu;
      this._updated();
    }
  }
  get x() {
    return this._x.length;
  }

  set y(yVlu) {
    if (this._y.length !== yVlu) {
      if (this._followPoint) {
        this._followPoint._y.length = yVlu - this._y.followOffset;
        this._followPoint._updated();
      }
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
    if (point instanceof Point && point !== this) {
      // clear old point
      if (this._followPoint)
        this.followPoint = null;
      this._followPoint = point;
      point._followPoints.push(this);
      this._x.length = this._followPoint._x.length + this._x.followOffset;
      this._y.length = this._followPoint._y.length + this._y.followOffset;
      this._updated();
    } else if (!point && this._followPoint) {
      const idx = this._followPoint._followPoints.indexOf(this);
      if (idx > -1)
        this._followPoint._followPoints.splice(idx);
      this._followPoint = null;
    }
  }

  get followOffset() {
    return {x:this._x._followOffset, y:this._y._followOffset};
  }

  set followOffset(offset) {
    if (offset?.x)
      this._x.followOffset = offset.x;
    if (offset?.y)
      this._y.followOffset = offset.y
  }

  /**
   * Gets all points attached to this point and it's followPoint
   * @returns {Array.<Point>} All points attached to this and its followPoint
   */
  get connectedPoints() {
    if (this._connectedToPoint)
      return [
        this._connectedToPointHandler,
        ...this._connectedToPointHandler._connectedPoints
      ];
    else if (this._connectedPoints.length)
      return [this, ...this._connectedPoints];
    return [];
  }

  get connectedTo() {
    return this._connectedToPoint;
  }

  /**
   * Connect a point to another point logically, as in wire connectiontions
   * Connects this point to point
   * @param {Point|{x:number,y:number}} point The point to connect to
   * @returns {boolean} true if succceds
   */
  connect(point) {
    if (point !== this && point instanceof Point) {
      if (this._connectedPoints.indexOf(point) < 0) {
        this.disconnect();
        // move up tree to attach to the root most point
        let pntIt = point, visited = [];
        while(pntIt._connectedToPoint && visited.indexOf(pntIt) === -1){
          visited.push(pntIt);
          pntIt = pntIt._connectedToPoint;
        }

        if (pntIt !== this) {
          this._connectedToPointHandler = pntIt;
          this._connectedToPoint = point;
          pntIt._connectedPoints.push(this);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Disconnects point from its connected point
   * @returns {boolean} true if succeds, false if unsuccessfull
   */
  disconnect() {
    if (this._connectedToPointHandler) {
      // disconnect from current point
      const myPnts = this._connectedPoints;
      myPnts.splice(myPnts.length, 0,
        ...this._connectedToPointHandler._connectedPoints.filter(p=>{
          if (p._connectedToPoint === this) {
            p._connectedToPointHandler = this;
            return p;
          }
        })
      );
      const idx = this._connectedToPointHandler._connectedPoints.indexOf(this);
      this._connectedToPointHandler._connectedPoints.splice(idx, 1);
      this._connectedToPoint = null;
      this._connectedToPointHandler = null;
      return true;
    }
    return false;
  }

  /**
   * Gets the SVGPoint this point controls
   * @returns {SVGPoint|null} the SVGPoint this point controls
   */
  svgPntRef() {
    return this._pntRef;
  }

  /**
   * Move this point from where it is by this much
   * @param {number} x Move X by this much
   * @param {number} y Move y by this much
   */
  moveBy({x=0,y=0}) {
    this.point = [this._x.length + x, this._y.length + y];
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
    for(const pt of this._connectedPoints)
      pt.disconnect();
    this.disconnect();
    this._followPoints.splice(0);
    this._connectedPoints.splice(0);
    this._onChangeCallbacks.splice(0);
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
        pt._x.length = this._x.length + pt._x.followOffset;
        pt._y.length = this._y.length + pt._y.followOffset;
        pt._updated();
      }
    }
  }
}
