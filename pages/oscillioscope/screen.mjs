"use strict"

import { Choices } from "./menus.mjs";

/**
 * ScreenBadgeBase class
 * @readonly {SVGGElement} node The g node container for this badge
 * @readonly {SVGRectElement} rect The rect node works as outer bounds for badge
 * @readonly {ScreenBase} The owner screen instance
 */
export class ScreenBadgeBase {
  /**
   * The constructor for ScreenBadgeBase
   * @param {ScreenBase} screen The owner screen instance
   * @param {SVGElement} content The content to add
   * @param {[string] | string} className Add these classnames to g node to style correctly
   * @param {object} attr Add these attributes to g node
   */
  constructor(screen, content, className, attr) {
    this.screen = screen;
    this.node = screen.createElement("g", attr);
    const clsArray = Array.isArray(className) ? className : [className];
    for (const cls of ["badge", ...clsArray])
      this.node.classList.add(cls);
    screen.mode.manager.oscInstance.screen.append(this.node);
    this.rect = screen.createElement("rect");
    this.node.append(this.rect);
    if (content) {
      this.content = content;
      this.node.append(this.content);
      this.layout();
    }
  }

  /**
   * Layout based of rendered widths
   */
  layout() {
    const box = this.content.getBoundingClientRect();
    this.rect.width.baseVal.value = box.width + 10;
    this.rect.height.baseVal.value = box.height + 10;
  }

  destroy() {
    this.node.remove();
  }
}

/**
 * A badge to show text on screen
 */
export class ScreenBadgeText extends ScreenBadgeBase {
  /**
   * Constructor for ScreenBadgeText
   * @param {ScreenBase} screen The screen instance
   * @param {string} text The text to show
   * @param {[string] | string} [className] Add these classnames to g node
   * @param {object} attr Add these as attributes to g node
   */
  constructor(screen, text, className = "", attr = {}) {
    const txt = screen.createElement("text");
    txt.append(text);
    super(screen, txt, className, attr);
    const box = this.rect.getBoundingClientRect();
    txt.setAttribute("transform", `translate(${box.width/2},${box.height/2})`)
  }

  setText(text) {
    while (this.content.lastChild)
      this.content.removeChild(this.content.lastChild);
    this.content.append(text);
  }
}

/**
 * A custom badge with label, values and unit seeparated.
 * Easier to update
 * @readonly {string | number} value The currently rendered value
 * @readonly {string} unit The currently rendered unit
 */
export class ScreenBadgeValue extends ScreenBadgeText {
  static _buildStr(label, vlu, uint) {
    return `${label} ${vlu}${uint}`;
  }
  /**
   * Constructor for ScreenBadgeValue
   * @param {ScreenBase} screen The owner Screen instance
   * @param {string} label The text to label with
   * @param {string|number} value The value rendered
   * @param {string} unit The unit rendered
   * @param {[string]|string} [className] Add this className to g node to style correctly
   * @param {object} [attr] Add these as attributes to g node
   */
  constructor(screen, label, value, unit, className, attr) {
    const str = ScreenBadgeValue._buildStr(label, value, unit);
    super(screen, str, className, attr);
    this.value = value;
    this.unit = unit;
    this.label = label;
  }

  /**
   * Set value
   * @param {string|number} value The new value
   */
  setValue(value) {
    this.value = value;
    this.setText(ScreenBadgeValue._buildStr(this.label, this.value, this.unit));
  }

  /**
   * Change the unit
   * @param {string} unit Change to display this unit
   */
  setUnit(unit) {
    this.unit = unit;
    this.setText(ScreenBadgeValue._buildStr(this.label, this.value, this.unit));
  }
}

/**
 * Class for the Function buttons
 */
export class ScreenFuncBtn extends ScreenBadgeBase {
  static rowSpacing = 18;
  static minHeight = 45;

  /**
   * Constructor for Function buttons
   * @param {ScreenBase} screen The owner screen instance
   * @param {Choices} choices The choices for this button
   * @param {number} idx The button nr, may be 0-3 with 0 being the first button
   * @param {boolean} horizontal True if we want to render horizontally
   */
  constructor(screen, label, choices, idx, horizontal = false) {
    const itemLen = label ? choices.choices.length +1 :
      choices.choices.length;
    const width = screen.width / 4 - 2,
          height = Math.max(ScreenFuncBtn.minHeight,
              18 * (horizontal ? (label ? 2 : 1) : itemLen)+4),
          xPos = screen.width / 4 * idx;
    const g = screen.createElement("g"),// {transform:`translate(${width / 2})`}),
          items = [];

    g.classList.add("badge");
    g.classList.add("funcBtn");
    const itemWidth = horizontal ? (width-8) / choices.choices.length : width / 2;

    let i = 0;
    const arr = label ? [label, ...choices.choices] : [...choices.choices],
          selectedIdx = label ? choices.selectedIdx +1 : choices.selectedIdx;
    for (const value of arr) {
      const yOffset = horizontal ? 15 : ScreenFuncBtn.rowSpacing*i+4,
            xOffset = horizontal ? itemWidth * i +2:
              (itemWidth-arr[i].length)/2;
      const attr = {transform:`translate(${xOffset},${yOffset})`};
      const items = [
        screen.createElement("rect", attr),
        screen.createElement("text", attr)];
      items.forEach(n=>n.classList.add("funcBtnItem"));
      if (i === selectedIdx)
        items.forEach(n=>n.classList.add("selected"));
      items[1].append(value);
      items.forEach(n=>g.append(n));
      i++;
    }

    super(screen, g, "funcBtn", {transform:`translate(${xPos}, ${screen.height-45})`});

    this.label = label;
    this.choices = choices;
    this.rect.width.baseVal.value = width;
    this.rect.height.baseVal.value = height;
    this.collapsed = false;
    this.horizontal = horizontal;
    this.group = g;

    // render width of all items
    const rects = g.querySelectorAll("rect"),
          texts = g.querySelectorAll("text");
    rects.forEach((n, i)=>{
      const box = texts[i].getBoundingClientRect();
      n.width.baseVal.value = box.width;
      n.height.baseVal.value = box.height;
      if (!horizontal) {
        const e = width / 2 - box.width / 2;
        n.transform.baseVal[0].matrix.e = e;
        texts[i].transform.baseVal[0].matrix.e = e;
      }
    });

    this.collapse();
  }

  collapse() {
    if (this.horizontal)
      return this._changeSelectedHorizontal();
    this.collapsed = true;

    const items = this.group.querySelectorAll("*"),
          offsetIdx = this.label ? 1 : 0,
          selectedIdx = this.choices.selectedIdx,
          selIdx = selectedIdx > -1 ? selectedIdx + offsetIdx : offsetIdx;
    items.forEach((n, i)=>{
      const idx = Math.floor(i / 2);
      let fn = "remove";
      if (idx === 0 && this.label)
        n.transform.baseVal[0].matrix.f = 2;
      else if (idx === selIdx) {
        n.transform.baseVal[0].matrix.f =
          ScreenFuncBtn.rowSpacing * offsetIdx +2;
        if (selectedIdx === idx - offsetIdx)
          fn = "add";
      } else {
        n.style.display = "none";
      }

      n.classList[fn]("selected");
    });

    this.height = ScreenFuncBtn.minHeight;
    this.node.transform.baseVal[0].matrix.f = this.screen.height - this.height
    this.rect.height.baseVal.value = this.height;
  }

  expand() {
    if (this.horizontal)
      return this._changeSelectedHorizontal();
    this.collapsed = false;

    const items = this.group.querySelectorAll("*"),
          selectedIdx = this.choices.selectedIdx + (this.label ? 1: 0);
    items.forEach((n, i)=>{
      const idx = Math.floor(i / 2);
      n.transform.baseVal[0].matrix.f = ScreenFuncBtn.rowSpacing * idx +2;
      const fn = (idx === selectedIdx) ? "add" : "remove";
      n.classList[fn]("selected");
      n.style.display = "";
    });

    this.height = Math.max(
      ScreenFuncBtn.minHeight,  ScreenFuncBtn.rowSpacing *
       ((this.label ? 1:0) + this.choices.choices.length) +4);
    this.node.transform.baseVal[0].matrix.f = this.screen.height - this.height
    this.rect.height.baseVal.value = this.height;
  }

  click() {
    this.expand();
  }

  _changeSelectedHorizontal() {
    this.group.querySelectorAll("*").forEach((n,i)=>{
      const idx = Math.floor(i/2) + (this.label ? 1 : 0);
      const fn = (idx===this.choices.selectedIdx) ? "add" : "remove";
      n.classList[fn]("selected");
    });
  }
}

export class ScreenBase {
  constructor(mode) {
    this.mode = mode;
    const screen = this.mode.manager.oscInstance.screen;
    this.width = screen.firstElementChild.width.baseVal.value,
    this.height = screen.firstElementChild.height.baseVal.value;
  }

  redraw() {
    this.mode.clearScreen();
    const screen = this.mode.manager.oscInstance.screen;
    const width = this.width, height = this.height;
    this.bgScreen = this.createElement("rect", {x:0,y:0,width, height});
    this.bgScreen.classList.add("bgScreen");
    screen.append(this.bgScreen);

    this.width = width;
    this.height = height;

    const bat = [
      this.createElement("rect", {x:width-35,y:10,width:25,height:10}),
      this.createElement("rect",{x:width-10,y:12,width:3,height:5}),
      this.createElement("path", {d:`M${width-25} 15 l2 -10 0 9 4 0 -2 10 0-9z`})
    ];
    bat.forEach(n=>{
      n.classList.add("battery");
      screen.append(n);
    });
  }

  createElement(name, attr = {}) {
    const elem = document.createElementNS(
      "http://www.w3.org/2000/svg", name);
    for (const [key, vlu] of Object.entries(attr))
      elem.setAttribute(key, vlu);
    return elem;
  }
}

