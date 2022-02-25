"use strict";

import { BaseShape, Group, Line, Polygon } from "../base.mjs";
import { Length } from "../length.mjs";
import { Point } from "../point.mjs";

/**
 * A Circle class
 * @property {number} radii The Radii of this circle
 * @extends BaseShape
 */
export class Circle extends BaseShape {
  _radii = new Length({});

  /**
   * Create a new Circle
   * @param {SVGElement} parentElement The element to attach this.node to.
   * @param {Point|{x:number,y:number}} centerPoint Center of Circle
   * @param {string} className The Css classes this.node should have
   */
  constructor({parentElement, centerPoint={x:0,y:0}, radii=0, className}) {
    const root = document.createElementNS('http://www.w3.org/2000/svg', "circle");

    const points = [
      new Point({svgLenXRef:root.cx.baseVal, svgLenYRef:root.cy.baseVal})
    ];
    points[0].point = centerPoint;
    super({parentElement, rootElement:root, points, className});

    this._radii._lenRef = root.r.baseVal
    this._radii.length = radii;
  }

  get radii() {
    return this._radii.length;
  }

  set radii(newRadii) {
    if (newRadii !== this._radii.length && !isNaN(newRadii))
      this._radii.length = newRadii;
  }
}

/**
 * A Triangle class
 * @extends Polygon
 */
export class Triangle extends Polygon {
  /**
   * Create a new Triangle
   * @param {SVGElement} parentElement The svg element to attach this.node to.
   * @param {Array.<Point>|Array.<{x:number,y:number}>}
   * @param {string} className The CSS classes this node should have
   */
  constructor({parentElement, points=[], className=""}) {
    for (let i = points.length; i < 3; ++i)
      points.push({x:0, y:0});
    super({parentElement, points: points.slice(0,3), className});
  }

  // ensure we only set 3 points
  set points(points) {
    super.points = points.slice(0, 3);
  }

  get points() {
    return this._points;
  }
}


// for square
function buildPnts(startPoint, width) {
  const x = startPoint.x, y = startPoint.y;
  return [{x, y},
          {x: x+width, y},
          {x:x+width, y: y+width},
          {x, y:y+width},
  ];
}

/**
 * A Square class
 * @extends Polygon
 * @property {number} width The width of this square
 */
export class Square extends Polygon {
  _width = new Length({});

  /**
   * Create a new Square
   * @param {SVGElement} parentElement The SVG element to attach this.node to.
   * @param {Point|{x:number,y:number}} startPoint The startPoint to this Square
   * @param {number} width The width of this square
   * @param {string} className The CSS classes this.node should have
   */
  constructor({parentElement, startPoint = {x:0,y:0}, width = 0, className}) {
    width = Math.round(width);
    const pnts = buildPnts(startPoint, width);
    super({parentElement, points: pnts, className});
    this._width.length = width;
  }

  set width(newWidth) {
    this._width.length = Math.round(newWidth);
    this.points = buildPnts(this.offset, this._width.length);
  }

  get width() {
    return this._width.length;
  }
}


/**
 * A class for a rectangle
 */
export class Rect extends BaseShape {
  _width = new Length({});
  _height = new Length({});
  _roundCorners = new Point({});

  constructor({parentElement, topLeft={x:0,y:0}, className,
               width=0, height=0, roundCorners=0})
  {
    const rootElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rootElement.x.baseVal.value = topLeft.x;
    rootElement.y.baseVal.value = topLeft.y
    if (!(topLeft instanceof Point) || topLeft.followPoint)
      topLeft = new Point({
        svgLenXRef: rootElement.x.baseVal,
        svgLenYRef: rootElement.y.baseVal,
        followPoint:topLeft
      });
    else {
      topLeft._x._lenRef = rootElement.x.baseVal;
      topLeft._y._lenRef = rootElement.y.baseVal;
    }

    super({parentElement,rootElement,points:[topLeft],className});

    this._width._lenRef = rootElement.width.baseVal;
    this._height._lenRef = rootElement.height.baseVal;

    this._roundCorners._x._lenRef = rootElement.rx.baseVal;
    this._roundCorners._y._lenRef = rootElement.ry.baseVal;

    this.width = width;
    this.height = height;
    this.roundedCorners = roundCorners;
  }

  get width(){
    return this._width.length;
  }

  set width(newWidth) {
    if (newWidth >= 0) {
      this._width.length = newWidth;
      const corner = this.roundedCorners;
      if (corner > newWidth / 2)
        this.roundedCorners = Math.round(newWidth / 2);
    }
  }

  get height(){
    return this._height.length;
  }

  set height(newHeight) {
    if (newHeight >= 0) {
      this._height.length = newHeight;
      const corner = this.roundedCorners;
      if (corner > newHeight / 2)
        this.roundedCorners = Math.round(newHeight / 2);
    }
  }

  get roundedCorners() {
    return this._roundCorners.x;
  }

  set roundedCorners(newRoundness) {
    this._roundCorners.point = [newRoundness, newRoundness];
  }
}

export class Arrow extends Group {
  constructor({parentElement, point1, point2, className, end1=false, end2=true, size=10}) {
    const topLeft = {x:0,y:0}, bottomRight = {x:0,y:0}, centerPoint = new Point({});
    let width, height;

    point1 = (point1 instanceof Point)
           ? new Point({followPoint:point1})
           : new Point(point1);
    point2 = (point2 instanceof Point)
           ? new Point({followPoint:point2})
           : new Point(point2);

    const pnts = {
      arr1: [ new Point({x:point1.x,y:point1.y}),
        new Point({x:point1.x,y:point1.y}),
        new Point({x:point1.x,y:point1.y})],
      arr2: [ new Point({x:point2.x,y:point2.y}),
        new Point({x:point2.x,y:point2.y}),
        new Point({x:point2.x,y:point2.y})],
      line: [ new Point({x:point1.x,y:point1.y}),
        new Point({x:point2.x,y:point2.y})]
    }

    const recalculateRect = (p1,p2)=>{
      topLeft.x = Math.min(p1.x, p2.x);
      topLeft.y = Math.min(p1.y, p2.y);
      bottomRight.x = Math.max(p1.x, p2.x);
      bottomRight.y = Math.max(p1.y, p2.y);

      width = bottomRight.x - topLeft.x,
      height = bottomRight.y - topLeft.y;
      return {width, height, size, topLeft, bottomRight};
    }

    recalculateRect(point1, point2);
    centerPoint.point = {x:topLeft.x + width / 2, y:topLeft.y + height/2};


    super({parentElement, width, height, centerPoint, className});

    // do when this is avaliable
    this._recalculateRect = recalculateRect;
    this.point1 = point1;
    this.point2 = point2;
    this._pnts = pnts;

    centerPoint.addChangeCallback(()=>{
      this._rot.point = centerPoint;
    });

    className = className ? className : "";

    this.recalculateSize();

    this.line = new Line({parentElement, className, point1:pnts.line[0], point2:pnts.line[1]});
    this.addShape(this.line);

    if (end1) {
      this.pnt1Arrow = new Polygon({parentElement, points:pnts.arr1,
        className:className + " arrowHead"});
      this.addShape(this.pnt1Arrow);
      point1.addChangeCallback(this._onPnt1Move.bind(this));
      this._onPnt1Move();
    } else
      pnts.line[0].followPoint = point1;

    if (end2) {
      this.pnt2Arrow = new Polygon({parentElement, points:pnts.arr2,
        className:className + " arrowHead"});
      this.addShape(this.pnt2Arrow);
      point2.addChangeCallback(this._onPnt2Move.bind(this));
      this._onPnt2Move();
    } else
      pnts.line[1].followPoint = point2;

    this.recalculateSize();

  }

  _movePnt(pnt, arrowPnts, line) {
    const {size, width, height, topLeft, bottomRight} = this._recalculateRect(this.point1, this.point2);
    this.size.centerPoint.point = {
      x:topLeft.x + ((bottomRight.x - topLeft.x) / 2),
      y:topLeft.y + ((bottomRight.y - topLeft.y) / 2)
    };
    const hAngle = (30/180)*Math.PI, adj = Math.cos(hAngle)*size;
    let angle = Math.atan2(
        this.point1.y-this.point2.y, this.point2.x-this.point1.x);
    if (pnt === this.point2) angle += Math.PI;
    arrowPnts[0].point = pnt;
    arrowPnts[1].point = {
      x:pnt.x + Math.cos(-angle+hAngle)*size,
      y:pnt.y + Math.sin(-angle+hAngle)*size};
    arrowPnts[2].point = {
      x:pnt.x + Math.cos(-angle-hAngle)*size,
      y:pnt.y + Math.sin(-angle-hAngle)*size};
    line.point = {
      x:pnt.x + Math.cos(angle)*adj,
      y:pnt.y + Math.sin(-angle)*adj};
  }

  _onPnt1Move() {
    this._movePnt(this.point1, this._pnts.arr1, this._pnts.line[0]);
    if (this.pnt2Arrow)
      //must recal as we have changed angle
      this._movePnt(this.point2, this._pnts.arr2, this._pnts.line[1]);
    if (!this._isMoving)
      this.recalculateSize()
  }

  _onPnt2Move() {
    this._movePnt(this.point2, this._pnts.arr2, this._pnts.line[1]);
    if (this.pnt1Arrow)
      // must recal as we have changed angle
      this._movePnt(this.point1, this._pnts.arr1, this._pnts.line[0]);
    if (!this._isMoving)
      this.recalculateSize()
  }

  recalculateSize() {
    const min = this.point1.point, max = this.point2.point;
    const pts = [this.point1, this.point2, ...this._pnts.arr1, ...this._pnts.arr2];
    pts.forEach(p=>{
      min.x = Math.min(min.x, p.x);
      min.y = Math.min(min.y, p.y);
      max.x = Math.max(max.x, p.x);
      max.y = Math.max(max.y, p.y);
    });

    const {width, height} = this._recalculateRect(min, max);

    if (this.size.height !== height || this.size.width !== width) {
      this.size.height = height;
      this.size.width = width;
    }
  }

  get angle() {
    let angle = Math.atan2(
      this.point1.y-this.point2.y,
     this.point2.x-this.point1.x) * (180 / Math.PI);
    if (angle < 0)
      angle += 360;
    else if (angle > 360)
      angle -= 360;
     return angle;
  }
  set angle(angle) { super.angle = angle; }
}
