// lib/index.js
{ // namespace block

const color = {
  bgRed: ["red", "white"], bgGreen: ["green", "white"],
  red: "red", green: "green"
}

const insertToggleBtn = function(node, passed) {
  if (!testResultNode) return;

  const chkbox = document.createElement("input");
  chkbox.type = "checkbox";
  chkbox.checked = !passed;
  chkbox.addEventListener("click", (evt)=>{
    evt.target.parentNode.classList[evt.target.checked ? "remove" : "add"]("hidden");
  });
  node.appendChild(chkbox);

  let classes = passed ? ["passed","hidden"] : ["failed"];
  classes.forEach(c=>node.classList.add(c));
}

const insertTestLink = function(node, parts, linkText) {
  if (!testResultNode) return console.log(linkText);

  node.appendChild(document.createTextNode(" "));
  const a = document.createElement('a');
  a.href = '#';
  let hash = parts.files ? parts.files.map(f=>`file=${f}`).join('&') : '';
  if (parts.suites)
    hash += "&" + (parts.suites ? parts.suites.map(s=>`suite=${s}`).join('&') : '');
  a.textContent = linkText;
  a.addEventListener('click', (evt)=>{
    location.hash = hash;
    location.reload();
  });
  node.appendChild(a);
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
    currSuite = {},
    currentTestFile = '';

class ExpectChecks {
  constructor(suite, value) {
    this.value = value;
    this.suite = suite;
    [globalThis.DOMRectList,
     globalThis.DOMTokenList,
     globalThis.DOMStringList].find(t=>{
      if (t && value instanceof t)
        this.value = [...value];
    })
  }

  result(fnName, expected){
    const self = this;
    return {
      pass: ()=>{
        const vluIsStr = (self.value instanceof String) || typeof self.value === 'string',
              expIsStr = (self.value instanceof String) || typeof self.value === 'string';
        const vlu = vluIsStr ? `'${self.value}'` : self.value,
              exp = expIsStr ? `'${expected}'` : expected;
        self.suite.descr.currDesc.currIt.expects.push({
          name: `expect ${vlu} ${fnName} ${exp}`, status: true});
        self.suite.passedTests++
      },

      fail: function(exp, vlu){
        if (arguments.length) expected = exp;
        if (arguments.length > 1) self.value = vlu;

        const vluIsStr = (self.value instanceof String) || typeof self.value === 'string',
              expIsStr = (self.value instanceof String) || typeof self.value === 'string';
        vlu = vluIsStr ? `'${self.value}'` : self.value,
        exp = expIsStr ? `'${expected}'` : expected;
        try { throw new Error("find linenr"); } catch(err) {
          const stack = err.stack.split('\n');
          let folders = location.pathname.split('/');
          const fileFolders = stack[3].split('/').slice(folders.length);
          const match = fileFolders.join("/").match(/^(.*):(\d+):(\d+)\)?$/);

          self.suite.descr.currDesc.currIt.expects.push({
            name: `expect ${vlu} ${fnName} ${exp}`,
            status: false, file: match[1], line: match[2], col: match[3]})
          self.suite.failedTests++
        }
      }
    }
  }

  // Match or Asserts that expected and actual objects are same.
  toBe(expected, precision) {
    const res = this.result("===", expected);
    if (this.value === expected)
      return res.pass();
    if (precision !== undefined && !isNaN(this.value) &&
        Math.round(this.value*(precision+1)) == Math.round(expected*(precision+1)))
      return res.pass();
    res.fail();
  }

  toNotBe(expected) {
    const res = this.result("!==", expected);
    if (this.value !== expected) res.pass();
    else res.fail();
  }

  toBeObj(expected, precision) {
    const res = this.result("===", expected);
    if (Array.isArray(expected)) {
      if (!Array.isArray(this.value)) return res.fail();
      for(let i = 0; i < expected.length; ++i) {
        if (this.value[i] !== expected[i]) {
          if (precision !== undefined && !isNaN(this.value[i]) &&
              Math.round(this.value[i]*(precision+1)) === Math.round(expected[i]*(precision+1)));
          else
            return res.fail();
        }
      }
      res.pass();
    } else if (expected !== null && typeof expected === 'object') {
      if (typeof this.value!=='object' || this.value === null || Array.isArray(this.value))
        return res.fail();
      for(const [key, vlu] of Object.entries(expected)) {
        if (key in this.value && this.value[key] !== vlu){
          if (precision !== undefined && !isNaN(this.value[key]) &&
              Math.round(this.value[key]*(precision+1)) === Math.round(vlu*(precision+1)));
          else
            return res.fail(vlu, this.value[key]);
        }
      }
      res.pass();
    }
  }

  toBeEmpty() {
    const res = this.result("===", "empty");
    if (Array.isArray(this.value)) {
      if (this.value.length === 0)
        return res.pass();
      return res.fail("[]", this.value);
    } else if (this.value !== undefined && typeof this.value === 'object') {
      if (Object.keys(this.value).length === 0)
        return res.pass();
      return res.fail("[]", this.value);
    }
    res.fail("empty", this.value);
  }

  // Match the expected and actual result of the test.
  toEqual(expected, precision) {
    const res = this.result("==", expected);
    if (this.value == expected)
      return res.pass();
    if (precision !== undefined && !isNaN(this.value) &&
        Math.round(this.value*(precision+1)) == Math.round(expected*(precision+1)))
      return res.pass();
    res.fail();
  }

  toNotEqual(expected) {
    const res = this.result("!=", expected);
    if (this.value != expected) res.pass();
    else res.fail();
  }

  toEqualObj(expected, precision) {
    const res = this.result("==", expected);
    if (Array.isArray(expected)) {
      if (!Array.isArray(this.value)) return res.fail();
      for(let i = 0; i < expected.length; ++i) {
        if (this.value[i] != expected[i])
          if (precision !== undefined && !isNaN(this.value[i]) &&
            Math.round(this.value[i]*(precision+1)) == Math.round(expected[i]*(precision+1)));
          else
            return res.fail();
      }
      res.pass();
    } else if (expected !== null && typeof expected === 'object') {
      if (typeof this.value !=='object' || this.value === null || Array.isArray(this.value))
        return res.fail();
      for(const [key, vlu] of Object.entries(expected)) {
        if (key in this.value && this.value[key] != vlu)
          if (precision !== undefined && !isNaN(value[key]) &&
             Math.round(this.value[key]*(precision+1)) == Math.round(vlu*(precision+1)));
          else
            return res.fail(vlu, this.value[key]);
      }
      res.pass();
    }
    res.fail();
  }

  toGt(expected) {
    const res = this.result(">", expected);
    if (this.value > expected) res.pass();
    else res.fail();
  }

  toLt(expected) {
    const res = this.result("<", expected);
    if (this.value < expected) res.pass();
    else res.fail();
  }

  toEqualOrGt(expected) {
    const res = this.result(">=", expected);
    if (this.value >= expected) res.pass();
    else res.fail();
  }

  toEqualOrLt(expected) {
    const res = this.result("<=", expected);
    if (this.value <= expected) res.pass();
    else res.fail();
  }

  toContain(expected) {
    const res = this.result("contain", expected);
    let matched = 0;
    const matchArr = (exp)=>{
      const idx = this.value.indexOf(exp);
      if (idx !== null && idx > -1)
        ++matched;
    }
    if (Array.isArray(this.value) || typeof this.value === 'string') {
      if (Array.isArray(expected)) {
        for(const exp of expected)
          matchArr(exp);
      } else
        matchArr(expected);
    } else if (typeof this.value === 'object' && this.value !== undefined) {
      if (Array.isArray(expected)) {
        for(const exp of expected)
          if (exp in this.value) ++matched;
      } else if (expected in this.value)
        ++matched;
    }
    if (Array.isArray(expected)) {
      if (matched === expected.length)
        return res.pass()
    } else if (matched === 1)
      return res.pass();
    res.fail();
  }

  toThrow(errType) {
    const res = this.result("toThrow", "");
    if (this.value instanceof Function) {
      try {
        this.value();
      } catch (e) {
        if (errType)
          return e.constructor === errType ?
            res.pass() : res.fail(errType.name || errType);
        return res.pass();
      }
      let msg = "Did not throw";
      if (errType) msg += ", expected: " + errType.name || ""
      return res.fail(msg, this.value);
    }
    res.fail(this.value, "Not a function");
  }

  toNotThrow(){
    const res = this.result("toNotThrow", "");
    if (this.value instanceof Function) {
      try {
        this.value();
      } catch (e) {
        return res.fail(this.value, "Did throw");
      }
      return res.pass();
    }
    res.fail(this.value, "Not a function");
  }

  toBeInstanceOf (expected){
    const expName = expected.toString().replace(/\{*\s*\n.*/g, "");
    const res = this.result("toBeInstanceOf", expName);
    if (this.value instanceof expected)
      return res.pass();
    res.fail();
  }

  toNotBeInstanceOf(expected) {
    const expName = expected.toString().replace(/\{*\s*\n.*/g, "");
    const res = this.result("toBeInstanceOf", expName);
    if (this.value instanceof expected)
      return res.pass();
    res.fail();
  }
}


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
  fileName = '';
  descr = {
    all: [],
    currDesc: null, //{ name, its: [], currIt: null };
  }

  constructor(suiteName, fn, fileName) {
    this.suiteName = suiteName;
    this.suiteFn = fn;
    this.fileName = fileName;
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
    return new ExpectChecks(this, value);
  }

  displayResult() {
        const parentNode = log({txt: `Test ${this.suiteName}`, bgColor:this.failedTests ? color.bgRed : color.bgGreen});
        if (parentNode) {
          insertToggleBtn(parentNode, !this.failedTests);
          if (this.fileName)
            insertTestLink(parentNode, {files:[this.fileName]}, this.fileName);
        }
        log({txt:`Suite ${this.suiteName} runned ${this.totalTests} tests\n` +
             `${this.passedTests} passed, ${this.failedTests} failed, of ${this.totalTests} total groups`,
            parentNode});
        for(const stat of this._stats) {
            const groupNode = log({txt:stat.name, parentNode});
            if (this.fileName)
              insertTestLink(groupNode, {files:[this.fileName],suites:[this.suiteName]}, this.suiteName);
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

globalThis.registerTestSuite = (suiteName, fn, file)=> {
  const suite = new Suite(suiteName, fn, file || currentTestFile)
  suites.push(suite);
  currSuite = suite;
  return suite;
}

globalThis.runTestSuite = (suiteName)=>{
  const suite = suites.find(s=>s.suiteName===suiteName);
  if (suite) {
    for(const beforeAllTest of beforeAllTests)
      beforeAllTest.apply(this);

    suite.runSuite.apply(suite);

    for(const afterAllTest of afterAllTests)
      afterAllTest.apply(this);
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
globalThis.setTestResultToHtml = (resultDomNode) => {
  testResultNode = resultDomNode;
}
globalThis.runTestsInBrowser = (resultDomNode, allFiles) => {
  testResultNode = resultDomNode;

  const hashStr = location.hash.replace(/^#/, "").trim();
  const filterInParts = hashStr.length
          ? hashStr.split("&").map(f=>decodeURI(f))
          : [...allFiles];
  const filterInFiles = filterInParts
        .filter(part=>part.substring(0,5)==='file=')
        .map(f=>decodeURI(f.substring(5)));
  const filterInSuites = filterInParts
        .filter(part=>part.substring(0,6)==='suite=')
        .map(s=>decodeURI(s.substring(6)));

  //const testToRun = allFiles.filter(t=>filterIn.indexOf(t) > -1);
  //const filterFiles = hashStr.length ? hashStr.split(',') : undefined;

  document.addEventListener("DOMContentLoaded", async ()=>{
    setTestResultToHtml(resultDomNode);
    await globalThis.loadAndRun({allFiles, pathPrefix:'../', filterInFiles, filterInSuites});
  });
}
globalThis.runTestsInNode = async (allFiles, filterInFiles=[],filterInSuites=[])=>{
  await globalThis.loadAndRun({allFiles, pathPrefix:'../',filterInFiles, filterInSuites});
}
globalThis.setCurrentTestFile = (file)=>{
  currentTestFile = file;
}
/**
 * Imports allFiles into context
 * @param {Array.<string>} allFiles All test files
 * @param {Array.<string>} [filterInFiles] if set filters out all other files
 */
globalThis.loadAndRun = async ({allFiles, pathPrefix='../', filterInFiles, filterInSuites}) => {
  const filterIn = filterInFiles?.length ? filterInFiles : [...allFiles];
  const testToRun = allFiles.filter(t=>filterIn.indexOf(t) > -1);
  for(const file of testToRun) {
    console.log("fetching test file", file);
    setCurrentTestFile(file);
    await import(`./${pathPrefix}${file}`);
  };
  setCurrentTestFile('');

  const suitesToRun = filterInSuites?.length
            ? suites.filter(s=>filterInSuites.indexOf(s.suiteName)>-1)
            : suites;
  for (const suite of suitesToRun) {
    for(const beforeAllTest of beforeAllTests)
      beforeAllTest.apply(this);

    suite.runSuite.apply(suite);

    for(const afterAllTest of afterAllTests)
      afterAllTest.apply(this);
  }

  showTestsResults(suitesToRun);
}

globalThis.showTestsResults = (forTheseSuites)=>{
  forTheseSuites = forTheseSuites || suites;

  let passedTests = 0, failedTests = 0, totalTests = 0;
  for(const suite of forTheseSuites) {
    passedTests += suite.passedTests;
    failedTests += suite.failedTests;
    totalTests += suite.totalTests;
  }

  if (testResultNode)
    insertTestLink(testResultNode, {}, "alla tester");

  // for the test integration
  if (location.hash.indexOf('result_to_console_as_json=true')) {
    console.log("TESTRESULT_JSON:" + JSON.stringify({
      totalTests, failedTests, passedTests
    }));
  }

  const printTotal = () =>{
    log({txt:`--------------------------------------------
Total test describes: ${totalTests}`});
    log({txt:`Tests: ${passedTests} passed, ${failedTests} failed`,
     color: failedTests !== 0 ? color.red : color.green, testResultNode});
    log({txt:'--------------------------------------------'});
  }

  if (totalTests > 100)
    printTotal();

  for(const suite of forTheseSuites)
    suite.displayResult.apply(suite);

  printTotal();
}

} // namespace scope