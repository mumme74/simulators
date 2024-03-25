"use strict"

import {ModeBase, MenuBase, KeyInputManager} from './keyinputs.mjs';
import {Choices} from './menus.mjs';
import {ScreenBase, ScreenBadgeText, ScreenBadgeValue, ScreenBadgeBase} from './screen.mjs';
import { SignalGenerator } from './signalgenerator.mjs';

// this file handles all Multimeter measuring
// when we are in multimeter mode

class MultimeterInputBase {
  constructor(mode) {
    this.mode = mode;
  }

  start() {
    this.tmr = setInterval(this.acquire.bind(this), 200);
  }

  stop() {
    clearInterval(this.tmr);
  }

  acquire() {
    const data = this.mode.manager.oscInstance.signalGenerator.
      multimeter.acquire(400);
    this.inspectData(data);
  }

  inspectData(data) {}
}

class MultimeterInputVolt extends MultimeterInputBase {
  constructor(mode) {
    super(mode);
  }

  inspectData(data) {
    const AC = this.mode.acMode;
    let min = 0.0, max = 0.0, mean100 = 0, mean1000 = 0, mean = 0;
    for (let i = 0; i < data.length; ++i) {
      // take average in two steps so we don't get to big a number
      if ((i % 100) === 0) {
         mean1000 += (mean100 / 100);
         mean100 = 0;
      }
      if ((i % 1000) === 0) {
        mean += (mean1000 / 1000);
        mean1000 = 0;
      }

      const vlu = AC ? Math.max(0, data[i]) : data[i];
      mean100 += vlu;

      min = Math.min(vlu, min);
      max = Math.max(vlu, max);
    }

    mean /= (data.length / 1000);
    this.value = mean;
    this.min = min;
    this.max = max;

    const limit = this.mode.limit();

    if (this.mode.autoRange) {
      if (mean > 0 && (mean > limit) || (mean < 0 && mean < -limit)) {
        this.mode.rangeChoices.increment();
        this.mode.screen.updateHeader();
      } else {
        const idx = this.mode.rangeChoices.selectedIdx -1;
        const lower = this.mode.rangeChoices.choices[idx >= 0 ? idx :0];
        if ((mean < 0 && mean > -lower) || (mean > 0 && mean < lower)) {
          this.mode.rangeChoices.decrement();
          this.mode.screen.updateHeader();
        }
      }
    }

    this.mode.screen.display.update();
  }
}


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
    const vlu = this.screen.mode.input?.value;
    const int = Math.round(vlu),
          fraction = vlu - int,
          fracStr = (""+fraction).substring((""+fraction).indexOf(".")),
          limit = this.screen.mode.limit();
    let vluStr = ""+vlu;
    if ((vlu> 0 && vlu > limit) || (vlu < 0 && vlu < -limit))
      vluStr = "OL";
    else if (vluStr.length < 5)
      vluStr = vlu.toFixed(Math.max(0,4-vluStr.length));
    else if (fracStr.length > 4)
      vluStr = `${int}.${fracStr.substring(2,4)}`;
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
    this.updateHeader();
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

  updateHeader() {
    this.rangeIndicator.setText(
      this.mode.autoRange ? "Auto" : "Normal");
    this.measurementRange.setUnit(this.mode.unit());
    this.measurementRange.setValue(this.mode.range());
    this.measurementType.setText(this.mode.measurementType());
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
    this.input = new MultimeterInputVolt(this);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
    this.manager.activateMenu("MultimeterMenu");
    this.input.start();
  }

  cleanup() {
    this.input.stop();
    super.cleanup();
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

  limit() {
    return this.rangeChoices.value();
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateHeader();
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

  limit() {
    return this.rangeChoices.value();
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateHeader();
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

  limit() {
    return this.rangeChoices.value();
  }

  on_measureRangeBtn(e) {
    this.autoRange = this.rangeChoices.increment(true);
    if (this.unitChoices.value() !== this.unit())
      this.unitChoices.select(this.unit());
    this.screen.updateHeader();
  }
}
KeyInputManager.register(ModeOhm);