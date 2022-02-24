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
    const arrHeadAngle = (30/180)*Math.PI, adj = Math.cos(arrHeadAngle)*size;
    let width, height, angle;

    point1 = (point1 instanceof Point)
           ? new Point({followPoint:point1})
           : new Point(point1);
    point2 = (point2 instanceof Point)
           ? new Point({followPoint:point2})
           : new Point(point2);
    const pnt1_arr1 = new Point({}),
          pnt1_arr2 = new Point({}),
          pnt2_arr1 = new Point({}),
          pnt2_arr2 = new Point({});

    let   pnt1_line = new Point({}),
          pnt2_line = new Point({});

    const recalculate = (self)=>{
      topLeft.x = Math.min(point1.x, point2.x);
      topLeft.y = Math.min(point1.y, point2.y);
      bottomRight.x = Math.max(point1.x, point2.x);
      bottomRight.y = Math.max(point1.y, point2.y);

      width = bottomRight.x - topLeft.x,
      height = bottomRight.y - topLeft.y,
      centerPoint.point = {x:topLeft.x + width / 2, y:topLeft.y + height/2};

      // get the angle between the points
      angle = Math.atan2(height, width);
      pnt1_arr1.point = {
        x:point1.x + Math.cos(angle+arrHeadAngle)*size,
        y:point1.y + Math.sin(angle+arrHeadAngle)*size};
      pnt1_arr2.point = {
        x:point1.x + Math.cos(angle-arrHeadAngle)*size,
        y:point1.y + Math.sin(angle-arrHeadAngle)*size};
      pnt1_line.point = {
        x:point1.x + Math.cos(angle)*adj,
        y:point1.y + Math.sin(angle)*adj};
      pnt2_arr1.point = {
        x:point2.x + Math.cos(angle+arrHeadAngle+Math.PI)*size,
        y:point2.y + Math.sin(angle+arrHeadAngle+Math.PI)*size};
      pnt2_arr2.point = {
        x:point2.x + Math.cos(angle-arrHeadAngle+Math.PI)*size,
        y:point2.y + Math.sin(angle-arrHeadAngle+Math.PI)*size};
      pnt2_line.point = {
        x:point2.x + Math.cos(angle+Math.PI)*adj,
        y:point2.y + Math.sin(angle+Math.PI)*adj};

      if (self) {
        self.size.height = height;
        self.size.width = width;
        self.angle = angle;
      }
    }

    recalculate();

    super({parentElement, width, height, centerPoint, className});

    className = className ? className : "";

    if (end1) {
      this.pnt1Arrow = new Polygon({parentElement, points:[point1, pnt1_arr1, pnt1_arr2],
        className:className + " arrowHead"});
      this.addShape(this.pnt1Arrow);
    } else
      pnt1_line = point1;

    if (end2) {
      this.pnt2Arrow = new Polygon({parentElement, points:[point2, pnt2_arr1, pnt2_arr2],
        className:className + " arrowHead"});
        this.addShape(this.pnt2Arrow);
    } else
      pnt2_line = point2;

    this.line = new Line({parentElement, className, point1:pnt1_line, point2:pnt2_line});
    this.addShape(this.line);

    point1.addChangeCallback(()=>{recalculate(this)});
    point2.addChangeCallback(()=>{recalculate(this)});
  }
}
