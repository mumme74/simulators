"use strict";

export const allTests = [
  "testLength",
  "testPoint",
  "testBase",
  "testTriangle",
  "testSquare",
  "testCircle"
];

const hashStr = location.hash.replace(/^#/, "").trim();
const filterIn = hashStr.length ? hashStr.split(",") : [...allTests];
const testToRun = allTests.filter(t=>filterIn.indexOf(t) > -1);

document.addEventListener("DOMContentLoaded", async ()=>{
  setTestResultToHtml(document.getElementById("testResult"));
  for(const t of testToRun) {
    await import(`./${t}.mjs`);
    console.log("running test", t);
  };
  runAllTestSuites();
  showTestsResults();
});
