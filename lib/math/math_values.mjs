import { fpRound } from "./math_engine.mjs";
import { SyntaxTreeNode } from "../parser/parser.mjs";
import { toFraction } from "../helpers/index.mjs";
import { getTr } from "../translations/translations.mjs";

/**
 * Value error when we try to set a invalid value
 * @prop {ValueBase} value The value that threw this value
 */
export class ValueError extends Error {
  constructor(msg, value) {
    super(msg);
    this.value = value;
  }

  toString() {
    return this.message + ` ${this.value.toString()}`;
  }
}

// ------------------------------------------------------------

/**
 * A callback that gets invoked when changes occur during operation
 * for example div a fraction changes does 2 things, flip and multiply
 * @typedef {function} changeCallback
 * @param   {string} description A desription of  the change
 * @param   {string} operator The operator used
 * @param   {Array.<ValueBase>} result The result of current operation
 * @param   {Array.<ValueBase>} affected The values affected of this change
 */

/**
 * Base class for all values
 * @prop {string} type The typename of this value
 */
 export class ValueBase {
  /**
   * Constructor for Value, should not be used directly
   * Use Value.create() instead
   * @param {any} value The value stored
   * @param {string} type
   */
  constructor(value, type) {
    this._value = value;
    this.type = type || 'value';
  }

  /**
   * Factory method for values, create a new value by using this
   * @param {any} value The value to store
   * @param {object} arg
   * @param {object} arg.numerator The numerator value in a fraction
   * @param {number} arg.denominator The integer value to use as a denominator
   * @returns {ValueBase} The freshly created value
   */
  static create(value, {numerator, denominator} = {}) {
    const t = getTr(this);
    if (value instanceof SyntaxTreeNode) {
      switch (value.type) {
      case 'integer': return new Integer(value);
      case 'float': return new Float(value);
      case 'fraction': return new Fraction(value);
      case 'variable': return new Variable(value);
      default: throw new Error(t('interr',
        `InternalError can't convert $1 to a Value.`,
        t(value.type)))
      }
    } else if (value instanceof ValueBase) {
      return value.clone();
    } else if (denominator !== undefined || value instanceof Fraction)
      return new Fraction(
        numerator!==undefined ? numerator : value, denominator);
    const numVlu = parseFloat(value);
    if (Number.isNaN(numVlu))
      return new Variable(value);
    if (Number.isInteger(numVlu))
      return new Integer(numVlu);
    return new Float(value);
  }

  static operatorToStr =  {
    eq:'=',sub:'-',add:'+',div:'/',root:'√',
    nthRoot:'√',exp:'^',mul:'•'
  };

  /**
   * Return the class that constructed value
   * @param {ValueBase} value The Value object to check classOf
   * @returns {ValueBase|Integer|Float|Fraction} The class type to construct value from
   */
  static classOf(value) {
    return {
      variable:Variable,
      integer:Integer,
      float:Float,
      fraction:Fraction,
      value:ValueBase
    }[value.type];
  }
  /**
   * Clone a value
   * @returns {ValueBase|Integer|Float|Fraction} The new copy of this value
   */
  clone(){
    return new (ValueBase.classOf(this))(this._value);
  }
  /**
   * Return the value contained by this value class
   * @returns {number|string} The value contained in this value
   */
  value() {
    return this._value;
  }

  /**
   * The value stored formated as string
   * @returns {string} Value as string
   */
  toString() {
    return '' + this._value;
  }

  /**
   * Converts value to a number
   * @returns {number} Value to number
   */
  toNumber() {
    return this._value;
  }

  /**
   * Avoids IEEE759 floating pint rounding error
   * @returns {string} The printable value of this instance
   */
  printable() {
    switch (this.type) {
    case 'float': return '' + fpRound(this._value);
    case 'variable': // fallthrough
    case 'fraction': // fallthrough
    case 'integer': // fallthrough
    default: return this.toString();
    }
  }

  _cbChangesBinary(cb, operator, res, rsideVlu) {
    cb(getTr(this)('operateOn','$1 $2 $3',
        this, ValueBase.operatorToStr[operator], rsideVlu),
      operator, [res], [this, rsideVlu]);
  }

  _operTbl(operCb, operator, cb) {
    const t = getTr(this);
    const operDo = (rsideVlu)=>{
      const res = operCb(rsideVlu);
      if (cb)
        this._cbChangesBinary(cb, operator, res, rsideVlu);
      return res;
    }
    return {
      integer: operDo,
      float: operDo,
      fraction: (rsideVlu)=>{
        const lFrac = new Fraction(this._value, 1);
        if (cb)
          cb(t('convToFrac','Convert $1 to fraction', this._value),
            operator, [lFrac],[this]);
        return lFrac[operator](rsideVlu, cb);
      },
      variable: (rsideVlu)=>{
        if (operator !== 'mul')
          throw new ValueError(t('nonmulerr',
            `Can't $1 a variable to a $2`,
            t(operator), t(this.type)));
        return rsideVlu.mul(this, cb);
      }
    };
  }

  _cb(description, operator, result, nodesAffected) {}

  // these are for integer and float, other types should implement their own
  /**
   * Add rside with this value and return the result
   * This instance is unaffected
   * @param {ValueBase} rsideVlu The Value to add
   * @param {changeCallback} [cb] A callback that gets informed about the change
   * @returns {ValueBase} The result of this operation
   */
  add(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value + rsideVlu._value, 'add', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  sub(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value - rsideVlu._value, 'sub', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  mul(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value * rsideVlu._value, 'mul', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  div(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value / rsideVlu._value, 'div', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  exp(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>Math.pow(this._value, rsideVlu._value), 'exp', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  root(cb) {
    const operTbl = this._operTbl(
      ()=>Math.sqrt(this._value), 'root', cb);
    return ValueBase.create(operTbl[this.type]());
  }
  nthRoot(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>Math.pow(rsideVlu._value, (1 / this._value)), 'nthRoot', cb);
    return ValueBase.create(operTbl[this.type](rsideVlu));
  }
}

/**
 * Class from storing a variable
 * @prop {string} letter The name of this variable, should only be 1 char
 * @prop {Integer|Float|Fraction} [coeficient=1] The number this variable is multiplied by, ie: 2a -> 2*a
 * @prop {Integer} [exponent=1] The number this variable is multipled by itself. ie: x*x -> x^2
 */
export class Variable extends ValueBase {
  /**
   * Construct a new variable value
   * @param {string|Variable|SyntaxTreeNode} letter The name of this variable, should be 1 char
   * @param {object} opt Optional arguments
   * @param {Integer|Float|Fraction|number} [opt.coeficient=1] The number to multiply this variable by
   * @param {number} [opt.exponent] Raise this variable to this exponent
   */
  constructor(letter, {exponent=1, coeficient=1} = {}) {
    if (letter instanceof SyntaxTreeNode) {
      letter = letter.tokString();
    } else if (letter instanceof Variable) {
      letter = letter._value;
    }
    super(letter, 'variable');
    this.letter = letter;
    this._value = this;

    if (letter instanceof Variable) {
      this.exponent = letter.exponent.clone();
      this.coeficient = letter.coeficient.clone();
      this.letter = letter.letter;
    } else {
      this.coeficient = ValueBase.create(coeficient);
      this.exponent = ValueBase.create(exponent);
    }
  }

  toString() {
    const coef = this.coeficient.value() !== 1 ? `${this.coeficient}` : '',
          exp  = this.exponent.value() !== 1 ? `^${this.exponent}` : ''
    return `${coef}${this.letter}${exp}`;
  }

  toNumber() {
    const t = getTr(this);
    throw new ValueError(t('toNumber',
      "Can't convert a variable to a number"));
  }

  _operTbl(operCb, operator, cb) {
    const t = getTr(this);
    const coefFn = (rsideVlu)=>{
      const clone = this.clone();
      if (['add','sub'].indexOf(operator) > -1) {
        throw new ValueError(t('typeErr',
          `Can't $1 a $2 with a $3`,
          t(operator), t(rsideVlu.type), t(this.type)));
      }
      clone.coeficient = clone.coeficient[operator](rsideVlu);
      if (cb)
        this._cbChangesBinary(cb, operator, clone, rsideVlu);
      return clone;
    }

    return {
      integer: coefFn,
      float: coefFn,
      fraction: coefFn,
      variable: (rsideVlu)=>{
        const clone = this.clone();
        if (['add','sub'].indexOf(operator) > -1)
          throw new ValueError(t('addSubErr',
            `Can't $1 a $2 with a $3`,
            operator, rsideVlu.type, this.type));

        if (['integer','float','fraction'].indexOf(rsideVlu.type) > -1) {
           clone.coeficient = clone.coeficient[operator](rsideVlu);
        } else if (rsideVlu.type === 'variable'){
          if (rsideVlu.letter !== this.letter)
            throw new ValueError(t('diffNameErr',
              `Can't $1 variable value with different name in Variable context.`,
               t(operator)),
            rsideVlu);
          if (this.exponent.value() !== rsideVlu.exponent.value() &&
              this.coeficient.value() !== rsideVlu.coeficient.value())
            throw new ValueError(t('diffExpErr',
              `Can't $1 variables with different exponents directly, must be factorized first.`,
              t(operator)));
          const toOper = operator === 'mul' ? 'add' : 'sub';
          clone.exponent = clone.exponent[toOper](rsideVlu.exponent);
        }
        if (cb) this._cbChangesBinary(cb, operator, clone, rsideVlu);
        return clone;
      }
    };
  }

  // these are for integer and float, other types should implement their own
  add(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value + rsideVlu._value, 'add', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  sub(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value - rsideVlu._value, 'sub', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  mul(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value * rsideVlu._value, 'mul', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  div(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>this._value / rsideVlu._value, 'div', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  exp(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>Math.pow(this._value, rsideVlu._value), 'exp', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rsideVlu));
  }
  root(cb) {
    const operTbl = this._operTbl(
      ()=>Math.root(this._value), 'root', cb);
    return ValueBase.create(operTbl[rsideVlu.type]());
  }
  nthRoot(rsideVlu, cb) {
    const operTbl = this._operTbl(
      ()=>Math.pow(rside._value, (1 / this._value)), 'nthRoot', cb);
    return ValueBase.create(operTbl[rsideVlu.type](rootBase));
  }
}

/**
 * A Integer class, hold only whole numbers
 */
export class Integer extends ValueBase {
  /**
   * Construct a new Integer
   * @param {number|Integer|SyntaxTreeNode} value the integer value to store
   */
  constructor(value) {
    if (value instanceof SyntaxTreeNode) {
      value = parseInt(value.tokString());
    } else if (value instanceof Integer) {
      value = value._value;
    }
    super(parseInt(value), 'integer');
  }
}

/**
 * A class to store floating point numbers
 * @prop {string} whole The string of the whole number (integer) part
 * @prop {string} point The point used to create this float instance
 * @prop {string} dec The decimal point part, used to create this instance
 */
export class Float extends ValueBase {
  /**
   * Construct a new floating point number
   * @param {number|Float|SyntaxTreeNode} value The floating point number to store
   */
  constructor(value) {
    let whole, dec, point;
    if (value instanceof SyntaxTreeNode) {
      whole = value.children[0].tokString();
      point = value.children[1].tokString();
      dec   = value.children[2].tokString();
    } else if (value instanceof Float) {
      whole = value.whole;
      point = value.point;
      dec   = value.dec;
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

/**
 * A class used to represent fractions, ie ½
 * @prop {Integer|Variable} numerator The numerator part of a fraction
 * @prop {Integer|Variable} denominator The denominator part of a fraction
 */
export class Fraction extends ValueBase {
  /**
   *
   * @param {number|Integer|SyntaxTreeNode} numerator The numerator part of the fraction
   * @param {number|Integer} denominator The denominator part of the fraction
   */
  constructor(numerator, denominator) {
    if (numerator instanceof SyntaxTreeNode) {
      denominator = ValueBase.create(numerator.children[4].tokString());
      numerator = ValueBase.create(numerator.children[2].tokString());
    } else if (numerator instanceof Fraction) {
      denominator = numerator.denominator.clone();
      numerator = numerator.numerator.clone();
    } else {
      denominator = ValueBase.create(denominator);
      numerator = ValueBase.create(numerator);
    }

    super(null, 'fraction');

    this.numerator = numerator;
    this.denominator = denominator;
    this._value = this;
  }

  /**
   * Extend fraction to newDenominator
   * @param {number|Integer|Variable} newDenominator
   * @throws {ValueError} If newDenominator is not applicable
   */
  expandTo(newDenominator) {
    const t = getTr(this);
    if (!(newDenominator instanceof ValueBase))
      newDenominator = ValueBase.create(newDenominator);

    const clone = this.clone();

    if (newDenominator.type === 'integer') {
      if (clone.denominator.type === 'integer') {
        const factor = ValueBase.create(
          newDenominator._value / clone.denominator._value);
        clone.numerator = clone.numerator.mul(factor);
        clone.denominator = clone.denominator.mul(factor);
      } else {
        throw new ValueError(t('varMulDenErr',
          "Can't multiply a fraction which has a variable in the denominator"),
          newDenominator);

      }
    } else if (newDenominator.type === 'variable') {
      if (clone.denominator.type === 'integer') {
        const newDenom = newDenominator.clone();
        newDenom.coeficient.mul(clone.denominator);
        clone.denominator = newDenom;
      } else {
        clone.denominator.mul(newDenominator);
      }
    } else {
      throw new ValueError(t('invExpInput',
        "Invalid input to fraction expansion"), newDenominator)
    }
    return clone;
  }

  shrinkBy(factor) {
    const t = getTr(this);
    if (factor instanceof Integer)
      factor = factor._value;

    const denominator = this.denominator.type === 'integer' ?
      this.denominator : this.denominator.coeficient();
    const numererator = this.numerator.type === 'integer' ?
      this.numerator : this.numerator.coeficient();
    denominator._value /= factor;
    numererator._value /= factor;
    const denom = denominator.value(),
          numer = numererator.value();
    if (denom !== Math.round(denom))
      throw new ValueError(t('Shrink factor to big'),
        ValueBase.create(factor));
    if (numer !== Math.round(numer))
      throw new ValueError(t('Shrink factor to big'),
        ValueBase.create(factor));
  }

  toString() {
    return `frac{${this.numerator.value()}/${this.denominator.value()}}`;
  }

  toNumber() {
    return this.numerator.value() / this.denominator.value();
  }

  _operTbl(operCb, operator, cb) {
    const t = getTr(this);
    return {
      integer: (rsideVlu)=>{
        const rFrac = new Fraction(rsideVlu._value, 1);
        if (cb)
          cb(t('convToFrac','Convert to fraction'), operator,
            [rFrac], [rsideVlu]);
        return this[operator](rFrac);
      },
      float: ()=>{
        throw new ValueError(t('fltVluErr',
          `Can't $1 a float to $2`, t(operator), t(this.type)));
      },
      frac: (rsideVlu)=>{
        const res = operCb(rsideVlu);
        if (cb)
          this._cbChangesBinary(cb, operator, res, rsideVlu);
        return res;
      },
      variable: (rsideVlu)=>{
        if (rsideVlu !== 'mul')
          throw new ValueError(t('varVluErr',
            `Can't $1 a variable to a $2`,
            t(operator), t(this.type)));
        const rFrac = new Fraction(rsideVlu, 1);
        if (cb)
          cb(t('convToFrac', 'Convert to fraction'), operator,
             [rFrac], [rsideVlu])
        return this.mul(rFrac);
      }
    };
  }

  add(rsideVlu, cb) {
    if (rsideVlu.type !== this.type)
      return super.add(rsideVlu);
    const fractions = Fraction.shinkTogether([this, rsideVlu], cb);
    fractions[0].numerator = fractions[0].numerator
      .add(fractions[1].numerator);
    if (cb)
      this._cbChangesBinary(cb, 'add', fractions[0], rsideVlu);
    return fractions[0];
  }

  sub(rsideVlu, cb) {
    if (rsideVlu.type !== this.type)
      return super.sub(rsideVlu);
    const fractions = Fraction.shinkTogether([this, rsideVlu]);
    fractions[0].numerator = fractions[0].numerator
      .sub(fractions[1].numerator);
    if (cb)
      this._cbChangesBinary(cb, 'sub', fractions[0], rsideVlu);
    return fractions[0];
  }

  mul(rsideVlu, cb) {
    if (rsideVlu.type !== this.type)
      return super.mul(rsideVlu);
    const res = this.clone();
    res.numerator = res.numerator.mul(rsideVlu.numerator);
    res.denominator = res.denominator.mul(rsideVlu.denominator);
    if (cb)
      this._cbChangesBinary(cb, 'mul', res, rsideVlu);
    return res;
  }

  div(rsideVlu, cb) {
    if (rsideVlu.type !== this.type)
      return super.div(rsideVlu);
    const res = this.clone();
    // reverse denom and numerator
    const rside = rsideVlu.swapNumAndDenom(cb, 'div');
    res.numerator = res.numerator.mul(rside.numerator);
    res.denominator = res.denominator.mul(rside.denominator);
    if (cb)
      this._cbChangesBinary(cb, 'mul', res, rsideVlu);
    return res;
  }

  exp(rsideVlu, cb) {
    if (rsideVlu.type !== this.type)
      return super.exp(rsideVlu);
    const res = this.clone();
    res.numerator._value =
      Math.pow(this.numerator._value, rsideVlu.numerator._value);
    res.denominator._value =
      Math.pow(res.denominator._value, rsideVlu.denominator._value);

    if (cb)
      this._cbChangesBinary(cb, 'exp', res, rsideVlu);
    return res;
  }

  root(cb) {
    const t = getTr(this);
    if (this.type==='variable')
      throw new ValueError(t('sqRtErr',
        "Can't take square root of a fraction with variables"));
    const res = this.clone();
    res.numerator._value = Math.sqrt(res.numerator._value);
    res.denominator._value = Math.sqrt(res.denominator._value);
    if (cb)
      cb(getTr(this)('root','√$1', this), 'root', [res],[this]);
    return res;
  }

  nthRoot(rootBase, cb) {
    const t = getTr(this);
    if (rootBase.type !== this.type)
      return super.nthRoot(rootBase);
    if (this.type==='variable')
      throw new ValueError(t('nthRtErr',
        "Can't take nthRoot root of a fraction with variables"));
    const res = this.clone();
    res.numerator._value = Math.pow(
      res.numerator._value, (1 / rootBase.numerator._value));
    res.denominator._value = Math.pow(
      res.denominator._value, (1 / rootBase.denominator._value));
    if (cb)
      cb(getTr(this)('root','$1√$2', rsideVlu, this),
         'root', [res],[this]);
    return res;
  }

  swapNumAndDenom(cb, oper) {
    const clone = this.clone();
    const num = clone.numerator;
    clone.numerator = clone.denominator;
    clone.denominator = num;
    if (cb)
      cb(getTr(this)('swapNumDenom', "Swap numerator and denominator"),
         oper,[clone], [this]);
    return clone;
  }

  /**
   * Shrinks this fraction as much as possible or toCommonDenom
   * @param {number} [toCommonDenom=1] Limit shink to this denominator, when shrinking fractions togehter
   * @returns {Fraction} The new fraction that has been shrinked
   */
  shrinkTo(toCommonDenom = 1) {
    let shouldContinue;
    const shrinked = this.clone();

    const testModulo = (vlu, prime) =>{
      if (vlu.type === 'variable')
        return (vlu.coeficient % prime) === 0;
      return (vlu._value % prime) === 0;
    }

    do {
      shouldContinue = false;
      for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
        if (testModulo(shrinked.denominator, prime) &&
            testModulo(shrinked.numerator, prime))
        {
          const denomVlu = shrinked.denominator.type === 'variable' ?
            shrinked.denominator.coeficient :
            shrinked.denominator._value;

          if (denomVlu <= toCommonDenom) {
            shouldContinue = false;
          } else {
            shouldContinue = true;
            shrinked.shrinkBy(prime);
          }
        }
      }
    } while(shouldContinue);

    return shrinked;
  }

  /**
   * Finds out the least common denominator of the fracions provided
   * @param {Array.<Fraction>} fractions Look in these fraction
   * @returns {number|NaN} The least common denominator integer value or NaN of none could be found
   */
  static leastCommonDenominator(fractions) {
    let resDenom;
    const checkBounds = (fracs) =>{
      const o = {big:0, small:fracs[0].denominator._value};
      resDenom = fracs.reduce((o, vlu)=>{
        const denom  = vlu.denominator._value
        if (o.big < denom) o.big = denom;
        if (o.small > denom) o.small = denom;
        return o;
      }, o);
    }
    let usePrime = 0;
    checkBounds(fractions);

    if (resDenom.big === resDenom.small) {
      if (fractions.length === 1)
        return fractions[0].shrinkTo(1).denominator.value();
      return resDenom.big;
    }

    const vluUnShrunk = resDenom;
    const fracs = fractions.map(f=>f.clone());

    const primeTest = (fracs) => {
      do {
        for(const prime of [7,5,3,2]) {// test modulo of prime 2, 3, 5, 7
          usePrime = prime;
          for (const fr of fracs) {
            if ((fr.denominator.value() % prime) !== 0 ||
                (fr.numerator.value() % prime) !== 0 ||
                fr.numerator.value() < prime ||
                fr.denominator.value() < prime)
            {
              usePrime = 0;
              break;
            }
          }

          if (usePrime) {
            // if we get here all fractions passed this prime test
            fracs.forEach(f=>f.shrinkBy(usePrime));
            checkBounds(fracs);
            break; // restart prime
          }
        }
      } while(usePrime);
    }
    primeTest(fracs);

    if (resDenom.big < vluUnShrunk.big)
      return resDenom.big;

    // must expand
    const denomFactor = fractions.reduce(
      (vlu, f)=>f.denominator._value*vlu,1);
      resDenom.big = denomFactor;

    primeTest(fractions.map(f=>f.expandTo(denomFactor)));

    if (resDenom.big <= denomFactor)
      return resDenom.big;
    return denomFactor;
  }

  /**
   * Shrinks fractions together, matching the least common denominator
   * @param {Array.<Fraction>} fractions The fractions shrink (copy is shurnk)
   * @returns {Array.<Fraction>} A array of shrunken fractions
   */
  static shinkTogether(fractions) {
    const leastCommon = Fraction.leastCommonDenominator(fractions);
    const res = fractions.map(f=>
      f.denominator.value() > leastCommon ?
        f.shrinkTo(leastCommon) :f.expandTo(leastCommon)
    );
    return res;
  }
}
