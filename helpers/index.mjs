"use strict";

/**
 * @breif warps obj with a observe proxy
 * @param {*} removeCb called when a property is removed
 * @param {*} setCb called when a property is set (new or updated)
 * @param {*} obj the object to observe
 * @returns the observe Proxy
 */
export function observeObject(removeCb, setCb, obj = []) {
  return new Proxy(obj, {
    apply: function(target, thisArg, argumentsList) {
      return thisArg[target].apply(this, argumentsList);
    },
    deleteProperty: (target, property) =>{
      const res = removeCb(target, property);
      if (res || res === undefined) {
        delete target[property];
        return true;
      }
      return false;
    },
    set: (target, property, value, reciever)=>{
      if (Array.isArray(target) && property === 'length') {
        target[property] = value;
        return true;
      }

      const res = setCb(target, property, value, reciever);
      if (res || res === undefined) {
        target[property] = value;
        return true;
      }
      return false;
    }
  });
}

/**
 * @brief Calculates the least common denominator of x
 * @param {number} vlu the value we want a fraction of
 * @param {number} tolerance how low we should go
 * @param {boolean} useInt separate integer from num
 * @returns {{int, num, den}} int = integer, num=numerator, den=denominator
 */
export function toFraction({vlu, tolerance=0.001, useInt=true}) {

  let int = useInt ? 0 : undefined;
  if (vlu == 0) return {int, num:0, den:1};
  const neg = vlu < 0 ? -1 : 1;
  if (vlu < 0) vlu = -vlu;
  let num = 1, den = 1;

  function iterate() {
    const R = num/den;
    if (Math.abs((R-vlu)/vlu) < tolerance)
     return;
    if (R < vlu) num++;
    else den++;
    iterate();
  }

  iterate();
  if (useInt) {
    while (num >= den) {
      ++int; num -= den;
    }
  }
  return {int, num: num*neg, den};
}


/**
 * A class that stores applications state on location hash string
 * @property {Object} A ref to the internal tracked stateobject
 */
export class StateFromHash {
  /**
   *
   * @param {*} initialState
   */
  constructor(initialState={}) {
    if (location.hash.length > 5) {
      location.hash.substring(1).split("&").forEach(itm=>{
        const pair = itm.split("=");
        if (pair.length > 1)
          initialState[pair[0]] = decodeURIComponent(pair[1]);
      });
    } else
      this._rebuildHash(initialState);

    this._state = observeObject(
      this._removeCb.bind(this), this._setCb.bind(this), initialState
    );
  }

  get ref(){
    return this._state;
  }

  /**
   * Gets a property from internal store
   * @param {string} prop The name óf property to get
   * @returns the stored value
   */
  get (prop) {
    return this._state[prop];
  }

  /**
   * Sets propertyr with value if not going through ref
   * @param {string} prop The name of the property to set
   * @param {string} value The value to set said proerty to
   */
  set (prop, value) {
    this._state[prop] = value;
  }

  _removeCb(trgt, prop) {
    delete trgt[prop];
    this._rebuildHash;
  }

  _setCb(trgt, prop, vlu) {
    trgt[prop] = vlu;
    this._rebuildHash(trgt);
  }

  _rebuildHash(trgt) {
    location.hash =
      Object.entries(trgt).map(a=>{
        if (a[0].indexOf('$') < 0)
          return `${a[0]}=${encodeURIComponent(a[1])}`;
      }).filter(p=>p).join("&");
  }
}
