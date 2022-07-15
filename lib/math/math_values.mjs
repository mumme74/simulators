import { fpRound } from "./math_engine.mjs";
import { SyntaxTreeNode } from "../parser/parser.mjs";
import { toFraction } from "../helpers/index.mjs";

/**
 * Base class for all values
 * @prop {string} type The typename of this value
 */
 export class Value {
  constructor(value, type) {
    this._value = value;
    this.type = type || 'value';
  }

  static create(value, denominator) {
    if (value instanceof SyntaxTreeNode) {
      switch (value.type) {
      case 'integer': return new Integer(value);
      case 'float': return new Float(value);
      case 'fraction': return new Fraction(value);
      case 'variable': return new Variable(value);
      }
    } else if (denominator !== undefined || value instanceof Fraction)
      return new Fraction(value, denominator);
    const numVlu = parseFloat(value);
    if (Number.isNaN(numVlu))
      return new Variable(value);
    if (Number.isInteger(numVlu))
      return new Integer(numVlu);
    return new Float(value);
  }

  /**
   * Return the class that constructed value
   * @param {Value} value
   * @returns {Value|Integer|Float|Fraction} The class type to construct value from
   */
  static classOf(value) {
    return {
      variable:Variable,
      integer:Integer,
      float:Float,
      fraction:Fraction,
      value:Value
    }[value.type];
  }
  /**
   * Clone a value
   * @returns {Value|Integer|Float|Fraction} The new copy of this value
   */
  clone(){
    return new (Value.classOf(this))(this._value);
  }
  /**
   * Return the value contained by this value class
   * @returns {number|string} The value contained in this value
   */
  value() {
    return this._value;
  }

  toString() {
    return '' + this._value;
  }
}

export class Variable extends Value {
  constructor(letter) {
  if (letter instanceof SyntaxTreeNode) {
    letter = letter.tokString();
  } else if (letter instanceof Variable) {
    letter = letter._value;
  }
    super(letter, 'variable');
  }
}

export class Integer extends Value {
  constructor(value) {
    if (value instanceof SyntaxTreeNode) {
      value = parseInt(value.tokString());
    } else if (value instanceof Integer) {
      value = value._value;
    }
    super(value, 'integer');
  }
}

export class Float extends Value {
  constructor(value) {
    let whole, dec, point;
    if (value instanceof SyntaxTreeNode) {
      whole = value.children[0].tokString();
      point = value.children[1].tokString();
      dec   = value.children[2].tokString();
    } else {
      const res = /^(.*)([.,])(.*)$/.exec(''+value);
      whole = res[1]; point = res[2]; dec = res[3];
    }

    if (point) value = parseFloat(`${whole}.${dec}`);

    super(value, 'float');
    // after super call this is available
    this.whole = whole;
    this.dec = dec;
    this.point = point;

  }
  clone(){
    const cl = super.clone();
    cl.whole = this.whole;
    cl.dec = this.dec;
    cl.point = this.point;
    return cl;
  }
  toString() {
    return `${this.whole}${this.point}${this.dec}`;
  }
}

// ie ½
export class Fraction extends Value {
  constructor(numerator, denominator) {
    if (numerator instanceof SyntaxTreeNode) {
      denominator = numerator.children[3]?.tokString();
      numerator = numerator.children[1]?.tokString();
    } else if (numerator instanceof Fraction) {
      denominator = numerator.denominator;
      numerator = numerator.numerator;
    }

    super(null, 'fraction');

    this.numerator = parseInt(numerator);
    this.denominator = parseInt(denominator);
    this._value = this;
  }
  toString() {
    return `frac ${this.numerator}/${this.denominator}`;
  }
}
