"use strict";

import { Point } from "./point.mjs";
import { Rotation } from "./rotation.mjs";

export function lookupSvgRoot(svgElem) {
  while(svgElem && svgElem.tagName !== 'svg')
    svgElem = svgElem.parentElement;
  return svgElem;
}

/**
 * A class for sizes
 * @property {Point} centerPoint The center point of this rectangle
 * @property {number} width The width of this rect
 * @property {number} height The height of this rect
 * @property {{x:number, y:number}} topLeft The top left of this rect
 * @property {{x:number, y:number}} topRight The top right of this rect
 * @property {{x:number, y:number}} bottomLeft The bottom left of this rect
 * @property {{x:number, y:number}} bottomRight The bottom right of this rect
 * @property {Point} topLeftPoint A point that follows centerpoint but at topLeft
 * @property {Point} topRightPoint A point that follows centerpoint but at topRight
 * @property {Point} bottomLeftPoint A point that follows centerpoint but at bottomLeft
 * @property {Point} bottomRightPoint A point that follows centerpoint but at bottomRight
 * @property {SizeRect} cloneFromRect Clone this rect for values
 * @property {number} left The x at left
 * @property {number} top The y at top
 * @property {number} right The x at right
 * @property {number} bottom The y at bottom
 * @property {Point} leftPoint A point that follows centerpoint but at left
 * @property {Point} rightPoint A point that follows centerpoint but at right
 * @property {Point} topPoint A point that follows centerpoint but at top
 * @property {Point} bottomPoint A point that follows centerpoint but at bottom
 */
export class SizeRect {
  /**
   * Create a new SizeRect
   * @param {Point|{x:number,y:number}} [topLeft] The top left to construct from
   * @param {Point|{x:number,y:number}} [centerPoint] The centerpoint of this rect
   * @param {number} [width] The width of this Rect
   * @param {number} [height] The height of this Rect
   * @param {SizeRect} [cloneFromRect] clone this rect
   * @param {Point} [followPoint] A point to follow this rect, moves this centerPoint
   * @param {{x:number,y:number}} [followOffset] If followOffset track this centerpoint
   */
  constructor({topLeft, centerPoint={x:0,y:0}, width=0, height=0, cloneFromRect, followPoint, followOffset, }) {
    if (cloneFromRect) {
      topLeft = cloneFromRect.topLeft;
      width = cloneFromRect.width;
      height = cloneFromRect.height;
    }

    this.height = height;
    this.width = width;

    if (followPoint)
      centerPoint = new Point({followPoint, followOffset});
    else if (topLeft) {
      let arg = {x:topLeft.x + this._xOffset(), y:topLeft.y + this._yOffset()};
      centerPoint = new Point(arg);
    } else
      centerPoint = new Point(centerPoint);

    this.centerPoint = centerPoint;
  }
  get left() {
    return this.centerPoint.x-this._xOffset();
  }
  get leftPoint() {
    const offset = {x:-this._xOffset()};
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get right(){
    return this.centerPoint.x+this._xOffset();
  }
  get rightPoint() {
    const offset = {x:this._xOffset()};
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get top() {
    return this.centerPoint.y-this._yOffset();
  }
  get topPoint() {
    const offset = {y:-this._yOffset()};
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get bottom() {
    return this.centerPoint.y+this._yOffset();
  }
  get bottomPoint() {
    const offset = {y:this._yOffset()};
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get topLeft() {
    return {x:this.left, y:this.top};
  }
  get topLeftPoint() {
    const offset = { x:-this._xOffset(), y:-this._yOffset() };
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get topRight() {
    return {x:this.right, y:this.top};
  }
  get topRightPoint() {
    const offset = { x:this._xOffset(), y:-this._yOffset() };
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get bottomLeft() {
    return {x:this.left, y:this.bottom};
  }
  get bottomLeftPoint() {
    const offset = { x:-this._xOffset(), y:this._yOffset() };
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  get bottomRight() {
    return {x:this.right, y:this.bottom};
  }
  get bottomRightPoint() {
    const offset = {
      x:this.right - this.centerPoint.x,
      y:this.bottom - this.centerPoint.y
    };
    return new Point({followPoint:this.centerPoint, followOffset:offset});
  }
  _yOffset() { return this.height / 2; }
  _xOffset() { return this.width / 2; }
}

/**
 * Base class for all SVG shapes
 * @property {Point} offset the first point of the shape
 * @property {Array.<{Point}>} points All points for this shape
 */
export class BaseShape {
  _points = [];
  _svgElem = null;

  /**
   * Create a BaseShape
   * @param {SVGElement} parentElement The element to attach this node to
   * @param {SVGElement} rootElement The root element of this shape
   * @param {{Array.<Point>}|Array.<{x:numer,y:number}>} points The points of this shape, points[0] becomes offset
   * @param {Array.<string>} [classList] The CSS classes to this.node
   */
  constructor({parentElement, rootElement, points, classList}) {
    this.node = rootElement;
    if (classList && (classList instanceof String || typeof classList ==='string')) {
      this.node.classList.add(classList);
    } else if (Array.isArray(classList)) {
      for (const cls of classList)
        if (cls) this.node.classList.add(cls);
    }

    parentElement.appendChild(this.node);

    this._svgElem = lookupSvgRoot(parentElement);

    for (let i = 0; i < points.length; ++i) {
      let pnt = points[i];
      const svgPntRef = rootElement?.points?.getItem(i);
      if (!(pnt instanceof Point) || (pnt._pntRef && svgPntRef)) {
        pnt = new Point({x:pnt.x, y:pnt.y, svgPntRef, owner: this});
      } else {
        pnt.owner = this;
        if (svgPntRef) pnt._pntRef = svgPntRef;
      }
      this._decorateNewPoint(pnt);
      this._points.push(pnt);
    }
  }

  /**
   * Moves shape to a new pos
   * @param {Point|{x,y}} newPoint Point to move to
   */
  move(newPoint) {
    const newX = Array.isArray(newPoint) ? newPoint[0] : newPoint.x,
          newY = Array.isArray(newPoint) ? newPoint[1] : newPoint.y;
    const xDiff = !isNaN(newX) ? newX - this.offset.x : 0,
          yDiff = !isNaN(newY) ? newY - this.offset.y : 0;
    for(const pt of this._points)
      pt.point = [pt.x + xDiff, pt.y + yDiff];
  }

  /**
   * Scales the shape by scaling all points
   * @param {number} [factor=1] Scale X and Y by this factor
   * @param {number} [xFactor] Scale only X by this factor
   * @param {number} [yFactor] Scale only Y by this factor
   * @param {Point|{x:number,y:number}} anchorPt The centerpoint for the scaling
   */
  scale({factor=1, xFactor=null, yFactor=null, anchorPt}) {
    xFactor = xFactor === null ? factor : xFactor;
    yFactor = yFactor === null ? factor : yFactor;

    // dont move our scaled object, only scale it, point0 is considered center
    if (!anchorPt)
      anchorPt = this._points[0];

    for(const pt of this._points) {
      const offsetX = pt.x - anchorPt.x,
            offsetY = pt.y - anchorPt.y;
      pt.point = [
        offsetX * xFactor + anchorPt.x,
        offsetY * yFactor + anchorPt.y
      ];
    }
  }

  get points() {
    return [...this._points];
  }

  set points(points) {
    const newPts = []; let i = 0;

    // we might get points sorted in a new order but same instance of points
    for (; i < points.length; ++i) {
      let newPt = points[i];
      const oldPt = this._points[i],
            oldPntIdxInNewPoints = oldPt ? points.indexOf(oldPt) : -2;

      if (newPt instanceof Point) {
        const idx = this._points.indexOf(newPt);
        if (idx === -1)
          this._decorateNewPoint(newPt);
      } else {
        if (i < this._points.length) {
          if (oldPntIdxInNewPoints === -1) {
            oldPt.x = newPt.x; oldPt.y = newPt.y;
            newPts.push(oldPt);
            continue;
          }
        }
        newPt = new Point(newPt);
        newPt.owner = this;
        this._decorateNewPoint(newPt);
      }
      newPts.push(newPt);
      if (oldPntIdxInNewPoints === -1)
        this._pointRemoved(oldPt);
    }

    // don't remove our offset point
    if (i === 0) newPts[i++] = this._points[0];

    // remove too many points, but dont remove pt0
    for(; i < this._points.length; ++i) {
      const myPt = this._points[i];
      if (newPts.indexOf(myPt) === -1)
        this._pointRemoved(myPt);
    }

    this._points = newPts;
    this._recalulatePnts(newPts);
  }

  get offset() {
    return this._points[0];
  }

  set offset(point) {
    this._points[0].point = point;
  }

  /// subclass might use, called when a new point is inserted
  /// and we should attach it to a svg property
  _decorateNewPoint(newPnt) {}

  /// subclass might use, called when a point is removed
  /// we might want to synk svg node with this event
  _pointRemoved(pnt) {}

  /// subclass might use, when pointsList is updated
  /// we might want to synk some ordered list with this event
  _recalulatePnts(pntsArr) {}
}

/**
 * Base class for points base svg elements (polygon, polyline etc)
 * @extends BaseShape
 */
export class BasePointsShape extends BaseShape {
  /**
   * Create a BaseShape
   * @param {SVGElement} parentElement The element to attach this node to
   * @param {SVGElement} rootElement The root element of this shape
   * @param {Array.<Point>|Array.<{x:number,y:number}>} points The points of this shape, points[0] becomes offset
   * @param {Array.<string>} [classList] The CSS classes to this.node
   */
  constructor({parentElement, rootElement, points, classList}) {
    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(' '));
    super({parentElement, rootElement, points, classList});
  }

  _decorateNewPoint(pnt) {
    return pnt._pntRef ? pnt : this.makePointWithSvgRef(pnt);
  }

  _recalulatePnts(points) {
    // we nee to insert into node, then take ref, appendItem copies pont instead of using it directly
    this.node.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(' '));
    for(let i = 0; i < this._points.length; ++i)
      this._points[i]._pntRef = this.node.points.getItem(i);
  }

  /**
   * Insert a a Point to shape
   * @param {Point|{x:number,y:number}|Array.<number,number>} point
   * @param {number|Point} beforePt
   */
  insertPoint(point, beforePt=null) {
    const pnt = this.makePointWithSvgRef(
      Array.isArray(point) ? {x:point[0], y:point[1]} : point);

    const idx = !isNaN(beforePt) ? beforePt : this._points.indexOf(beforePt);
    if (idx !== null && idx > -1) {
      this.node.points.insertItemBefore(pnt._pntRef, idx);
      this._points.splice(idx, 0, pnt);
    } else {
      this.node.points.appendItem(pnt._pntRef);
      this._points.push(pnt);
    }
  }

  /**
   * Remove a point
   * @param {Point|number|{x:number, y:number}|Array.<number,number>} point The point to remove
   */
  removePoint(point) {
    let pnt;
    if (point instanceof Point)
      pnt = point;
    else if (!isNaN(point))
      pnt = this._points[point];
    else if (Array.isArray(point))
      pnt = this._points.find(p=>p.x===point[0] && p.y===point[1]);
    else
      pnt = this._points.find(p=>p.x===point.x && p.y===point.y);

    const idx = this._points.indexOf(pnt);
    if (idx !== null && idx > -1 && this._points.length > 1) {
      this.node.points.removeItem(idx);
      this._points.splice(idx, 1);
    }
  }

   /**
   * Make a new SVG point for pnt, static not bound to a instance
   * @param {Point|{x:number,y:number}|Array<number,number>} pnt The point used as input when creating svg point
   * @param {SVGElement} svgElem The root svg element ie rhe <svg ...>
   * @returns {Point} The new point with the svg point attached as a ref
   */
  static makePointWithSvgRefStatic(pnt, svgElem) {
    const svgPnt = svgElem.createSVGPoint();
    svgPnt.x = !isNaN(pnt?.x) ? pnt.x : 0;
    svgPnt.y = !isNaN(pnt?.y) ? pnt.y : 0;
    if (pnt instanceof Point) {
      pnt._pntRef = svgPnt;
      return pnt;
    }
    return new Point({svgPntRef: svgPnt});
  }

  /**
   * Make a new SVG point for pnt
   * @param {Point|{x:number,y:number}|Array<number,number>} pnt
   * @returns {Point} The new point with the svg point attached as a ref
   */
  makePointWithSvgRef(pnt) {
    return BasePointsShape.makePointWithSvgRefStatic(pnt, this._svgElem);
  }
}

/**
 * Class for Polygon
 * @extends BasePointsShape
 */
export class Polygon extends BasePointsShape {
  /**
   * Creates a Polygon
   * @param {SVGElement} parentElement The element to attach this node to
   * @param {Array.<Point> | Array.<{x:number,y:number}>} points The points of this shape, points[0] becomes offset
   * @param {Array.<string>} [classList] The CSS classes to this.node
   */
  constructor({parentElement, points, classList}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    super({parentElement, rootElement:node, points, classList});
  }
}

/**
 * Class for Polyline
 * @extends BasePointsShape
 */
export class Polyline extends BasePointsShape {
  /**
   * Creates a Polyline
   * @param {SVGElement} parentElement The element to attach this node to
   * @param {Array.<Point>|Array.<x:number,y:number>} points The points of this shape, points[0] becomes offset
   * @param {Array.<string>} [classList] The CSS classes to this.node
   */
  constructor({parentElement, points, classList}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    super({parentElement, rootElement:node, points, classList});
  }
}

/**
 * Class for a SVG Line
 * @extends BaseShape
 */
export class Line extends BaseShape {
  /**
   * Create a Line class
   * @param {SVGElement} parentElement to attach line to
   * @param {*} point1 First point of line
   * @param {*} point2 Second point of line
   * @param {Array.<string>} [classList] Css classes of line Node
   */
  constructor({parentElement, point1={x:0,y:0}, point2={x:0,y:0}, classList}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const points = [];
    node.x1.baseVal.value = point1.x;
    node.y1.baseVal.value = point1.y;
    node.x2.baseVal.value = point2.x;
    node.y2.baseVal.value = point2.y;

    if (point1 instanceof Point) {
      if (point1._x._lenRef || point1._y._lenRef)
        point1 = new Point({followPoint:point1})
      point1._x._lenRef = node.x1.baseVal;
      point1._y._lenRef = node.y1.baseVal;
      points.push(point1);
    } else
      points.push(new Point({
        svgLenXRef:node.x1.baseVal,
        svgLenYRef:node.y1.baseVal
      }));

    if (point2 instanceof Point) {
      if (point2._x._lenRef || point2._y._lenRef)
        point2 = new Point({followPoint:point2})
      point2._x._lenRef = node.x2.baseVal;
      point2._y._lenRef = node.y2.baseVal;
      points.push(point2);
    } else
      points.push(new Point({
        svgLenXRef:node.x2.baseVal,
        svgLenYRef:node.y2.baseVal
      }));

    super({parentElement, rootElement:node, points, classList});
  }

  get point1() {
    return this._points[0];
  }

  set point1(point) {
    this._points[0].point = point;
  }

  get point2() {
    return this._points[1];
  }

  set point2(point) {
    this._points[1].point = point;
  }
}

/**
 * Class for dynamic SVG texts
 * @extends BaseShape
 * @property {string} text The text displayed
 * @property {Point|null} point - The point to follow, null clears followPoint
 * @property {number} followOffsetX - followPoint offset by X
 * @property {number} followOffsetY - followPoint offset by Y
*/
export class Text extends BaseShape {
  _offsetX = 0;
  _offsetY = 0;
  _followPoint = null;
  /**
   * Create a SVG text element class
   * @param {SVGElement} parentElement The SVG node to attach this.node to.
   * @param {Point|{x:number,y:number}} point pos text at
   * @param {string} text The Text to show
   * @param {Array.<string>} [classList] The Css classes to this node
   * @param {Point} followPoint Follows this point, we move with this node automatically
   * @param {number} offsetX followPoint offset by X
   * @param {number} offsetY followPoint offset y Y
   */
  constructor({parentElement, point={x:0,y:0}, text, classList,
              followPoint, offsetX=0, offsetY=0}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const svgElem = lookupSvgRoot(parentElement);
    node.x.baseVal.appendItem(svgElem.createSVGLength());
    node.y.baseVal.appendItem(svgElem.createSVGLength());
    node.x.baseVal[0].value = followPoint ? followPoint.x : point.x;
    node.y.baseVal[0].value = followPoint ? followPoint.y : point.y;
    const svgLenXRef = node.x.baseVal.getItem(0),
          svgLenYRef = node.y.baseVal.getItem(0);

    if (point instanceof Point) {
      point._x._lenRef = svgLenXRef;
      point._y._lenRef = svgLenYRef;
    } else
      point = new Point({svgLenXRef, svgLenYRef});

    super({parentElement, rootElement:node, points:[point], classList});

    this._followPointChanged.bound = this._followPointChanged.bind(this);
    this._offsetX = offsetX;
    this._offsetY = offsetY;
    if (followPoint) this.followPoint = followPoint;
    if (text) this.text = text;
  }

  get followPoint() {
    return this._followPoint;
  }

  set followPoint(point) {
    if (point === null) {
      if (this._followPoint) {
        this._followPoint.removeChangeCallback(this._followPointChanged.bound);
        this._followPoint = null;
      }
    } else if (point instanceof Point) {
      if (this._followPoint) // clear old follow point
        this.followPoint = null;
      this._followPoint = point;
      point.addChangeCallback(this._followPointChanged.bound);
    }
    if (this._followPoint)
      this._followPointChanged();
  }

  get followOffsetX() {
    return this._offsetX;
  }

  set followOffsetX(offsetX) {
    this._offsetX = offsetX;
    if (this._followPoint)
      this._followPointChanged();
  }

  get followOffsetY() {
    return this._offsetY;
  }

  set followOffsetY(offsetY) {
    this._offsetY = offsetY;
    if (this._followPoint)
      this._followPointChanged();
  }

  /**
   * Sets or clears a followPoint
   */

  get text() {
    return this.node.innerHTML;
  }

  set text(newText) {
    this.node.innerHTML = newText;
  }

  _followPointChanged() {
    this.offset.point = [
      this._followPoint.x + this._offsetX,
      this._followPoint.y + this._offsetY
    ];
  }
}

/***
 * A compound group of other shapes, Base class
 * @extends BaseShape
 * @property {Array.<BaseShape>} shapes All shapes contained in this object
 * @property {number} angle The rotation angle of this object
 * @property {SizeRect} size The size of this shape, set by width, height at construction
 */
export class Group extends BaseShape {
  _shapes = [];
  _rot = null;

  /**
   * Create a new Group, can contain many shapes
   * @param {SVGElement} parentElement The svg node to connect this shape to
   * @param {Point|{x:number,y:number}} centerPoint The centerPoint for this class
   * @param {number} [width] The width of this shape
   * @param {number} [height] The height of this shape
   * @param {string} [classList] The css classed of this shape
   * @param {Array.<BaseShape>} [shapes] Add these shapes to group
   */
  constructor({parentElement, centerPoint={x:0,y:0}, width, height, classList, shapes=[]}) {
    const rootElement = document.createElementNS("http://www.w3.org/2000/svg", "g");

    if (centerPoint instanceof Point)
      centerPoint = new Point({followPoint:centerPoint});
    else
      centerPoint = new Point({x:centerPoint.x, y:centerPoint.y});

    super({parentElement, rootElement, points: [centerPoint], classList});

    let oldPos = {x:centerPoint.x, y:centerPoint.y};

    centerPoint.addChangeCallback((pnt)=>{
      this.shapes.forEach(shp=>{
        const pt = {
          x:pnt.x + shp.offset.x - oldPos.x,
          y:pnt.y + shp.offset.y - oldPos.y
        };
        shp.move(pt);
      });
      oldPos.x = pnt.x; oldPos.y = pnt.y;
    })
    this.size = new SizeRect({centerPoint, width, height});
    this._rot = new Rotation({point:centerPoint});

    for (const shp of shapes)
      this.addShape(shp);
  }

  /**
   * Scale this and all contained shapes
   * @param {number} factor The factor to scale with
   * @param {number} [xFactor] The factor to scale X with
   * @param {number} [yFactor] The factor to scale Y with
   * @param {Point|{x:number,y:number}} anchorPt The centerpoint for the scaling
   */
  scale({factor=1, xFactor=null, yFactor=null, anchorPt}, _recurseCnt=0) {
    if (!anchorPt)
      anchorPt = this.offset;

    if (_recurseCnt < 2)
      super.scale({factor, xFactor, yFactor, anchorPt});

    for (const shp of this._shapes)
      shp.scale({factor, xFactor, yFactor, anchorPt}, ++_recurseCnt);

    xFactor = xFactor !== null && !isNaN(xFactor) ? xFactor : factor;
    yFactor = yFactor !== null && !isNaN(yFactor) ? yFactor : factor;
    const w = this.size.width * xFactor,
          h = this.size.height * yFactor;
    this.size.width = Math.max(w, -w);
    this.size.height = Math.max(h, -h);
  }

  /**
   * Move this and all contained shapes
   * @param {Point|{x:number,y:number}} newPoint Move to this pos
   */
  move(newPoint) {
    const moveOperation = (shp, isMoving) => {
      shp._isMoving = isMoving;
      shp._shapes?.forEach(s=>{ moveOperation(s, isMoving); });
    }
    moveOperation(this, true);

    const newX = Array.isArray(newPoint) ? newPoint[0] : newPoint.x,
          newY = Array.isArray(newPoint) ? newPoint[1] : newPoint.y;
    const xDiff = !isNaN(newX) ? newX - this.offset.x : 0,
          yDiff = !isNaN(newY) ? newY - this.offset.y : 0;
    super.move.apply(this, arguments);

    moveOperation(this, false);
  }

  /**
   * Flip this and all contained shapes at X axis
   */
  flipX() {
    this.scale({xFactor:-1});
  }

  /**
   * Flip this and all contained shapes at Y axis
   */
  flipY(){
    this.scale({yFactor:-1});
  }

  /**
   * Add a Shape to this group
   * @param {BaseShape} shape The shape to add
   */
  addShape(shape) {
    this._shapes.push(shape);
    this._rot.addRotateShape(shape);
  }

  get shapes() {
    return [...this._shapes];
  }

  get angle(){
    return this._rot.angle;
  }

  set angle(newAngle){
    this._rot.angle = newAngle;
    for(const shp of this._shapes)
      shp.angle = newAngle;
  }
}