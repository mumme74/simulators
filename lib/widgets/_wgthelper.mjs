"use strict";

const rootFolder = location.hostname == 'mumme.se' ? "/simulators" : "";

const cssPaths = [];

export function loadCss(absCssPath) {
  if (cssPaths.indexOf(absCssPath) > -1)
    return;

  while(absCssPath[0] === '/')
    absCssPath = absCssPath.substr(1);
  absCssPath = `${rootFolder}/${absCssPath}`;

  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = absCssPath;
  document.head.appendChild(link);
  cssPaths.push(absCssPath);
}
