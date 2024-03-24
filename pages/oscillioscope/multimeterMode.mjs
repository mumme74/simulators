"use strict"

import {ModeBase, MenuBase, KeyInputManager} from './keyinputs.mjs';
import {Choices} from './menus.mjs';
import {ScreenBase, ScreenBadgeText, ScreenBadgeValue, ScreenBadgeBase} from './screen.mjs';

// this file handles all Multimeter measuring
// when we are in multimeter mode


class MultimeterDisplay {
  constructor(screen) {
    this.screen = screen;
    this.valueNode = screen.createElement("text",
      {transform:"translate(380,180)"});
    this.valueNode.classList.add("multimeterValue");
    this.unitNode = screen.createElement("text",
      {transform:"translate(380,240)"});
    this.unitNode.classList.add("multimeterUnit");
    this.holdNode = screen.createElement("text",
      {transform:"translate(380,90)"});
    this.holdNode.classList.add("multimeterHold");
    this.holdNode.style.display = "none";
    this.holdNode.innerHTML = "Hold"
    screen.mode.manager.oscInstance.screen.append(
      this.valueNode, this.unitNode, this.holdNode);
    this.update();
  }

  update() {
    this.unitNode.innerHTML = this.screen.mode.unit();
    const vlu = this.screen.mode.value();
    let vluStr = ""+vlu;
    if (vluStr.length < 6)
      vluStr = vlu.toFixed(Math.max(0,6-vluStr.length));
    this.valueNode.innerHTML = vluStr;
    const hold = this.screen.mode.manager.currentMenu?.hold;
    this.holdNode.style.display = hold ? "" : "none";
  }
}


/**
 * The screen class for all multimeter related modes
 */
export class MultimeterScreenBase extends ScreenBase {
  constructor(mode) {
    super(mode);
  }

  redraw() {
    super.redraw();
    this.drawHeader();
    this.drawScreen();
    this.updateRange();
  }

  drawHeader() {
    // header
    this.rangeIndicator = new ScreenBadgeText(
      this, "Normal", "rangeIndicator",
      {transform:"translate(100,0)"});
    this.measurementRange = new ScreenBadgeValue(
      this, "Range", 2000, "mV", "rangeValue",
      {transform:"translate(210,0)"});
    this.measurementType = new ScreenBadgeText(this,
      this.mode.measurementType(), null,
      {transform:"translate(0,0)"});
  }

  drawScreen() {
    // display screen
    const rect = this.createElement("rect",
      {x:0,y: 30,width:this.width,height:this.height-30});
    rect.classList.add("multimeterResultBg");
    this.mode.manager.oscInstance.screen.append(rect);

    this.display = new MultimeterDisplay(this);
  }

  updateRange() {
    this.rangeIndicator.setText(
      this.mode.autoRange ? "Auto" : "Normal");
    this.measurementRange.setUnit(this.mode.unit());
    this.measurementRange.setValue(this.mode.range());
    this.display.update()
  }

  update() {
    this.display.update();
  }
}

/**
 * The volt measuring mode class
 */
export class ModeVolt extends ModeBase {
  constructor(manager) {
    super(manager, []);
    this.rangeChoices = new Choices([0.2,2,20,200,1000], 0);
    this.autoRange = true;

    // updated by menu
    this.typeChoices = new Choices(["DC", "AC"], 0);
    this.unitChoices = new Choices(["V", "mV"], 1);
    // the screen to draw on
    this.screen = new MultimeterScreenBase(this);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
    this.manager.activateMenu("MultimeterMenu");
  }

  measurementType() {
    return this.acMode ? "⏦ AC V" : "⎓ DC V";
  }

  range() {
    const r = this.rangeChoices.value();
    if (r<=2)
      return r * 1000; // mV
    return r;
  }

  unit() {
    return this.rangeChoices.value() > 2 ? "V" : "mV";
  }

  value() {
    return 1000;
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateRange();
  }
}
KeyInputManager.register(ModeVolt);

/**
 * The Amp measuring mode class
 */
export class ModeAmp extends ModeBase {
  constructor(manager) {
    super(manager, []);
    this.rangeChoices = new Choices([0.02,0.2,2,10], 0);
    this.autoRange = true;

    // updated by menu
    this.typeChoices = new Choices(["DC", "AC"], 0);
    this.unitChoices = new Choices(["A", "mA"], 1);
    // the screen to draw on
    this.screen = new MultimeterScreenBase(this);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
    this.manager.activateMenu("MultimeterMenu");
  }

  measurementType() {
    return this.acMode ? "⏦ AC A" : "⎓ DC A";
  }

  range() {
    const r = this.rangeChoices.value();
    if (r <= 2)
      return r* 1000; // mA
    return r;
  }

  unit() {
    return this.rangeChoices.value() >= 2 ? "A" : "mA";
  }

  value() {
    return 10.00;
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateRange();
  }
}
KeyInputManager.register(ModeAmp);

/**
 * The volt measuring mode class
 */
export class ModeOhm extends ModeBase {
  constructor(manager) {
    super(manager, []);
    this.rangeChoices = new Choices([200, 2000, 20000, 200000, 20000000], 0);
    this.autoRange = true;

    // updated by menu
    this.unitChoices = new Choices(["Ω", "kΩ", "MΩ"], 1);
    // the screen to draw on
    this.screen = new MultimeterScreenBase(this);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
    this.manager.activateMenu("MultimeterMenu");
  }

  measurementType() {
    return "Ω";
  }

  range() {
    const r = this.rangeChoices.value();
    if (r <= 200)
      return r; // raw ohms
    if (r > 200000)
      return r / 1000000; // Mega ohms
    return r / 1000;
  }

  unit() {
    const vlu = this.rangeChoices.value();
    return vlu < 2000 ? "Ω" : vlu > 200000 ? "MΩ" : "kΩ";
  }

  value() {
    return 10.00;
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateRange();
  }
}
KeyInputManager.register(ModeOhm);