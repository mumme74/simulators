"use strict";

/**
 * class for controlling length/distance
 * Can directly control a SVGLength object and update it wih this length
 * @property {number} length The value of this length
 */
export class Length {
  _len = 0;
  _lenRef = null;
  _followLength = null;
  _followLengths = [];

  /**
   * Creates a Length object
   * @param {number} length The length/Distance value
   * @param {SVGLength} svgLength The SVG length this class controls
   * @param {function} onChangeCallback A onchangeCallback this class controles
   * @param {Length} followLength A Length instance this class follows and changes with
   */
  constructor({length, svgLenRef = null, onChangeCallback, followLength}) {
    this._len = !isNaN(length) ? length : 0;
    this._lenRef = svgLenRef;
    this._onChangeCallback = onChangeCallback;
    if (followLength)
      this.followLength(followLength);
  }

  get length() {
    return this._len;
  }

  set length(newLen) {
    if (this._followLength)
      this._followLength.length = newLen;
    else if (newLen !== this._len && !isNaN(newLen)) {
      this._len = newLen;
      this._updated();
    }
  }

  /**
   * Sets a followLength this instance follows
   * @param {Length|null} length Sets or clears a length instance to follow
   */
  followLength(length) {
    if (length instanceof Length) {
      // clear old length
      if (this._followLength)
        this.followLength(null);
      this._followLength = length;
      length._followLengths.push(this);
      this._len = length._len;
      this._updated();
    } else if (!length && this._followLength) {
      const idx = this._followLength._followLengths.indexOf(this);
      if (idx > -1)
        this._followLength._followLengths.splice(idx);
      this._followLength = null;
    }
  }

  _updated() {
    if (this._lenRef)
      this._lenRef.baseVal.value = Math.round(this._len);
    if (this._onChangeCallback)
      this._onChangeCallback();

    // update all our followLenghts
    for (const len of this._followLengths) {
      len._len = this._len;
      len._updated();
    }
  }
}
