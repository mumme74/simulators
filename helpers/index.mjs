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
