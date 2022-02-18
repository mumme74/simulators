"use strict";

import { Point } from "./point.mjs";

function lookupSvgRoot(svgElem) {
  while(svgElem && svgElem.tagName !== 'svg')
    svgElem = svgElem.parentElement;
  return svgElem;
}

export class BaseShape {
  _points = [];
  _svgElem = null;

  constructor({parentElement, rootElement, points, className}) {
    this.node = rootElement;
    if (className)
      this.node.setAttribute("class", className);
    parentElement.appendChild(this.node);

    this._svgElem = lookupSvgRoot(parentElement);

    for (let i = 0; i < points.length; ++i) {
      let pnt = points[i];
      if (!(pnt instanceof Point)) {
        const svgPntRef = rootElement?.points.getItem(i);
        pnt = new Point({x:pnt.x, y:pnt.y, svgPntRef, owner: this});
      }
      this._decorateNewPoint(pnt);
      this._points.push(pnt);
    }

  }

  move(newPoint) {
    const newX = Array.isArray(newPoint) ? newPoint[0] : newPoint.x,
          newY = Array.isArray(newPoint) ? newPoint[1] : newPoint.y;
    const xDiff = !isNaN(newX) ? newX - this.offset.x : 0,
          yDiff = !isNaN(newY) ? newY - this.offset.y : 0;
    for(const pt of this._points)
      pt.point = [pt.x + xDiff, pt.y + yDiff];
  }

  scale({factor=1, xFactor=null, yFactor=null}) {
    xFactor = xFactor === null ? factor : xFactor;
    yFactor = yFactor === null ? factor : yFactor;

    // dont move our scaled object, only scale it
    const anchorPt = this._points[0];
    const xDiff = (anchorPt.x * xFactor) - anchorPt.x,
          yDiff = (anchorPt.y * yFactor) - anchorPt.y;

    for(let i = 1; i < this._points.length; ++i) {
      const pt = this._points[i];
      pt.point = [
        pt.x * xFactor - xDiff,
        pt.y * yFactor - yDiff
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

export class BasePointsShape extends BaseShape {
  constructor({parentElement, rootElement, points, className}) {
    const svgElem = lookupSvgRoot(parentElement);

    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(' '));
    super({parentElement, rootElement, points, className});

    if (this.node.points.getItem(0) !== this._points[0]._pntRef) console.log("fail")
  }

  _decorateNewPoint(pnt) {
    return pnt._pntRef ? pnt : this.makePointWithSvgRef(pnt);
  }

  _recalulatePnts(points) {
    // we nee to insert into node, then take ref, appendItem copies pont instead of using it directly
    this.node.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(' '));
    for(let i = 0; i < this.points.length; ++i)
      this.points[i]._pntRef = this.node.points.getItem(i);
  }

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

  makePointWithSvgRef(pnt) {
    return BasePointsShape.makePointWithSvgRefStatic(pnt, this._svgElem);
  }
}

export class Polygon extends BasePointsShape {
  constructor({parentElement, points, className}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', "polygon");
    super({parentElement, rootElement:node, points, className});
  }
}

export class Polyline extends BasePointsShape {
  constructor({parentElement, points, className}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    super({parentElement, rootElement:node, points, className});
  }
}

export class Line extends BaseShape {
  constructor({parentElement, point1={x:0,y:0}, point2={x:0,y:0}, className}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const points = [];
    node.x1.baseVal.value = point1.x;
    node.y1.baseVal.value = point1.y;
    node.x2.baseVal.value = point2.x;
    node.y2.baseVal.value = point2.y;

    if (point1 instanceof Point) {
      point1._x._lenRef = node.x1;
      point1._y._lenRef = node.y1;
      points.push(point1);
    } else
      points.push(new Point({svgLenXRef:node.x1, svgLenYRef:node.y1}));

    if (point2 instanceof Point) {
      point2._x._lenRef = node.x2;
      point2._y._lenRef = node.y2;
      points.push(point2);
    } else
      points.push(new Point({svgLenXRef:node.x2, svgLenYRef:node.y2}));

    super({parentElement, rootElement:node, points, className});
  }
}

export class Text extends BaseShape {
  _offsetX = 0;
  _offsetY = 0;
  _followPoint = null;
  constructor({parentElement, point={x:0,y:0}, text, className,
              followPoint, offsetX=0, offsetY=0}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    node.x.baseVal.value = point.x;
    node.y.baseVal.value = point.y;

    if (point instanceof Point) {
      point._x._lenRef = node.x;
      point._y._lenRef = node.y;
    } else
      point = new Point({svgLenXRef:node.x, svgLenYRef:node.y});

    super({parentElement, rootElement:node, points:[point], className});

    this._followPointChanged.bound = this._followPointChanged.bind(this);
    if (followPoint) this.followPoint({point:followPoint, offsetX, offsetY});
    if (text) this.text = text;
  }

  followPoint({point, offsetX=0, offsetY=0}) {
    this._offsetX = offsetX;
    this._offsetY = offsetY;

    if (point === null) {
      if (this._followPoint) {
        this._followPoint.removeChangeCallback(this._followPointChanged.bound);
        this._followPoint = null;
      }
    } else if (point instanceof Point) {
      if (this._followPoint) // clear old follow point
        this.followPoint({point:null, offsetX, offsetY});
      this._followPoint = point;
      point.addChangeCallback(this._followPointChanged.bound);
    }
    if (this._followPoint)
      this._followPointChanged();
  }

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