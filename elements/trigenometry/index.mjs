"use strict";

import { BaseShape, Polygon } from "../base.mjs";
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
