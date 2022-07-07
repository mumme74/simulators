/* eslint-disable */
"use strict";

class AstNode {
  constructor(parent, item){
    this._parent = parent;
    this._left = null;
    this._right = null;
    this.item = item;
  }
}

export class Ident {
  constructor(id, value = null, solveThis = false) {
    this.id = id;
    this.value = value;
    this.solveThis  = solveThis;
  }
  ml(showId) {
    return this.value === null || showId || this.solveThis ? `<mi>${this.id}</mi>` : `<mn>${this.value.value}</mn>`;
  }
}

export class Const {
  constructor(value=0) {
    this.value = value;
  }
  ml() {
    return `<mn>${this.value}</mn>`;
  }
}

export class Operator {
  constructor(type) {
    this.id = type;
  }
  ml() {
    return `<mo>${this.id}</mo>`
  }
}

export class Equal extends Operator {
  constructor() { super('='); }
}

export class Div extends Operator {
  constructor() { super('/'); }
  opposite() { return new Mul(); }
}

export class Mul extends Operator {
  constructor() { super('x'); }
  opposite() { return new Div(); }
}

export class Add extends Operator {
  constructor() { super('+'); }
  opposite() { return new Sub(); }
}

export class Sub extends Operator {
  constructor() { super('-'); }
  opposite() { return new Add(); }
}

export class Row {
  constructor(items=[]) {
    this._items = [...items];
  }
  ml() {
    return `<mrow>${this._items.map(i=>i.ml()).join(' ')}</mrow>`
  }
}

export class Paren {
  constructor(items=[]) {
    this._items = [...items];
  }
  ml() {
    return `<mrow><mo>(</mo> ${this._items.map(i=>i.ml()).join(' ')} <mo>)</mo></mrow>`
  }
}

export class Fraction {
  constructor(nom, denom) {
    this.nom = nom;
    this.denom = denom;
  }
  ml() {
    return `<mfrac>${this.nom.ml()} ${this.denom.ml()}</mfrac>`
  }
}

export class ParseEquation {
  constructor(formula, identifiers) {
    this.tokens = formula.replace(/\s{2,}/, " ").split(' ');
    this.formula = formula;
    this.identifiers = identifiers;
    this.parenCnt = 0;
    if (this.tokens)
      this._parse();
  }

  _parse() {
    this.root = new AstNode(null, this.tokens[0]);
    this._parseNext(1, this.root, 0); // lex and parse to tree
    // balance tree by finding =
    let n = this.root;

    for(; n._left; n = n._left)
      if (n.item instanceof Equal) {
        const oldRoot = this.root;
        this.root = n;
        const oldRight = n._right,
              oldParent = n._parent;
        n._parent = null;
        n._right = oldRoot;
        oldRoot._parent = n;

        return;
      }
  }

/* Parses into a CST
      -2a + b = (3 - d) / 2 * 3
          =
       /      \
      +        *
     / \      / \
    *   b   '/'   3
   / \      / \
  -   a   ()   2
 /        /
2        -
        / \
       3   d
     */
  _parseNext(tokIdx, parent, groupConsume) {
    if (this.tokens.length >= tokIdx) return;
    const tok = this.tokens[tokIdx];
    let item, cst, consumed;
    switch (tok) {
    case '-': item = new Sub(); break;
    case '+': item = new Add(); break;
    case 'x': case '*': item = new Mul(); break;
    case '/': item = new Div(); break;
    case '=': item = new Equal(); break;
    case '(': this.parenCnt++;
      cst = new AstNode(parent, null);
      consumed = this._parseNext(tokIdx + 1, cst, tokIdx +1);
      if (consumed > 0) {
        item = new Paren([ast._left, ast._right]);
        cst.item = item;
        tokIdx += consumed;
      }
      break;
    case ')': this.parenCnt--;
      return tokIdx - groupConsume;
    default:
      if (isNaN(tok)) {
        const vluCb = tok in this.identifiers ? this.identifiers[tok] : ()=>{return '?';}
        item = new Ident(tok, this.identifiers[tok])
      } else {
        item = new Const(tok);
      }
    }

    if (!ast)
      cst = new AstNode(parent, item);

    if (parent._left) parent._right = ast;
    else parent._left = cst;

    this._parseNext(tokIdx +1, cst);
  }
}

export class MathSolver {
  constructor({parentElement, identifiers, formula}) {
    this.formula = formula;
    this.outNode = parentElement
    this.outNode.innerHTML = "";
    this.identifiers = identifiers;
    this.rows = [];

    this._parse(formula);

    // print formula
    let row = this._newRow();
    row.innerHTML = `<mrow>${formula.map(itm=>itm.ml(true)).join(' ')}</mrow>`;
    this.outNode.appendChild(row);

    this.recalulate('I');
  }

  recalulate(solveForThis) {
    while(this.outNode.childNodes.length > 2)
      this.outNode.removeChild(this.outNode.lastChild);

    this.rows = [];

    // first fill in values
    const mlItems = []; let equalPrinted = false;
    for (const itm of this.formula) {
      if (itm instanceof Ident) {
        if (itm.id === solveForThis)
          itm.solveThis = true;
        mlItems.push(itm.ml());
      } else if (itm instanceof Oper) {
        if (itm.id === '=') equalPrinted = true;
        mlItems.push(itm.ml());
      }
    }
    let row = this._newRow();
    row.innerHTML = `<mrow>${mlItems.join(' ')}</mrow>`;

    /*
    switch (unknown) {
    case 'U': this._recalulateUnkown_U(); break;
    case 'R': this._recalulateUnkown_R(); break;
    case 'I': default:
      this._recalulateUnkown_I(); break;
    }*/

    for(const row of this.rows)
      this.outNode.appendChild(row);
  }


  _solveRecursively(itm) {}

  _recalulateUnkown_I() {
    const U = this.potential.value,
          R = this.resistance.value;
    let row = this._newRow();
    row.innerHTML = `<mrow>
      <mn>${U}</mn> <mo>=</mo> <mi>I</mi> <mo>×</mo> <mn>${R}</mn>
      </mrow>
    `;

    row = this._newRow();
    row.innerHTML = `<mrow>
      <mfrac><mn>${U}</mn> <mn>${R}</mn></mfrac>
        <mo>=</mo> <mfrac><mrow><mi>I</mi> <mo>×</mo> <mn>${R}</mn></mrow> <mn>${R}</mn></mfrac>
      </mrow>
      `
    row = this._newRow();
    row.innerHTML = `<mrow>
      <mfrac><mn>${U}</mn> <mn>${R}</mn></mfrac>
        <mo>=</mo> <mrow><mi>I</mi>
      </mrow>
    `;

    row = this._newRow();
    row.innerHTML = `<mrow>
      <mi>I</mi><mo>=</mo><mn>${U/R}</mn>
    </mrow>`
  }

  _newRow() {
    const mathRow = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
    this.rows.push(mathRow);
    return this.rows[this.rows.length-1];
  }
}