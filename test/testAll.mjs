"use strict";

export const allFiles = [
  "helpers/test_helpers_index.mjs",
  "test_length.mjs",
  "test_point.mjs",
  "test_rotation.mjs",
  "test_base.mjs",
  "test_schematic.mjs",
  "trigenometry/test_trigenometry_index.mjs",
  "diagrams/test_diagrams_index.mjs",
  "electrical/test_electric_schematic.mjs",
];

/*
const hashStr = location.hash.replace(/^#/, "").trim();
const filterIn = hashStr.length ? hashStr.split(",") : [...allFiles];
const testToRun = allFiles.filter(t=>filterIn.indexOf(t) > -1);
const filterFiles = hashStr.length ? hashStr.split(',') : undefined;


document.addEventListener("DOMContentLoaded", async ()=>{
  setTestResultToHtml(document.getElementById("testResult"));
  await globalThis.loadAndRun({allFiles, pathPrefix:'../', filterFiles});
});
*/