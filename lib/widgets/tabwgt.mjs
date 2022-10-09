"use strict";

import { loadCss } from "./_wgthelper.mjs";

loadCss('/lib/widgets/tabwgt.css');

// --------------------------------------------------------------

export class TabWgt {
  constructor(node) {
    this.rootNode = node;
    this.buttons = node.querySelectorAll(":scope > button");
    this.tabs = node.querySelectorAll(":scope > div");
    if (this.buttons.length !== this.tabs.length)
      console.error("Tabs and tab buttons mismatched");

    const activeCls = "tabwgt-activeTab";

    this.buttons.forEach((btn, i)=>{
      btn.addEventListener("click", ()=>{
        this.rootNode.querySelector(`.${activeCls}`)?.
          classList.remove(activeCls);
        this.rootNode.querySelector(`.${activeCls}`)?.
          classList.remove(activeCls);
        this.tabs[i].classList.add(activeCls);
        btn.classList.add(activeCls);
      });
    });

    // allow to select tab in html code
    this.tabs.forEach((t, i)=>{
      if (t.classList.contains(activeCls)) {
        this.rootNode.querySelector(`button.${activeCls}`)?.
          classList.remove(activeCls);
        this.buttons[i].classList.add(activeCls);
      }
    });

    // when we have selected button but not tab in html,
    // or not selected any, ie select the first one as default
    if (!this.rootNode.querySelector(`div.${activeCls}`)) {
      let tabIdx = -1;
      this.buttons.forEach((btn, i)=>{
        if (btn.classList.contains(activeCls)) {
          this.tabs[i].classList.add(activeCls);
          tabIdx = i;
        }
      });

      if (tabIdx < 0) {
        this.buttons[0].classList.add(activeCls);
        this.tabs[0].classList.add(activeCls);
      }
    }
  }
}
