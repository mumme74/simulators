import { allHeadlessFiles } from "./testAll.mjs";
import { JSDOM } from "jsdom";
const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<body>
  <h3>Testing</h3>
  <svg width="1000" height="200"></svg>
  <div id="testResult"></div>
</body>
</html>`, {url: "https://localhost:8000/lib/test/",});
globalThis.document = dom.window.document;
globalThis.window = dom.window;
globalThis.location = dom.window.location;

import "./testlogic/testmainscript.js";
console.log("*** running in headless mode, excluding grapical tests ***");


async function run() {
  try {
    await globalThis.runTestsInNode(allHeadlessFiles,[],[
      //"test AST node action",
      //"test_Lexer",
      //"Test Grammar CST parser",
      //"test Grammar AST parser",
      //"test Parser, CST generation",
      //"test Parser, AST generation",
      //"test supersimple lang running code",
      //"test Simplelang with bare parser",
      //"test Simplelang VM",
      //"test simpleLang VM regression test",
      //"test Math expression parser basic",
      //"stress Math expression parser",
      //"test Math expression engine",
      //"test Math engine solveNextStep Constants",
      //"test Math engine solveNextStep Fractions",
      //"test Math engine algebraic add/subtract",
    ]);
  } catch (e) {
    console.error(e);
  }
}
run();
