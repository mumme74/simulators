"use strict"

import { OscModes, KeyInputManager, KeyInputBase, MenuBase } from './keyinputs.mjs';
import { ScreenFuncBtn } from './screen.mjs';

/**
 * A class that handles multiple choices
 * @readonly {number|string} choices The available choices
 * @readonly {number} selectedIdx The currently selected index
 */
export class Choices {
  /**
   * Constructor for Choices
   * @param {[number|string]} choices The available choices
   * @param {number} [selectedIdx] The index that is selected, default: don't select any
   */
  constructor(choices, selectedIdx = -1) {
    this.choices = choices;
    this.selectIdx(selectedIdx);
  }

  /**
   * Select this index
   * @param {number} idx The index in available choices to select
   * @throws {Error} If idx is out of bounds
   */
  selectIdx(idx) {
    if (idx === -1)
      this.selectedIdx = idx;
    else {
      this._checkIdx(idx);
      this.selectedIdx = idx;
    }
  }

  /**
   * Select this value
   * @param {number|string} vlu Select this value
   * @throws {Error} if value is not present
   */
  select(vlu) {
    if (vlu === null)
      this.selectIdx = -1;
    else
      this.selectIdx(this._checkAndFind(vlu));
  }

  /**
   * Increment selectedIdx
   * @param {boolean} [flipOver] if true and at end flip to 0 again
   * @returns {boolean} true if we were at end
   */
  increment(flipOver = false) {
    if (this.selectedIdx === this.choices.length -1) {
      if (flipOver) this.selectedIdx = 0;
      return true;
    }
    this.selectedIdx++;
    return false;
  }

  /**
   * Get the currently selected value
   * @returns {string|number|null} The value selected or null if not selected
   */
  value() {
    return this.selectIdx === -1 ? null : this.choices[this.selectedIdx];
  }

  _checkIdx(idx) {
    if (idx < 0 || idx >= this.choices.length)
      throw new Error(`index ${idx} is out of bounds, available: ${this.choices}`);
  }

  _checkAndFind(choice) {
    const idx = this.choices.indexOf(choice);
    if (idx === -1)
    throw new Error(`Choice ${choice} is not in available choices, available: ${this.choices}`);
    return idx;
  }
}

/**
 * A class that can toggle several choices
 * @readonly {[number]} toggleIdxs The toggled indexes
 */
class ToggleChoices extends Choices {
  /**
   * Constructor for ToggleChoices
   * @param {[number|string]} choices The available choices
   * @param {number} [selectedIdx] The currently selected idx
   * @param {[number]} [toggledIdxs] These idx are on at start
   */
  constructor(choices, selectedIdx = 0, toggledIdxs = []) {
    super(choices, selectedIdx);
    this.toggledIdxs = [...toggledIdxs];
  }

  /**
   * Find out if it is on
   * @param {number} idx The index in this.choices to find
   * @returns {boolean} true if found and is on
   */
  isIdxOn(idx) {
    return this.toggledIdxs.indexOf(idx) !== -1;
  }

  /**
   * Find out if this choice is on
   * @param {string|number} choice The choice in this.choices to check
   * @returns {boolean} true if found and is on
   */
  isOn(choice) {
    const idx = this.choices.indexOf(choice);
    if (idx === -1) return false;
    return this.isIdxOn(idx);
  }

  /**
   * Turns on this idx
   * @param {number} idx The index to turn on
   * @throws {Error} If idx is out of bounds
   */
  setIdxOn(idx) {
    this._checkIdx(idx);
    if (this.toggledIdxs.indexOf(idx) === -1)
      this.toggledIdxs.push(idx);
  }

  /**
   * Turns off this idx
   * @param {number} idx The index to turn off
   * @throws {Error} If idx is out of bounds
   */
  setIdxOff(idx) {
    this._checkIdx(idx);
    const tIdx = this.toggledIdxs.indexOf(idx)
    if (tIdx !== -1)
      this.toggledIdxs.splice(tIdx, 1);
  }

  /**
   * Turns on this choice
   * @param {string|number} choice The choice to turn on
   * @throws {Error} If choice is not available
   */
  setChoiceOn(choice) {
    this.setIdxOn(this._checkAndFind(choice));
  }

  /**
   * Turns off this choice
   * @param {string|number} choice The choice to turn off
   * @throws {Error} If choice is not available
   */
  setChoiceOff(choice) {
    this.setIdxOff(this._checkAndFind(choice));
  }

  /**
   * Toggles this index
   * @param {number} idx The index to toggle
   * @returns {boolean} The new state
   * @throws {Error} if index is out of bounds
   */
  toggleIdx(idx) {
    this._checkIdx(idx);
    const tIdx = this.toggledIdxs.indexOf(idx);
    if (tIdx !== -1) {
      this.toggledIdxs.push(idx);
      return true;
    } else {
      this.toggledIdxs.splice(tIdx,1);
      return false;
    }
  }

  /**
   * Toggles this choice
   * @param {string|number} choice The choice to toggle
   * @returns {boolean} The new state
   * @throws {Error} If choice is not available
   */
  toggle(choice) {
    return this.toggleIdx(this._checkAndFind(choice));
  }

  /**
   * Return value allStates
   * @typedef {Object} ChoiceState
   * @property {string|number} choice The choice value
   * @property {boolean} isOn true if turned on
   */

  /**
   * Create an array with all choices
   * @returns {[ChoiceState]} All available choices with on state
   */
  allStates() {
    return this.choices.map(c=>{
      return {choice:c, isOn:this.toggledIdxs.indexOf(c) !== -1}
    })
  }
}

class MultimeterMenu extends MenuBase {
  constructor(manager, subMenus = []) {
    super(manager, subMenus);
    this.ohmChoices = new Choices(["Ω", "🕩", "-⯈⊢", "⊣⊢"]);
    this.currentTypeChoices = new Choices(["A","mA"]);
    this.voltageTypeChoices = new Choices(["V","mV"]);
    this.hold = false;
  }

  redraw() {
    this.drawFuncBtns();
    this.haltButtonUpdated();
  }

  haltButtonUpdated() {
    const n = this.manager.oscInstance.buttons.runPauseBtn;
    if (!this.hold) {
      n.classList.add("on");
      n.classList.remove("halt");
    } else {
      n.classList.add("halt");
      n.classList.remove("on");
    }
    this.manager.currentMode.screen.display.update();
  }

  drawFuncBtns() {
    // Function buttons
    const screen = this.manager.currentMode.screen;
    this.F1Button = new ScreenFuncBtn(screen,
      "Voltage", this.voltageTypeChoices, 0);
    this.F2Button = new ScreenFuncBtn(screen,
      "Current", this.currentTypeChoices, 1);
    this.F3Button = new ScreenFuncBtn(screen,
      null, this.manager.currentMode.unitChoices, 2);
    this.F4Button = new ScreenFuncBtn(screen,
      null, this.ohmChoices, 3, true)
  }

  on_F1Btn() {
    this.voltageTypeChoices.increment(true);
    this.manager.ensureMode("ModeVolt");
    this.F1Button.click();
  }

  on_F2Btn() {
    console.log("on_F2Btn")
    this.currentTypeChoices.increment(true);
    this.manager.ensureMode("ModeAmp");
    this.F2Button.click();
  }

  on_F3Btn() {
    this.manager.currentMode.unitChoices.increment(true);
    this.F3Button.click();
  }

  on_F4Btn() {
    this.ohmChoices.increment(true);
    this.manager.ensureMode("ModeOhm");
    this.F4Button.click();
  }

  on_backBtn() {
    this.F1Button.collapse();
    this.F2Button.collapse();
    this.F3Button.collapse();
    this.F4Button.collapse();
  }

  on_runPauseBtn() {
    this.hold = !this.hold;
    this.haltButtonUpdated();
  }
}
KeyInputManager.register(MultimeterMenu);
