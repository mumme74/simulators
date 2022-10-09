"use strict";

const cssPaths = [];

export function loadCss(absCssPath) {
  if (cssPaths.indexOf(absCssPath) > -1)
    return;

  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = absCssPath;
  document.head.appendChild(link);
  cssPaths.push(absCssPath);
}
