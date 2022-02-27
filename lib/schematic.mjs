"use strict";

import { BaseShape, Group, lookupSvgRoot, Polyline, SizeRect } from "./base.mjs";
import { Point } from "./point.mjs";

/**
 * A baseclass which handles all nets.
 * When a component in a schema/diagram connects to another via a wire
 * It does so with this class as a base.
 * @property {string} name The user given name of this net
 * @property {string} type The type of this net, ie electric, pneumatic etc
 * @property {Array.<Point>} points All endpoints connected to this net
 * @property {{name:string, type:string, gen:string}} net A ref to this nets basic data
 */
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

  /**
   * Checks if point can connect to this net.
   * If point is of different typ or at another net owns it it fails
   * @param {Point} point The point to check
   * @returns {boolean} true if it is possible to connect
   */
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

  /**
   * Connects Point to this net, if it can
   * @param {Point} point The point to connect
   * @returns {boolean} true on successfully connected
   */
  connect(point) {
    if (this.canConnect(point)) {
      const myPnt = this._findPointAt(point);
      if (myPnt) {
        myPnt.connect(point)
        return true;
      }
    }
    return false;
  }

  /**
   * Disconnects Point from this net
   * @param {Point} point The point to disconnect from this net
   * @returns {boolean} true of point was sucessfully disconnected.
   *    NOTE! if point is not connected here it also returns false
   */
  disconnect(point) {
    let res = false;
    const conPnts = point.connectedPoints;
    conPnts.filter(p=>this._points.indexOf(p)>-1).map(p=>{
      p.disconnect();
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

/**
 * Base class for all Schamtic components
 * @extends Group
 * @property {any} state A state variable, internal store,
 *     handles event roting on update and makes it possible to serialize component
 * @property {Array.<ComponentBase>} components An array of subcomponents within this component
 * @property {Array.<BaseShape>} terminals An array of terminals within this component
 */
export class ComponentBase extends Group {
  _shapes = [];
  _components = [];
  _terminals = [];
  _state = 0;

  constructor({parentElement, classList, width, height,
              centerPoint={x:0,y:0}, name, nets=[]}) {

    super({parentElement, centerPoint, classList, width, height});

    this.name = name || "";
    this._nets =  nets;
  }

  get nets() {
    return [...this._nets];
  }

  /**
   * Adds a subcomponent this component
   * @param {ComponentBase} component The component to add
   */
  addComponent(component) {
    this._components.push(component);
    this.addShape(component)
  }

  /**
   * Adds a terminal (In/out) os this component
   * @param {BaseShape} terminal The shape that is the teminal (usually its a Line)
   * @param {Net} net The net this terminal is connected to
   */
  addTerminal(terminal, net) {
    this._terminals.push({terminal, net});
    this.addShape(terminal);
  }

  get components(){
    return [...this._components];
  }

  get state() {
    return this._state;
  }

  get terminals() {
    return [...this._terminals];
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
   * @param {Array.<string>} [classList] The CSSclasses this.node should have
   */
  constructor({parentElement, startPnt={x:0,y:0}, endPnt={x:0,y:0}, betweenPnts=[], classList}) {
    let points = [
      new Point({x: startPnt.x, y: startPnt.y}),
      new Point({x: endPnt.x, y: endPnt.y})
    ];
    // connect to points
    [startPnt, endPnt].forEach((p,i)=>{
      if (p instanceof Point) {
        points[i].followPoint = p;
        points[i].connect(p);
      }
    });

    super({parentElement, points, classList});

    this.recalculate.bound = this.recalculate.bind(this);
    points.forEach(p=>p._onChangeCallbacks.push(this.recalculate.bound))

    this.betweenPnts = betweenPnts;
  }

  setPoint(idx, newPoint) {
    if (idx < 0 || idx > this.points.length) return;
    const myPnt = this.points[idx];
    const isPnt = newPoint instanceof Point;
    if (myPnt.followPoint || isPnt) {
      myPnt.followPoint = isPnt ? newPoint : null;
      myPnt[isPnt ? "connect" : "disconnect"](newPoint)
    } else
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
      for (const pnt of point.connectedPoints) {
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
