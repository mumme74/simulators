import {ModeBase, MenuBase, KeyInputManager} from './keyinputs.mjs';
import {Choices} from './menus.mjs';
import {
  ScreenBase, ScreenBadgeText, ScreenBadgeValue,
  ScreenBadgeBase, ScreenFuncBtn
} from './screen.mjs';
import { SignalGenerator, SignalInputBase } from './signalgenerator.mjs';

// this file handles all Oscillioscope measuring
// ie when we are in oscillioscope mode

class OscillioscopeInput extends SignalInputBase {
  constructor(mode, ch) {
    super(mode, ch, 50);
  }

  inspectData(data) {

  }
}

/**
 * handle time and Volt based trigger settings
 * Construct a pair of these to get x/y settings
 */
class OscillioscopeTriggerValue {
  /**
   * Constructor
   * @param {Choices} xDivChoices The time or volt based choice
   */
  constructor(xDivChoices) {
    this.value = 0.0;
    this.xDivChoices = xDivChoices;
  }

  reset() {
    this.value = 0.0;
  }

  dec() {
    this.value -= this.xDivChoices.value() / 10;
  }

  inc() {
    this.xOffset += this.xDivChoices.value() / 10;
  }
}

class OscillioscopeTriggerSetting {
  constructor(mode, tDivChoice, chNr) {
    this.mode = mode;
    this.time = new OscillioscopeTriggerValue(tDivChoice);
    this.coupling = new Choices(["⎓ DC","⏦ AC","⏚ GND"], 0);
    this.triggerOn = new Choices(["/ rising","\\ falling"],0);
    this.setChannel(chNr);
  }

  setChannel(chNr) {
    this.chNr = chNr;
    const vDivChoice = this.mode[`vDivCh${chNr}`];
    this.volt = new OscillioscopeTriggerValue(vDivChoice);
  }
}

class OscillioscopeDisplay {
  constructor(screen) {
    this.screen = screen;

  }

  update() {

  }
}

class OscillioscopeScreen extends ScreenBase {
  constructor(mode) {
    super(mode);
    this.display = new OscillioscopeDisplay(this);
    this.triggerStatusChoices = new Choices([
      "Auto","Trig","Ready","Scan","Stop"],0);

  }

  redraw() {
    super.redraw();
    this.drawHeader();
    this.drawFooter();
    this.drawScreen();
    this.updateHeader();
    this.updateFooter();
  }

  drawHeader() {
    const currentMenu = this.mode.manager.currentMenu;
    this.triggerStatus = new ScreenBadgeText(
      this, this.triggerStatusChoices.value(), "triggerStatus",
      {transform:"translate(3,3)"});
    const hold = currentMenu?.hold;
    this.runStop = new ScreenBadgeText(this, hold ? "⏸︎":"▶",
      ["runIndicator", hold ? "": "running"],
      {transform:"translate(50,3)"});

    this.timeBase = new ScreenBadgeValue(this,"M:",
      this.mode.tDiv(), this.mode.tDivUnit(), "timeBaseBadge",
      {transform:"translate(80,3)"});

    const trigSet = this.mode.triggerSetting;
    this.triggerTime = new ScreenBadgeValue(this, "T:",
      this.mode.trigTime(), this.mode.trigTimeUnit(), "triggerTimeBadge",
      {transform:"translate(300,3)"});
  }

  _buildTriggInfoStr() {
    const s = this.mode.triggerSetting;
    return `CH${
        s.chNr
      }:${
        s.coupling.value().substring(2)
      } ${
        s.triggerOn.value().substring(0,1)
      } ${
        this.mode.trigVolt()
      }${
        this.mode.trigVoltUnit()
      }`;
  }

  _buildChInfo(chNr) {
    return `${chNr}: ${
      this.mode[`vDivCh${chNr}`]()
    }${
      this.mode[`vDivCh${chNr}Unit`]()
    } ${
      chNr === this.mode.triggerSetting.chNr ? 'b' : ' '
    }${
      this.mode[`ch${chNr}CouplingChoices`].value()[0]
    }`
  }

  drawFooter() {
    const currentMenu = this.mode.manager.currentMenu;
    this.ch1Settings = new ScreenBadgeText(
      this, this._buildChInfo(1), "ch1infoBadge",
      {transform:"translate(0,292)"});

    this.ch2Settings = new ScreenBadgeText(
      this, this._buildChInfo(2), "ch2infoBadge",
      {transform:"translate(80,292)"});


    this.triggerSettings = new ScreenBadgeText(
      this, this._buildTriggInfoStr(), "triggerInfoBadge",
      {transform:"translate(280, 292)"});
  }

  drawScreen() {

  }

  updateHeader() {
    const currentMenu = this.mode.manager.currentMenu;
    this.triggerStatus.setText(this.triggerStatusChoices.value());

    const hold = currentMenu?.hold;
    this.runStop.setText(hold ? "⏸︎":"▶");
    this.runStop.node.classList[hold ? "remove":"add"]("running");

    this.timeBase.setValue(this.mode.tDiv());
    this.timeBase.setUnit(this.mode.tDivUnit());

    this.triggerTime.setValue(this.mode.trigTime());
    this.triggerTime.setUnit(this.mode.trigTimeUnit());

    this.display.update();
  }

  updateFooter() {
    this.triggerSettings.setText(this._buildTriggInfoStr());
    this.ch1Settings.setText(this._buildChInfo(1));
    this.ch2Settings.setText(this._buildChInfo(2));
  }

  update() {
    this.display.update();
  }
}

export class ModeOscillioscope extends ModeBase {
  constructor(manager) {
    super(manager, []);
    this.vDivCh1Choices = new Choices([
      0.01,0.02,0.05,0.1,0.5,1,2,5,10,20,50,100],6);
    this.vDivCh2Choices = new Choices([
      0.01,0.02,0.05,0.1,0.5,1,2,5,10,20,50,100],6);
    this.tDivChoices = new Choices([
      0.00000001,0.00000002,0.00000005,
      0.0000001, 0.0000002, 0.0000005,
      0.000001,  0.000002,  0.000005,
      0.00001,   0.00002,   0.00005,
      0.0001,    0.0002,    0.0005,
      0.001,     0.002,     0.005,
      0.01,      0.02,      0.05,
      0.1,       0.2,       0.5,
      1,         2,         10
    ], 2);
    this.ch1CouplingChoices = new Choices(["⎓ DC","⏦ AC","⏚ GND"],0);
    this.ch2CouplingChoices = new Choices(["⎓ DC","⏦ AC","⏚ GND"],0);

    this.screen = new OscillioscopeScreen(this);
    this.inputCh1 = new OscillioscopeInput(this, "ch1");
    this.inputCh2 = new OscillioscopeInput(this, "ch2");
    this.triggerSetting = new OscillioscopeTriggerSetting(this, this.tDivChoices, 1);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
    this.manager.activateMenu("OscillioscopeMenuRoot");
    this.inputCh1.start();
    this.inputCh2.start();
  }

  cleanup() {
    this.inputCh1.stop();
    this.inputCh2.stop();
    super.cleanup();
  }

  _vDiv(r) {
    return (r < 0.1) ? r * 1000 : r;
  }

  /**
   * The v/div setting for channel 1
   * @returns {number} the number value, changed to 100 for 100ms
   */
  vDivCh1() {
    return this._vDiv(this.vDivCh1Choices.value());
  }

  /**
   * The v/div setting for channel 2
   * @returns {number} the number value, changed to 100 for 100ms
   */
  vDivCh2() {
    return this._vDiv(this.vDivCh2Choices.value());
  }

  _vDivUnit(r) {
    return r < 0.1 ? "mV" : "V";
  }

  /**
   * Get the correct unit for v/div ch1
   * @returns {string} The correct unit for this setting
   */
  vDivCh1Unit() {
    return this._vDivUnit(this.vDivCh1Choices.value());
  }

  /**
   * Get the correct unit for v/div ch1
   * @returns {string} The correct unit for this setting
   */
  vDivCh2Unit() {
    return this._vDivUnit(this.vDivCh2Choices.value());
  }

  _tDiv(t) {
    if (t < 0.000001) return 1000000000 * t;
    if (t < 0.001) return 1000000 * t;
    if (t < 1) return 1000 * t;
    return t;
  }

  /**
   * The time setting
   * @returns {number} With the time as in 100ms
   */
  tDiv() {
    return this._tDiv(this.tDivChoices.value());
  }

  _tDivUnit(t) {
    if (t < 0.000001) return "ns";
    if (t < 0.001) return "us";
    if (t < 1) return "ms";
    return "s";
  }

  /**
   * Get the correct unit for time setting
   * @returns {string} The correct time unit
   */
  tDivUnit() {
    return this._tDivUnit(this.tDivChoices.value());
  }

  trigTime() {
    return this._tDiv(this.triggerSetting.time.value);
  }

  trigTimeUnit() {
    return this._tDivUnit(this.triggerSetting.time.value);
  }

  trigVolt() {
    return this._vDiv(this.triggerSetting.volt.value);
  }

  trigVoltUnit() {
    return this._vDivUnit(this.triggerSetting.volt.value);
  }
}
KeyInputManager.register(ModeOscillioscope);

class OscillioscopeMenuBase extends MenuBase {
  constructor(manager, subMenus = []) {
    super(manager, subMenus);
  }

  on_modeBtn() {
    this.manager.activateMode("ModeVolt");
  }
}

class OscillioscopeMenuRoot extends OscillioscopeMenuBase {
  constructor(manager) {
    super(manager, ["OscillioscopeMenu"])
  }
}
KeyInputManager.register(OscillioscopeMenuRoot);

class OscillioscopeMenu extends OscillioscopeMenuBase {
  constructor(manager, subMenus = []) {
    super(manager, subMenus);
  }

  redraw() {
    this.drawFuncBtns();
    super.redraw();
  }

  drawFuncBtns() {
    // Function buttons
    const screen = this.manager.currentMode.screen;
    this.F1Button = new ScreenFuncBtn(screen,
      "Voltage", new Choices([]), 0);
    this.F2Button = new ScreenFuncBtn(screen,
      "Current", new Choices([]), 1);
    this.F3Button = new ScreenFuncBtn(screen,
      null, new Choices([]), 2);
    this.F4Button = new ScreenFuncBtn(screen,
      null, new Choices([]), 3, true)
  }

  on_F1Btn() {
    this.manager.currentMode.vDivCh1Choices.increment(true);
    this.F1Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F2Btn() {
    this.manager.currentMode.vDivCh2Choices.increment(true);
    this.F2Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F3Btn() {
    this.manager.currentMode.tDivChoices.increment(true);
    this.F3Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F4Btn() {
    this.F4Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_backBtn() {
    this.F1Button.collapse();
    this.F2Button.collapse();
    this.F3Button.collapse();
    this.F4Button.collapse();
  }
}
KeyInputManager.register(OscillioscopeMenu);