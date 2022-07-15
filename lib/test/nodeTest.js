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
    await globalThis.runTestsInNode(allHeadlessFiles,[
      // filterin files here
    ],[
      // filter in suites here
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
      //"test Math engine solveNextStep Constants integers",
      //"test Math engine solveNextStep Constants floats",
      //"test Math engine solveNextStep Fractions",
      //"test Math engine algebraic add/subtract",
      //"test Math engine algebraic mul/div",
    ], [
      // filterin describes here
      //"Should add 1a+2a",
      //"Should test polynomial expr -b+2a+3ab-4a-2ab+3b",
      //"Should test binomial expr 2a+3ab-4a-2ab",
      //"Should multiply 2ab*2a",
    ]);
  } catch (e) {
    console.error(e);
  }
}
run();
