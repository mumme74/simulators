// lib/index.js
{ // namespace block

const color = {
  bgRed: ["red", "white"], bgGreen: ["green", "white"],
  red: "red", green: "green"
}

const insertToggleBtn = function(node, passed) {
  const chkbox = document.createElement("input");
  chkbox.type = "checkbox";
  chkbox.checked = !passed;
  chkbox.addEventListener("click", (evt)=>{
    evt.target.parentNode.classList[evt.target.checked ? "remove" : "add"]("hidden");
  });
  node.appendChild(chkbox);
  node.className += passed ? "passed hidden" : "failed";
}

const log = function({txt = "", bgColor, color, parentNode = testResultNode}) {
  let cssProps = [];
  if (color) cssProps.push(`color:${color}`);
  if (bgColor) {
    cssProps.push(`background:${bgColor[0]}`);
    if (!color) cssProps.push(`color:${bgColor[1]}`);
  }

  if (cssProps.length)
    console.log(`%c${txt}`, cssProps.join(';  '));
  else
    console.log(txt);

  if (testResultNode) {
    const div = document.createElement("div");
    div.innerHTML = txt.replace(/\n/g, "<br/>") || "&nbsp;";
    cssProps.push("border: 1px solid #AAA;border-radius:0.2em;padding:0.3em;");
    div.style = cssProps.join(";");
    parentNode.appendChild(div);
    return div;
  }
  return undefined;
}

let testResultNode = null,
    suites = [],
    beforeAllTests = [],
    afterAllTests = [],
    currSuite = {};

class Suite {
  _beforeAlls = [];
  _afterAlls = [];
  _beforeEachs = [];
  _afterEachs = [];
  _stats = [];
  failedTests = 0;
  passedTests = 0;
  totalTests = 0;
  suiteName = "";
  descr = {
    all: [],
    currDesc: null, //{ name, its: [], currIt: null };
  }

  constructor(suiteName, fn) {
    this.suiteName = suiteName;
    this.suiteFn = fn;
  }

  runSuite() {
    currSuite = this;

    this.suiteFn.apply(this);

    currSuite = null;
  }

  beforeEach(fn) {
    this._beforeEachs.push(fn);
  }

  afterEach(fn) {
    this._afterEachs.push(fn);
  }

  beforeAll(fn) {
    this._beforeAlls.push(fn);
  }

  afterAll(fn) {
    this._afterAlls.push(fn);
  }

  describe(desc, fn) {
    for (const beforeAlls of this._beforeAlls)
      beforeAll.apply(this);

    const descrObj = {
      name: desc, its: [], currIt: null
    }
    this.descr.all.push(descrObj);
    this.descr.currDesc = descrObj;

    fn.apply(this);

    for (const afterAll of this._afterAlls)
      afterAll.apply(this);

    this._stats.push(this.descr.currDesc);
  }

  it(desc, fn) {
    ++this.totalTests;
    for (const beforeEach of this._beforeEachs)
      beforeEach.apply(this)

    const itObj = {name: desc, expects: []};
    this.descr.currDesc.its.push(itObj);
    this.descr.currDesc.currIt = itObj;

    fn.apply(this);

    for (const afterEach of this._afterEachs)
      afterEach.apply(this);
  }

  expect(value) {
    const self = this;
    const result = (fnName, expected) => {
      return {
        pass: ()=>{
          self.descr.currDesc.currIt.expects.push({
            name: `expect ${value} ${fnName} ${expected}`, status: true});
          self.passedTests++
        },

        fail: function(exp, vlu){
          if (arguments.length) {
            expected = exp; value = vlu;
          }
          try { throw new Error("find linenr"); } catch(err) {
            const stack = err.stack.split('\n');
            let folders = location.pathname.split('/');
            const fileFolders = stack[3].split('/').slice(folders.length);
            const match = fileFolders.join("/").match(/^(.*):(\d+):(\d+)\)?$/);

            self.descr.currDesc.currIt.expects.push({
              name: `expect ${value} ${fnName} ${expected}`,
              status: false, file: match[1], line: match[2], col: match[3]})
            self.failedTests++
          }
        }
      }
    }

    return {
      // Match or Asserts that expected and actual objects are same.
      toBe: function(expected, precision) {
        const res = result("===", expected);
        if (value === expected)
          return res.pass();
        if (precision !== undefined && !isNaN(value) &&
            Math.round(value*10*precision) == expected*10*precision)
          return res.pass();
        res.fail();
      },

      toNotBe: function(expected) {
        const res = result("!==", expected);
        if (value !== expected) res.pass();
        else res.fail();
      },

      toBeObj: function(expected, precision) {
        const res = result("===", expected);
        if (Array.isArray(expected)) {
          if (!Array.isArray(value)) return res.fail();
          for(let i = 0; i < expected.length; ++i) {
            if (value[i] !== expected[i]) {
              if (precision !== undefined && !isNaN(value[i]) &&
                  Math.round(value[i]*10*precision) === expected[i]*10*precision)
                  return res.pass();
              return res.fail();
            }
          }
          res.pass();
        } else if (expected !== null && typeof expected === 'object') {
          if (typeof value!=='object' || value === null || Array.isArray(value))
            return res.fail();
          for(const [key, vlu] of Object.entries(expected)) {
            if (key in value && value[key] !== vlu){
              if (precision !== undefined && !isNaN(value[key]) &&
                  Math.round(value[key]*10*precision) === vlu*10*precision)
                  return res.pass();
              return res.fail(vlu, value[key]);
            }
          }
          res.pass();
        }
      },

      // Match the expected and actual result of the test.
      toEqual: function(expected, precision) {
        const res = result("==", expected);
        if (value == expected)
          return res.pass();
        if (precision !== undefined && !isNaN(value) &&
            Math.round(value*10*precision) == expected*10*precision)
          return res.pass();
        res.fail();
      },

      toNotEqual: function(expected) {
        const res = result("!=", expected);
        if (value != expected) res.pass();
        else res.fail();
      },

      toEqualObj: function(expected, precision) {
        const res = result("==", expected);
        if (Array.isArray(expected)) {
          if (!Array.isArray(value)) return res.fail();
          for(let i = 0; i < expected.length; ++i) {
            if (value[i] != expected[i])
              if (precision !== undefined && !isNaN(value[i]) &&
                Math.round(value[i]*10*precision) == expected[i]*10*precision)
              return res.pass();
            return res.fail();
          }
          res.pass();
        } else if (expected !== null && typeof expected === 'object') {
          if (typeof value !=='object' || value === null || Array.isArray(value))
            return res.fail();
          for(const [key, value] of Object.entries(expected)) {
            if (key in value && value[key] != value)
              if (precision !== undefined && !isNaN(value[key]) &&
                 Math.round(value[key]*10*precision) == vlu*10*precision)
                return res.pass();
             return res.fail(vlu, value[key]);
          }
          res.pass();
        }
        res.fail();
      },

      toGt: function(expected) {
        const res = result(">", expected);
        if (value > expected) res.pass();
        else res.fail();
      },

      toLt: function(expected) {
        const res = result("<", expected);
        if (value < expected) res.pass();
        else res.fail();
      },

      toEqualOrGt: function(expected) {
        const res = result(">=", expected);
        if (value >= expected) res.pass();
        else res.fail();
      },

      toEqualOrLt: function(expected) {
        const res = result("<=", expected);
        if (value <= expected) res.pass();
        else res.fail();
      },

      toContain: function(expected) {
        const res = result("contain", expected);
        let matched = 0;
        const matchArr = (exp)=>{
          const idx = value.indexOf(exp);
          if (idx !== null && idx > -1)
            ++matched;
        }
        if (Array.isArray(value) || typeof value === 'string') {
          if (Array.isArray(expected)) {
            for(const exp of expected)
              matchArr(exp);
          } else
            matchArr(expected);
        } else if (typeof value === 'object' && value !== undefined) {
          if (Array.isArray(expected)) {
            for(const exp of expected)
              if (exp in value) ++matched;
          } else if (expected in value)
            ++matched;
        }
        if (Array.isArray(expected)) {
          if (matched === expected.length)
            return res.pass()
        } else if (matched === 1)
          return res.pass();
        res.fail();
      },

      toThrow: function() {
        const res = result("toThrow", "");
        if (value instanceof Function) {
          try {
            value();
          } catch (e) {
            return res.pass();
          }
          return res.fail(value, "Did not throw");
        }
        res.fail(value, "Not a function");
      }
    }
  }

  displayResult() {
        const parentNode = log({txt: `Test ${this.suiteName}`, bgColor:this.failedTests ? color.bgRed : color.bgGreen});
        if (parentNode) insertToggleBtn(parentNode, !this.failedTests);
        log({txt:`Suite ${this.suiteName} runned ${this.totalTests} tests\n` +
             `${this.passedTests} passed, ${this.failedTests} failed, of ${this.totalTests} total groups`,
            parentNode});
        for(const stat of this._stats) {
            const groupNode = log({txt:stat.name, parentNode})
            for(const it of stat.its) {
                const itNode = log({txt:`   ${it.name}`, parentNode: groupNode})
                for (const expect of it.expects) {
                    const col = expect.status ? color.green : color.red;
                    const txt = `${expect.name} ${!expect.status ? 'file:' + expect.file + ' line:' + expect.line + ' col:' + expect.col: ''}`
                    log({txt: `     ${expect.status === true ? '√' : 'X' } ${txt}`, color:col, parentNode: itNode});
                }
            }
        }
  }
}

globalThis.registerTestSuite = (suiteName, fn)=> {
  const suite = new Suite(suiteName, fn)
  suites.push(suite);
  currSuite = suite;
  return suite;
}

globalThis.runTestSuite = (suiteName)=>{
  const suite = suites.find(s=>s.suiteName===suiteName);
  if (suite) {
    for(const beforeAllTest of beforeAllTests)
      beforeAllTest.apply(this);

    suite.runSuite();

    for(const afterAllTest of afterAllTests)
      afterallTest.apply(this);
  }
}

globalThis.runAllTestSuites = ()=>{
  for(const beforeAllTest of beforeAllTests)
    beforeAllTest.apply(this);

  for(const suite of suites)
    suite.runSuite.apply(suite);

  for(const afterAllTest of afterAllTests)
    afterAllTest.apply(this);
}

globalThis.describe = (desc, fn)=>{
  currSuite.describe.call(currSuite, desc, fn);
}
globalThis.it = (desc, fn)=>{
  currSuite.it.call(currSuite, desc, fn);
}
globalThis.expect = (value)=>{
  return currSuite.expect.call(currSuite, value);
}
globalThis.afterEach = (fn)=>{
  currSuite.afterEach.call(currSuite, fn);
};
globalThis.beforeEach = (fn)=>{
  currSuite.beforeEach.call(currSuite, fn);
}
globalThis.beforeAll = (fn)=>{
  currSuite.beforeAll.call(currSuite, fn);
}
globalThis.afterAll = (fn)=>{
  currSuite.afterAll.call(currSuite, fn);
}
globalThis.setTestResultToHtml = (parentNode) => {
  testResultNode = parentNode;
}
globalThis.showTestsResults = ()=>{
  let passedTests = 0, failedTests = 0, totalTests = 0;
  for(const suite of suites) {
    passedTests += suite.passedTests;
    failedTests += suite.failedTests;
    totalTests += suite.totalTests;
  }

  log({txt:`Total Tests: ${totalTests}
Test Suites: passed, failed, total
Tests: ${passedTests} passed, ${failedTests} failed, ${totalTests} total
`});

  for(const suite of suites)
    suite.displayResult.apply(suite);
}

} // namespace scope