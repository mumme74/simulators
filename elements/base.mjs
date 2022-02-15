"use strict";

import { Point } from "./point.mjs";

export class BaseShape {
  _points = [];
  _svgElem = null;

  constructor({parentElement, rootElement, points, className}) {
    for (let i = 0; i < points.length; ++i) {
      const pt = points[i];
      if (pt instanceof Point)
        this._points.push(pt);
      else {
        const svgPntRef = rootElement?.points[i];
        this._points.push(new Point({x:pt.x, y:pt.y, svgPntRef}));
      }
    }

    this.node = rootElement;
    if (className)
      this.node.setAttribute("class", className);
    parentElement.appendChild(this.node);

    this._svgElem = this.node;
    while(this._svgElem && this._svgElem.tagName !== 'svg')
      this._svgElem = this._svgElem.parentElement;
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
    let newIter = 0;
    for (const pt of this.points) {
      if (points.length === newIter) break;
      const newPt = points[newIter++];
      const x = !isNaN(newPt.x) ? newPt.x : 0,
            y = !isNaN(newPt.y) ? newPt.y : 0;
      pt.point = {x, y};
    }
  }

  get offset() {
    return this._points[0];
  }

  set offset(point) {
    this._points[0].point = point;
  }
}

export class BasePointsShape extends BaseShape {
  constructor({parentElement, rootElement, points, className}) {
    rootElement.setAttribute("points", points.map(p=>`${p.x},${p.y}`).join(' '));
    super({parentElement, rootElement, points, className});
  }

  get points() {
    return [...this._points];
  }

  set points(points) {
    const origLen = this._points.length;
    super.points = points; // opdate existing position in super

    if (origLen < points.length) {
      // add points
      for(let i = origLen; i < points.length; ++i){
        const svgPt = this._svgElem.createSVGPoint();
        svgPt.x = points[i].x; svgPt.y = points[i].y;
        this.node.points.appendItem(svgPt);
        this._points.push(new Point({svgPntRef:svgPt}));
      }
    } else if (origLen > points.length) {
      // remove points
      // need to save one point as all shapes must have at least one
      for(let i = origLen-1; i > Math.max(points.length-1, 0); --i) {
        this.node.points.removeItem(i);
        this._points.pop();
      }
    }
  }

  insertPoint(point, beforePt=null) {
    const svgPt = this._svgElem.createSVGPoint();
    let pt;
    if (point instanceof Point) {
      point._pntRef = svgPt;
      svgPt.x = point.x; svgPt.y = point.y;
      pt = point;
    } else if (Array.isArray(point)) {
      svgPt.x = point[0]; svgPt.y = point[1];
      pt = new Point({svgPntRef:svgPt});
    } else {
      svgPt.x = point.x; svgPt.y = point.y;
      pt = new Point({svgPntRef:svgPt});
    }

    const idx = !isNaN(beforePt) ? beforePt : this._points.indexOf(beforePt);
    if (idx !== null && idx > -1) {
      this.node.points.insertItemBefore(svgPt, idx);
      this._points.splice(idx, 0, pt);
    } else {
      this.node.points.appendItem(svgPt);
      this._points.push(pt);
    }
  }

  removePoint(point) {
    let pt;
    if (point instanceof Point)
      pt = point;
    else if (!isNaN(point))
      pt = this.points[point];
    else if (Array.isArray(point))
      pt = this.points.find(p=>p.x===point[0] && p.y===point[1]);
    else
      pt = this.points.find(p=>p.x===point.x && p.y===point.y);

    const idx = this._points.indexOf(pt);
    if (idx !== null && idx > -1 && this._points.length > 1) {
      this.node.points.removeItem(idx);
      this._points.splice(idx, 1);
    }
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