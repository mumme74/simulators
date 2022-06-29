"use strict";

import {serv, dirname} from "../../devServer.js";
import fs from 'fs';
import puppeteer from "puppeteer";


var resultDir = dirname + '/results';

if (!fs.existsSync(resultDir))
    fs.mkdirSync(resultDir);


const regex = /^(%c)(.*?)\s(color|background):\s*(\w+)\s*;*\s*(?:(color|background):\s*(\w+)\s*)?$/;
const col = {
  reset: "\x1b[0m",
  color: { green: "\x1b[32m", red: "\x1b[31m", white: "\x1b[37m" },
  background: { green: "\x1b[42m", red: "\x1b[41m", white: "\x1b[47m" }
}

let result;

function logRecieved(msg) {
  const txt = msg.text();
  if (!result && txt.substr(0, 16) === 'TESTRESULT_JSON:') {
    result = JSON.parse(txt.substr(16));
    console.log(result);
    return;
  }

  const res = regex.exec(txt);
  if (res && res[6] !== undefined) {
    console.log(col[res[5]][res[6]], col[res[3]][res[4]], res[2]);
  } else if (res && res[4] !== undefined) {
    console.log(col[res[3]][res[4]], res[2]);
  } else
    console.log(col.reset, col.reset, txt);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({width:1024,height:860});
  page.on('console', logRecieved);//(msg) => console.log('PAGE LOG:', msg.text()));

  await page.evaluate(() => console.log(`url is ${location.href}`));
  console.log(`http://localhost:${serv.port}/lib/test/`);
  await page.goto(`http://localhost:${serv.port}/lib/test/`);
  await page.waitForNavigation({
    timeout: 10000, waitUntil:"networkidle0"
  });
  await page.screenshot({ path: resultDir + '/testresult.png' });

  try {
    fs.writeFileSync(resultDir + "/testresults.json", JSON.stringify(result||""))
  } catch(err) {
    console.log(err);
  }

  await browser.close();
  serv.close();

  if (!result || result.failedTests !== 0)
    process.exitCode =  result?.failedTests || 1;
})();
