"use strict";

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