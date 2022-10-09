"use strict";

import { loadCss} from './_wgthelper.mjs';

class _Modal {
  constructor() {
    const modal = this.node = document.createElement("div");
    modal.classList.add("modal");
    const box = document.createElement("div");
    box.classList.add("modal-content");
    modal.append(box);
    modal.addEventListener("click", (evt)=>{
      if (evt.target === modal) this.hide();
    });

    const closeCross = document.createElement("span");
    closeCross.classList.add("modal-close");
    closeCross.innerHTML = "&times;"
    this.content = document.createElement("div");
    box.append(closeCross, this.content);
    closeCross.addEventListener("click", ()=>{this.hide();});

    document.body.appendChild(modal);

    loadCss('/lib/widgets/modal.css');
  }

  show() {
    this.node.classList.add("modal-show");
  }

  hide() {
    this.node.classList.remove("modal-show");
  }

  isShown() {
    return this.node.classList.contains("modal-show");
  }

  toggle() {
    if (this.isShown()) this.hide();
    else this.show();
  }

  setContent(content) {
    this.content.innerHTML = "";
    if (content instanceof NodeList)
      this.content.append(...content);
    else
      this.content.append(content);
  }
}

const ModalSingleton = new _Modal();

export class Dialog {
  constructor() { }

  async showOkCancel(content) {
    const okBtn = document.createElement("button"),
          cancelBtn = document.createElement("button");
    okBtn.innerText = "OK";
    cancelBtn.innerText = "Avbryt";
    const form = content.querySelector("form") ?
      content.querySelector("form") :
        content.tagName === 'FORM' ? content : null;

    if (form) form.append(okBtn, cancelBtn);
    else content.append(okBtn, cancelBtn);

    ModalSingleton.setContent(content);
    return new Promise((resolve, reject)=>{
      okBtn.addEventListener("click", ()=>{
        ModalSingleton.hide();
        resolve();
      });
      cancelBtn.addEventListener("click", ()=>{
        ModalSingleton.hide();
        reject();
      });
      ModalSingleton.show();
    });
  }
}

export default ModalSingleton;
