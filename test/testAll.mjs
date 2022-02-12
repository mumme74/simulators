"use strict";

export const allTests = [
  "testPoint",
  //"testShape", "testPolygon",
  "testTriangle",
  //"testSquare"
];

const hashStr = location.hash.replace(/^#/, "").trim();
const filterOut = hashStr.length ? hashStr.split(",") : [];

const testToRun = allTests.filter(t=>filterOut.indexOf(t)===-1);
document.addEventListener("DOMContentLoaded", async ()=>{
  setTestResultToHtml(document.getElementById("testResult"));
  for(const t of testToRun) {
    await import(`./${t}.mjs`);
    console.log("running test", t);
    runTestSuite(t);
  };
  showTestsResults();
});
