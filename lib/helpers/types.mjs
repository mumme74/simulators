"use strict";

export function typeCheck(value) {
  const typevalue = Object.prototype.toString.call(value);
  // we can also use regex to do this...
  const type = typevalue.substring(
           typevalue.indexOf(" ") + 1,
           typevalue.indexOf("]"));

  return type.toLowerCase();
}

export function isString(obj) {
  return typeCheck(obj) === 'string';
}

export function isDate(obj) {
  return typeCheck(obj) === 'date';
}

export function isNumber(obj) {
  return typeCheck(obj) === 'number';
}

export function isBigInt(obj) {
  return typeCheck(obj) === 'bigint';
}

export function isSymbol(obj) {
  return typeCheck(obj) === 'symbol';
}

export function isBoolean(obj) {
  return typeCheck(obj) === 'boolean';
}

export function isNull(obj) {
  return typeCheck(obj) === 'null';
}

export function isFunction(obj) {
  return typeCheck(obj) === 'function';
}