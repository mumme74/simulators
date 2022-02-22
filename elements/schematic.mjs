"use strict";

import { BaseShape, lookupSvgRoot, Polyline, SizeRect } from "./base.mjs";
import { Point } from "./point.mjs";

export class Net {
  static _netNames = {__cnt:0};
  _points = [];

  constructor({name, namePrefix="net", type="generic", points=[]}) {
    this._net = Net._name(name, namePrefix, type);
    if (points?.length)
      this._points = points.filter(p=>p instanceof Point);
  }

  get name() {
    return this._net.name;
  }

  get type() {
    return this._net.type;
  }

  get net() {
    return {...this._net};
  }

  get points() {
    return [...this._points];
  }

  set points(points) {
    if (Array.isArray(points)) {
      const pts = points.filter(p=>p instanceof Point);
      this._points = [...pts];
    } else
      this._points = [];
  }

  canConnect(point) {
    if (!point?.owner?._nets ||
        !(point instanceof Point) ||
        this._points.indexOf(point) > -1)
    {
      return false;
    }
    const myPnt = this._findPointAt(point);
    return myPnt !== undefined;
  }

  connect(point) {
    if (this.canConnect(point)) {
      const myPnt = this._findPointAt(point);
      if (myPnt) {
        myPnt.followPoint = point;
        return true;
      }
    }
    return false;
  }

  disconnect(point) {
    let res = false;
    const conPnts = point.connectedPoints();
    conPnts.filter(p=>this._points.indexOf(p)>-1).map(p=>{
      p.followPoint = null;
      res = true;
    });
    return res;
  }

  /**
  * Finds all points connected to this and attached wires
  * @returns {Array.<Point>} All points this net is connected to
  */
  connections() {
    const visited = [], endPts = [];
    // recursivly look up ends connected to all sub wires
    const endLookUp = (wire, point) => {
      for (const pnt of point.connectedPoints()) {
        if (pnt.owner instanceof Wire) {
          if (visited.indexOf(pnt) === -1) {
            visited.push(pnt);
            if (pnt.owner !== wire) {
              for (const p of pnt.owner._points)
                endLookUp(pnt.owner, p);
            }
          }
        } else if (endPts.indexOf(pnt) === -1)
          endPts.push(pnt);
      }
    }
    for (const p of this._points)
      endLookUp(this, p);

    return endPts;
  }


  _findPointAt(pnt) {
    return this._points.find(p=>{
      return p.x === pnt.x && p.y===pnt.y && p!==pnt;
    });
  }


  static _name(name, namePrefix, type) {
    if (!Net._netNames[type])
      Net._netNames[type] = {};

    if (name) {
      if (name in Net._netNames[type])
        throw new Error(`Net name ${name} already taken.`);
      return Net._netNames[type][name] = {name, type, gen:"userGen"};
    }

    const genName = `${namePrefix}${Net._netNames.__cnt++}_${type}`;
    return Net._netNames[type][genName] = {name:genName, type, gen:"autoGen"};
  }
}

export class ComponentBase extends BaseShape {
  _shapes = [];
  _state = 0;

  constructor({parentElement, className, width, height,
              centerPoint={x:0,y:0}, name, nets=[]}) {
    const rootElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const transform = lookupSvgRoot(parentElement).createSVGTransform();
    transform.matrix.e = centerPoint.x;
    transform.matrix.f = centerPoint.y;
    rootElement.transform.baseVal.appendItem(transform);

    if (!(centerPoint instanceof Point))
      centerPoint = new Point({x:centerPoint.x, y:centerPoint.y});

    centerPoint.addChangeCallback((pnt)=>{
      transform.matrix.e = pnt.x;
      transform.matrix.f = pnt.y;
    })

    super({parentElement, rootElement, points: centerPoint, className});

    this.name = name || "";
    this._nets =  nets;
    this.size = new SizeRect({centerPoint, width, height});
    this.size.centerPoint.followPoint = this.offset;
  }

  get nets() {
    return [...this._nets];
  }

  addShape(shape) {
    this._shapes.push(shape);
  }

  get shapes() {
    return [...this._shapes];
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
    this._stateChanged(newState);
  }

  _stateChanged(newState) {
    /* subclass implement */
  }
}

/**
 * A Wire class, Auto 90deg corners
 * It also gets all endpoints for this and all sequential wires
 * @extends Polyline
 * @property {Point} startPnt The first point of the Wire
 * @property {Point} endPnt The last pointof the Wire
 * @property {Array.<Point>} betweenPnts An array of all the points Line must croww through
 */
export class Wire extends Polyline {
  /**
   * Creates a new Wire
   * @param {SVGElement} parentElement The element to attach this node to
   * @ param {Point|{x:number,y:number}} startPnt First point of wire.
   * @ param {Point|{x:number,y:number}} endPnt Last point of wire.
   * @param {Array.<Point>} betweenPnts List of points wire should cross trough
   * @param {string} className The CSSclasses this.node should have
   */
  constructor({parentElement, startPnt={x:0,y:0}, endPnt={x:0,y:0}, betweenPnts=[], className}) {
    let points = [
      new Point({x: startPnt.x, y: startPnt.y}),
      new Point({x: endPnt.x, y: endPnt.y})
    ];
    if (startPnt instanceof Point)
      points[0].followPoint = startPnt;
    if (endPnt instanceof Point)
      points[1].followPoint = endPnt;

    super({parentElement, points, className});

    this.recalculate.bound = this.recalculate.bind(this);
    points.forEach(p=>p._onChangeCallbacks.push(this.recalculate.bound))

    this.betweenPnts = betweenPnts;
  }

  setPoint(idx, newPoint) {
    if (idx < 0 || idx > this.points.length) return;
    const myPnt = this.points[idx];
    const isPnt = newPoint instanceof Point;
    if (myPnt.followPoint || isPnt)
      myPnt.followPoint = isPnt ? newPoint : null;
    else
      myPnt.point = newPoint;
  }

  get startPnt() {
    return this._points[0];
  }

  set startPnt(point) {
    this.setPoint(0, point);
  }

  get endPnt() {
    return this._points[this._points.length-1];
  }

  set endPnt(point) {
    this.setPoint(this._points.length-1, point);
  }

  get betweenPnts() {
    const endIdx = this._points.length-1;
    return this._points.filter((p,idx)=>idx!==0 && idx!==endIdx && p.pinned);
  }

  set betweenPnts(points) {
    points = points.map(p=>{
      if (!(p instanceof Point))
        p = new Point({x:p.x, y:p.y});
      p.pinned=true
      p.addChangeCallback(this.recalculate.bound);
      return p;
    });

    this.points = this._autoMiddlePoints(
      [this.startPnt, ...points, this.endPnt]);
  }

  /**
   * Updates wire and auto inserts 90deg points
   */
  recalculate() {
    // find all pinned points
    const pinnedPts = [
      this.startPnt,
      ...this._points.filter(p=>p.pinned===true),
      this.endPnt
    ];

    this.points = this._autoMiddlePoints(pinnedPts);
  }

  /**
   * Finds all points connected to this and attached wires
   * @returns {Array.<Point>} All points this net is connected to
   */
  connections() {
    const visited = [], endPts = [];
    // recursivly look up ends connected to all sub wires
    const endLookUp = (wire, point) => {
      for (const pnt of point.connectedPoints()) {
        if (pnt.owner instanceof Wire) {
          if (visited.indexOf(pnt) === -1) {
            visited.push(pnt);
            if (pnt.owner !== wire) {
              for (const p of pnt.owner._points)
                endLookUp(pnt.owner, p);
            }
          }
        } else if (endPts.indexOf(pnt) === -1)
          endPts.push(pnt);
      }
    }
    for (const p of this._points)
      endLookUp(this, p);

    return endPts;
  }

  _autoMiddlePoints(pinnedPts) {
    // track from first to last pinned points
    const newPts = [];
    let prevPnt = this.endPnt;

    for(let i = 0; i < pinnedPts.length-1; ++i) { // -1 to account for pt1 idx
      const pt0 = pinnedPts[i], pt1 = pinnedPts[i+1];
      const xDiff = pt1.x - pt0.x,
            yDiff = pt1.y - pt0.y;
      newPts.push(pt0);
      if (xDiff !== 0 && yDiff !== 0) {
        // insert a middle point between the 2
        let x, y;                   // p=prev, 0=pt0, n= new, 1=pt1
                                    //    p
                                    //    |
        if (prevPnt.x === pt0.x) {  //    0
          x = pt0.x;                //    |
          y = pt1.y;                //    n-1
        } else
          if (prevPnt.y === pt0.y) {  // p-0-n
          x = pt1.x;                  //     |
          y = pt0.y;                  //     1
        } else {
          x = (xDiff > yDiff) ? pt1.x : pt0.x;
          y = (xDiff > yDiff) ? pt0.y : pt1.y;
        }
        prevPnt = new Point({x, y,owner:this});
        newPts.push(prevPnt);
      } else
        prevPnt = pt0;
    }

    return [...newPts, pinnedPts[pinnedPts.length-1]];
  }
}
