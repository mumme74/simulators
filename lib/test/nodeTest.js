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
    await globalThis.runTestsInNode(allHeadlessFiles,[],["test Parser, grammar"]);
  } catch (e) {
    console.error(e);
  }
}
run();


