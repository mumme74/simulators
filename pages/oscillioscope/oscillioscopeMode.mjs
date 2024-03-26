import {ModeBase, MenuBase, KeyInputManager} from './keyinputs.mjs';
import {Choices} from './menus.mjs';
import {
  ScreenBase, ScreenBadgeText, ScreenBadgeValue,
  ScreenBadgeBase, ScreenFuncBtn
} from './screen.mjs';
import { SignalGenerator, SignalInputBase } from './signalgenerator.mjs';

// this file handles all Oscillioscope measuring
// ie when we are in oscillioscope mode

const gridXNr = 12, gridYNr = 8;

class OscillioscopeInput extends SignalInputBase {
  constructor(mode, ch) {
    super(mode, ch, 50);
  }

  inspectData(data) {

  }
}

/**
 * handle time and Volt based trigger settings
 * and the same for Ch voltages
 * Construct a pair of these to get x/y trigger settings
 */
class OscillioscopeAxisValue {
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
    this.value += this.xDivChoices.value() / 10;
  }
}

class OscillioscopeChannelSettings {
  constructor(mode, chNr, on, zero = 0.0) {
    this.mode = mode;
    this.chNr = chNr;
    this.onOffChoices = new Choices(["on","off"], on ? 0 : 1);
    this.vDivChoices = new Choices([
      0.01,0.02,0.05,0.1,0.5,1,2,5,10,20,50,100],6);
    this.zeroPos = new OscillioscopeAxisValue(
      this.vDivChoices);

    this.coupling = new Choices(["⎓ DC","⏦ AC","⏚ GND"], 0);
    this.propeMul = new Choices([1,10,100,1000], 0);

    this.zeroPos.value = zero * this.vDivChoices.value();
  }
}

class OscillioscopeTriggerSettings {
  constructor(mode, tDivChoices, chNr) {
    this.mode = mode;
    this.time = new OscillioscopeAxisValue(tDivChoices);
    this.source = new Choices(["Ch 1","Ch 2"], 0);
    this.coupling = new Choices(["⎓ DC","⏦ AC","⏚ GND"], 0);
    this.type = new Choices(["Auto","Normal","Single"],0);
    this.triggerOn = new Choices(["/ rising","\\ falling"],0);
    this.setChannel(chNr);
  }

  setChannel(chNr) {
    this.chNr = chNr;
    const vDivChoice = this.mode[`ch${chNr}Settings`].vDivChoices;
    this.volt = new OscillioscopeAxisValue(vDivChoice);
  }
}

class OscillioscopeHorPosWidget extends ScreenBadgeBase {
  constructor(screen, x, y) {
    const width = 110, height = 17, screenEdgeIn = 30;
    const lineCurve = screen.createElement("line", {
                    x1:0,y1:height/2,x2:width,y2:height/2}),
          lineMarker = screen.createElement("line", {
                    x1:width/2,y1:0,x2:width/2,y2:height}),
          lBracket = screen.createElement("path", {
                    d:`M0 2 h-4 v${height-4} h4`,
                    transform:`translate(${screenEdgeIn},0)`}),
          rBracket = screen.createElement("path", {
                    d:`M0 2 h4 v${height-4} h-4`,
                    transform:`translate(${width-screenEdgeIn},0)`}),
          group = screen.createElement("g", {
            transform:"translate(5,5)"});
    group.append(lineCurve, lineMarker, lBracket, rBracket);

    super(screen, group, "horPosWidget", {
      transform:`translate(${x},${y})`, width, height});

    this.lineMarker = lineMarker;
    this.lBracket = lBracket;
    this.rBracket = rBracket;
    this.width = width;
    this.height = height;
    this.screenEdgeIn = screenEdgeIn;

    this.screen = screen;
  }

  update() {
    const horPos = this.screen.mode.horPos.value,
          tDiv = this.screen.mode.tDivChoices.value(),
          xMiddle = this.width / 2;

    const screenWidth = this.screenEdgeIn * 2 -4,
          markerPos = xMiddle + horPos / tDiv * screenWidth / gridXNr,
          mPosClamped = Math.min(this.width, Math.max(0, markerPos));

    this.lineMarker.x1.baseVal.value = mPosClamped;
    this.lineMarker.x2.baseVal.value = mPosClamped;

    // move brackets at edges
    const lBracketPos = Math.min(this.screenEdgeIn, mPosClamped+4),
          rBracketPos = Math.max(
              this.width - this.screenEdgeIn, mPosClamped-4),// 4 for bracket width
          lBracketX = mPosClamped > xMiddle ?
              Math.max(0,Math.max(rBracketPos-screenWidth+4, lBracketPos))
            : lBracketPos,
          rBracketX = mPosClamped < xMiddle ?
              Math.min(
                this.width,
                Math.min(lBracketPos+screenWidth-4, rBracketPos))
            : rBracketPos;

    this.lBracket.transform.baseVal[0].matrix.e = lBracketX;
    this.rBracket.transform.baseVal[0].matrix.e = rBracketX;
  }
}

class OscillioscopeScreen extends ScreenBase {
  constructor(mode) {
    super(mode);
    this.triggerStatusChoices = new Choices([
      "Auto","Trig","Ready","Scan","Stop"],0);

  }

  redraw() {
    super.redraw();
    this.drawHeader();
    this.drawFooter();
    this.drawScreen();
    this.drawTrigger();
    this.drawChannels();
    this.updateHeader();
    this.updateFooter();
    this.updateTrigger();
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

    const trigSet = this.mode.triggerSettings;
    this.triggerTime = new ScreenBadgeValue(this, "T:",
      this.mode.trigTime(), this.mode.trigTimeUnit(), "triggerTimeBadge",
      {transform:"translate(300,3)"});

    this.horPosWgt = new OscillioscopeHorPosWidget(this, 160, 3);
  }

  _buildTriggInfoStr() {
    const s = this.mode.triggerSettings;
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
      chNr === this.mode.triggerSettings.chNr ? 'b' : ' '
    }${
      this.mode[`ch${chNr}Settings`].coupling.value()[0]
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

  _displayRect() {
    return {
      // must be in sync width and x, y and height
      x:12,y: 32, width: this.width -24, height: this.height-64
    };
  }

  _displayCoords() {
    const sizeRect = this._displayRect(),
          xLeft = sizeRect.x, yTop = sizeRect.y;
    return {
      xLeft,
      xRight: xLeft + sizeRect.width,
      xMiddle: xLeft + sizeRect.width / 2,
      yTop,
      yBottom: yTop + sizeRect.height,
      yMiddle: yTop + sizeRect.height / 2,
    };
  }

  _xDivSize() {
    const {width, height} = this._displayRect();
    return {
      vDiv: height / gridYNr,
      tDiv: width / gridXNr
    };
  }

  drawScreen() {
    const sizeRect = this._displayRect();
    const dashStyle = `1 ${
      // calculate so we have 5 dashes to every square
      sizeRect.width / 5 / gridXNr
    }`;
    const screenNode = this.mode.manager.oscInstance.screen,
          xOffset = sizeRect.width / gridXNr,
          yOffset = sizeRect.height / gridYNr;

    const rect = this.createElement("rect", sizeRect);
    rect.classList.add("oscillioscopeBg");
    rect.style.strokeDasharray = dashStyle;
    screenNode.append(rect);

    // vertical line for grid
    for (let i = 1; i < gridXNr; ++i) {
      const y1 = sizeRect.y, y2 = y1 + sizeRect.height,
            x = sizeRect.x + xOffset * i;
      const line = this.createElement("line", {
        x1: x, x2: x, y1, y2});
      line.classList.add("oscillioscopeBg");
      line.style.strokeDasharray = dashStyle;
      if (i === 6)
        line.style.strokeWidth = "4px";
      screenNode.append(line);
    }

    // horizontal lines for grid
    for (let i = 1; i < gridYNr; i++){
      const x1 = sizeRect.x, x2 = x1 + sizeRect.width,
            y = sizeRect.y + yOffset * i;
      const line = this.createElement("line", {
        x1, x2, y1: y, y2: y});
      line.classList.add("oscillioscopeBg");
      line.style.strokeDasharray = dashStyle;
      if (i === 4)
        line.style.strokeWidth = "4px";
      screenNode.append(line);
    }
  }

  drawTrigger() {
    const {
      xLeft, xRight, xMiddle, yTop, yBottom, yMiddle
    } = this._displayCoords();

    // horizontal and vertical lines
    this.markerVLine = this.createElement("line",{
      x1: xMiddle, x2: xMiddle,
      y1: yTop, y2: yBottom});
    this.markerVLine.classList.add("markerLine");
    this.markerHLine = this.createElement("line", {
      x1: xLeft, x2: xRight,
      y1: yMiddle, y2: yMiddle});
    this.markerHLine.classList.add("markerLine");

    // horizontal and vertical arrow
    this.trigVArrow = this.createElement("path", {
      d:"M-3 0 H3 L0 3 L-3 0z",
      transform:`translate(${xMiddle},${yTop})`
    });
    this.trigVArrow.classList.add("triggerVArrow");
    this.trigHArrow = this.createElement("path", {
      d: "M0 0 L3 -3 V3 L0 0z",
      transform:`translate(${xRight},${yMiddle})`
    });
    this.trigHArrow.classList.add("triggerHArrow");


    this.mode.manager.oscInstance.screen.append(
      this.markerHLine, this.markerVLine,
      this.trigVArrow, this.trigHArrow
    );
  }

  _channelY(chSet, yTop, yMiddle, yBottom) {
    const chZero = chSet.zeroPos.value,
          chPos = chZero / chSet.vDivChoices.value();
    const {vDiv} = this._xDivSize();

    return Math.min(yBottom, Math.max(yTop, yMiddle - chPos * vDiv));
  }

  drawChannels() {
    const {
      xLeft, yTop, xRight,
      yBottom, yMiddle, xMiddle
    } = this._displayCoords();

    const ch1Set = this.mode.ch1Settings,
          ch2Set = this.mode.ch2Settings,
          ch1Y = this._channelY(ch1Set, yTop, yMiddle, yBottom),
          ch2Y = this._channelY(ch2Set, yTop, yMiddle, yBottom);

    this.ch1Arrow = this.createElement("path", {
      d:"M-3 -3 L0 0 L-3 3 V-3z",
      transform:`translate(${xLeft-3},${ch1Y})`});
    this.ch1Arrow.classList.add("ch1Arrow");

    this.ch2Arrow = this.createElement("path", {
      d:"M-3 -3 L0 0 L-3 3 V-3z",
      transform:`translate(${xLeft-3},${ch2Y})`
    });
    this.ch2Arrow.classList.add("ch2Arrow");

    this.ch1Curve = this.createElement("path", {
      d:`M0 0 L${xRight-xLeft} 0`,
      transform:`translate(${xLeft},${ch1Y})`});
    this.ch1Curve.classList.add("ch1Curve");

    this.ch2Curve = this.createElement("path", {
      d:`M0 0 L${xRight-xLeft} 0`,
      transform:`translate(${xLeft},${ch2Y})`});
    this.ch2Curve.classList.add("ch2Curve");

    this.mode.manager.oscInstance.screen.append(
      this.ch1Arrow, this.ch2Arrow, this.ch1Curve, this.ch2Curve);
  }

  updateSettings() {
    this.updateHeader();
    this.updateFooter();
    this.updateTrigger();
    this.updateChannels();
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

    this.update();
  }

  updateFooter() {
    this.triggerSettings.setText(this._buildTriggInfoStr());
    this.ch1Settings.setText(this._buildChInfo(1));
    this.ch2Settings.setText(this._buildChInfo(2));
  }

  updateTrigger() {
    const {
            xLeft, xMiddle, xRight,
            yTop, yMiddle, yBottom
          } = this._displayCoords(),
          {vDiv, tDiv} = this._xDivSize();

    const ts = this.mode.triggerSettings,
          volt = ts.volt.value,
          time = ts.time.value,
          chSet = this.mode[`ch${ts.source.value()[3]}Settings`],
          chZeroPos = chSet.zeroPos.value,
          vDivVlu = chSet.vDivChoices.value(),
          tDivVlu = this.mode.tDivChoices.value(),
          horPosX = this._horPosX(xLeft, xMiddle, xRight);

    // move horizontal
    const sumVolt = chZeroPos + volt,
          v = (sumVolt / vDivVlu) * vDiv,
          y = yMiddle - v,
          yClamped = Math.min(yBottom, Math.max(yTop, y));
    this.markerHLine.y1.baseVal.value = yClamped;
    this.markerHLine.y2.baseVal.value = yClamped;
    this.trigHArrow.transform.baseVal[0].matrix.f = yClamped;
    const fn = ts.source.value()[3]==="2" ? "add" : "remove";
    this.trigHArrow.classList[fn]("ch2")

    // move vertical
    const t = (time / tDivVlu) * tDiv,
          x = horPosX + t,
          xClamped = Math.min(xRight, Math.max(xLeft, x));
    this.markerVLine.x1.baseVal.value = xClamped;
    this.markerVLine.x2.baseVal.value = xClamped;
    this.trigVArrow.transform.baseVal[0].matrix.e = xClamped;
  }

  updateChannels() {
    const {
      xLeft, yTop, xRight,
      yBottom, yMiddle, xMiddle
    } = this._displayCoords();

    const ch1Set = this.mode.ch1Settings,
          ch2Set = this.mode.ch2Settings,
          ch1Y = this._channelY(ch1Set, yTop, yMiddle, yBottom),
          ch2Y = this._channelY(ch2Set, yTop, yMiddle, yBottom),
          screen = this.mode.screen;

    if (this.mode.manager.currentMenu instanceof OscillioscopeChMenu1 &&
        OscillioscopeChMenu1.chSelect)
    {
      const chSel = OscillioscopeChMenu1.chSelect,
            line = screen.markerHLine,
            chY = chSel[2] === "1" ? ch1Y : ch2Y;
      line.y1.baseVal.value = chY;
      line.y2.baseVal.value = chY;
    }

    // move arrows
    screen.ch1Arrow.transform.baseVal[0].matrix.f = ch1Y;
    screen.ch2Arrow.transform.baseVal[0].matrix.f = ch2Y;
    screen.ch1Curve.transform.baseVal[0].matrix.f = ch1Y;
    screen.ch2Curve.transform.baseVal[0].matrix.f = ch2Y;

    // show/hide
    [ch1Set, ch2Set].forEach((s, i)=>{
      const fn = s.onOffChoices.value() === "off" ? "add" : "remove";
      screen[`ch${i+1}Arrow`].classList[fn]("hidden");
      screen[`ch${i+1}Curve`].classList[fn]("hidden");
    });
  }

  _horPosX(xLeft, xMiddle, xRight) {
    const horPos = this.mode.horPos.value,
          xPos = horPos / this.mode.tDivChoices.value();
    const {tDiv} = this._xDivSize();

    return Math.min(xRight, Math.max(xLeft, xMiddle + xPos * tDiv));
  }

  updateHorPos() {
    const {
      xLeft, yTop, xRight,
      yBottom, yMiddle, xMiddle
    } = this._displayCoords();

    const x = this._horPosX(xLeft, xMiddle, xRight);
    this.markerVLine.x1.baseVal.value = x;
    this.markerVLine.x2.baseVal.value = x;
    this.trigVArrow.transform.baseVal[0].matrix.e = x;

    this.horPosWgt.update();
  }

  update() {}
}

export class ModeOscillioscope extends ModeBase {
  constructor(manager) {
    super(manager, []);
    this.ch1Settings = new OscillioscopeChannelSettings(
      this, 1, true, 1);
    this.ch2Settings = new OscillioscopeChannelSettings(
      this, 2, true, -1);
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

    this.screen = new OscillioscopeScreen(this);
    this.inputCh1 = new OscillioscopeInput(this, "ch1");
    this.inputCh2 = new OscillioscopeInput(this, "ch2");
    this.triggerSettings = new OscillioscopeTriggerSettings(
      this, this.tDivChoices, 1);

    this.horPos = new OscillioscopeAxisValue(this.tDivChoices);

    // for debug
    this.triggerSettings.time.value = this.tDivChoices.value();
    this.triggerSettings.volt.value = this.ch1Settings.vDivChoices.value();
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
    return (r < 0.1) ? (r > -0.1) ? r * 1000 : r : r;
  }

  /**
   * The v/div setting for channel 1
   * @returns {number} the number value, changed to 100 for 100ms
   */
  vDivCh1() {
    return this._vDiv(this.ch1Settings.vDivChoices.value());
  }

  /**
   * The v/div setting for channel 2
   * @returns {number} the number value, changed to 100 for 100ms
   */
  vDivCh2() {
    return this._vDiv(this.ch2Settings.vDivChoices.value());
  }

  _vDivUnit(r) {
    return r < 0.1 ? r > -0.1 ? "mV" :"V" : "V";
  }

  /**
   * Get the correct unit for v/div ch1
   * @returns {string} The correct unit for this setting
   */
  vDivCh1Unit() {
    return this._vDivUnit(this.ch1Settings.vDivChoices.value());
  }

  /**
   * Get the correct unit for v/div ch1
   * @returns {string} The correct unit for this setting
   */
  vDivCh2Unit() {
    return this._vDivUnit(this.ch2Settings.vDivChoices.value());
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
    return Math.round(this._tDiv(this.triggerSettings.time.value));
  }

  trigTimeUnit() {
    return this._tDivUnit(this.triggerSettings.time.value);
  }

  trigVolt() {
    return Math.round(this._vDiv(this.triggerSettings.volt.value)*10)/10;
  }

  trigVoltUnit() {
    return this._vDivUnit(this.triggerSettings.volt.value);
  }
}
KeyInputManager.register(ModeOscillioscope);

class OscillioscopeMenuBase extends MenuBase {
  constructor(manager, subMenus = []) {
    super(manager, subMenus);
  }

  cleanup() {
    [1,2,3,4].forEach(i=>{
      const btn = this[`F${i}Button`];
      if (btn) btn.destroy();
    });
    super.cleanup();
  }

  on_ch1_2Btn() {
    this.manager.activateMenu("OscillioscopeChMenu1");
  }

  on_horBtn() {
    this.manager.activateMenu("OscillioscopeHorMenu1");
  }

  on_trigBtn() {
    this.manager.activateMenu("OscillioscopeTriggerMenu1");
  }

  on_modeBtn() {
    this.manager.activateMode("ModeVolt");
  }

  on_backBtn() {
    const prevMenu = this.manager.menuAtHistory(1);
    if (prevMenu instanceof OscillioscopeMenuBase)
      this.manager.menuBack();
  }
}

class OscillioscopeMenuRoot extends OscillioscopeMenuBase {
  constructor(manager) {
    super(manager, [
      "OscillioscopeMenu",
      "OscillioscopeTriggerMenu1"
    ]);
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
    //this.manager.currentMode.ch1Settings.vDivChoices.increment(true);
    this.F1Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F2Btn() {
    //this.manager.currentMode.ch2Settings.vDivChoices.increment(true);
    this.F2Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F3Btn() {
    //this.manager.currentMode.tDivChoices.increment(true);
    this.F3Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_F4Btn() {
    this.F4Button.click();
    this.manager.currentMode.screen.updateHeader();
  }

  on_backBtn() {
    if (!this.screen.collapseFuncButtons())
      super.on_backBtn();
  }
}
KeyInputManager.register(OscillioscopeMenu);

class OscillioscopeTriggerMenu1 extends OscillioscopeMenuBase {

  _highlight(on) {
    const screen = this.manager.currentMode.screen,
          fn = on ? "add" : "remove";
    screen.markerHLine.classList[fn]("highlight");
    screen.markerVLine.classList[fn]("highlight");
    screen.updateTrigger();
  }

  activated() {
    this._highlight(true);
    super.activated();
  }

  cleanup() {
    this._highlight(false);
    super.cleanup();
  }

  on_upBtn() {
    const mode = this.manager.currentMode;
    mode.triggerSettings.volt.inc();
    mode.screen.updateSettings();
  }

  on_downBtn() {
    const mode = this.manager.currentMode;
    mode.triggerSettings.volt.dec();
    mode.screen.updateSettings();
  }

  on_leftBtn() {
    const mode = this.manager.currentMode;
    mode.triggerSettings.time.dec();
    mode.screen.updateSettings();
  }

  on_rightBtn() {
    const mode = this.manager.currentMode;
    mode.triggerSettings.time.inc();
    mode.screen.updateSettings();
  }

  on_trigBtn() {
    this.manager.activateMenu("OscillioscopeTriggerMenu2");
  }
}
KeyInputManager.register(OscillioscopeTriggerMenu1);

class OscillioscopeTriggerMenu2 extends OscillioscopeTriggerMenu1 {
  constructor(manager, subMenus = []) {
    super(manager, subMenus);
  }

  redraw() {
    this.drawFuncBtns();
    super.redraw();
  }

  drawFuncBtns() {
    // Function buttons
    const screen = this.manager.currentMode.screen,
          mode = this.manager.currentMode;
    this.F1Button = new ScreenFuncBtn(screen,
      "Trigger", mode.triggerSettings.triggerOn, 0);
    this.F2Button = new ScreenFuncBtn(screen,
      "Channel", mode.triggerSettings.source, 1);
    this.F3Button = new ScreenFuncBtn(screen,
      "coupling", mode.triggerSettings.coupling, 2);
    this.F4Button = new ScreenFuncBtn(screen,
      "1/2", new Choices([]), 3);
  }

  on_F1Btn() {
    this.F1Button.click();
    this.manager.currentMode.screen.updateSettings();
  }

  on_F2Btn() {
    this.F2Button.click();
    this.manager.currentMode.screen.updateSettings();
  }

  on_F3Btn() {
    this.F3Button.click();
    this.manager.currentMode.screen.updateSettings();
  }

  on_F4Btn() {
    //this.F4Button.click();
    this.manager.activateMenu("OscillioscopeTriggerMenu3");
  }

  on_backBtn() {
    if (!this.collapseFuncButtons())
      super.on_backBtn();
  }
}
KeyInputManager.register(OscillioscopeTriggerMenu2);

class OscillioscopeTriggerMenu3 extends OscillioscopeTriggerMenu1 {
  redraw() {
    // Function buttons
    const screen = this.manager.currentMode.screen,
          mode = this.manager.currentMode;
    this.F1Button = new ScreenFuncBtn(screen,
      "Mode", mode.triggerSettings.type, 0);
    this.F4Button = new ScreenFuncBtn(screen,
      "2/2", new Choices([]), 3);
    super.redraw();
  }

  on_F1Btn() {
    this.F1Button.click();
    this.manager.currentMode.screen.updateSettings();
  }

  on_F4Btn() {
    this.collapseFuncButtons();
    this.manager.menuBack();
  }

  on_backBtn() {
    if (!this.collapseFuncButtons())
      this.manager.menuBack();
  }
}
KeyInputManager.register(OscillioscopeTriggerMenu3);

class OscillioscopeChMenu1 extends OscillioscopeMenuBase {
  static chSelect = "";

  _highlight(fn) {
    this.manager.currentMode.screen.markerHLine
      .classList[fn]("highlight")
  }

  activated() {
    if (!OscillioscopeChMenu1.chSelect)
      OscillioscopeChMenu1.chSelect = "ch1Settings";
    this._highlight("add");
    super.activated();
    this.manager.currentMode.screen.updateChannels();
  }

  cleanup() {
    this._highlight("remove");
    super.cleanup();
  }

  _scaleVolt(fn) {
    const mode = this.manager.currentMode;
    mode[OscillioscopeChMenu1.chSelect].vDivChoices[fn](true);
    mode.screen.updateSettings();
    mode.screen.update();
  }

  on_ch1_2Btn() {
    this.manager.activateMenu("OscillioscopeChMenu2")
  }

  on_leftBtn() {
    this._scaleVolt("decrement");
  }

  on_rightBtn() {
    this._scaleVolt("increment");
  }

  _movePos(fn) {
    const mode = this.manager.currentMode;
    mode[OscillioscopeChMenu1.chSelect].zeroPos[fn]();
    mode.screen.updateChannels();
    mode.screen.update();
  }

  on_upBtn() {
    this._movePos("inc");
  }

  on_downBtn() {
    this._movePos("dec");
  }

  on_backBtn() {
    OscillioscopeChMenu1.chSelect = "";
    super.on_backBtn();
  }
}
KeyInputManager.register(OscillioscopeChMenu1);

class OscillioscopeChMenu2 extends OscillioscopeChMenu1 {
  redraw() {
    const screen = this.manager.currentMode.screen,
          mode = this.manager.currentMode,
          chSelect = OscillioscopeChMenu1.chSelect,
          chSetting = this.manager.currentMode[chSelect];
    this.F1Button = new ScreenFuncBtn(screen,
      `Channel ${chSelect[2]}`, chSetting.onOffChoices, 0);
    this.F2Button = new ScreenFuncBtn(screen,
      "Coupling", chSetting.coupling, 1);
    this.F3Button = new ScreenFuncBtn(screen,
      "Probe", chSetting.propeMul, 2);
    super.redraw();
  }

  on_ch1_2Btn() {
    const nr = OscillioscopeChMenu1.chSelect[2];
    OscillioscopeChMenu1.chSelect = +nr === 1 ?
      "ch2Settings" : "ch1Settings";
    this.cleanup();
    this.redraw();
    this._highlight("add");
    this.manager.currentMode.screen.updateChannels();
  }

  _updateScreen() {
    const screen = this.manager.currentMode.screen;
    screen.updateChannels();
    screen.update();
  }

  on_F1Btn() {
    this.F1Button.click();
    this._updateScreen();
  }

  on_F2Btn() {
    this.F2Button.click();
    this._updateScreen();
  }

  on_F3Btn() {
    this.F3Button.click();
    this._updateScreen();
  }

  on_backBtn() {
    if (!this.collapseFuncButtons())
      this.manager.menuBack();
  }
}
KeyInputManager.register(OscillioscopeChMenu2);

class OscillioscopeHorMenu1 extends OscillioscopeMenuBase {

  _highlight(fn) {
    this.manager.currentMode.screen.markerVLine
      .classList[fn]("highlight");
  }

  activated() {
    this._highlight("add");
    this.manager.currentMode.screen.updateHorPos();
    super.activated();
  }

  cleanup() {
    this._highlight("remove");
    super.cleanup();
  }

  _changeTDiv(fn) {
    const mode = this.manager.currentMode;
    mode.tDivChoices[fn](true);
    mode.screen.updateSettings();
    mode.screen.updateHorPos();
    mode.screen.update();
  }

  on_upBtn() {
    this._changeTDiv("increment");
  }

  on_downBtn() {
    this._changeTDiv("decrement")
  }

  _horPos(fn) {
    const mode = this.manager.currentMode;
    mode.horPos[fn]();
    mode.screen.updateHorPos();
    mode.screen.update();
  }

  on_leftBtn() {
    this._horPos("dec");
  }

  on_rightBtn() {
    this._horPos("inc");
  }
}
KeyInputManager.register(OscillioscopeHorMenu1);