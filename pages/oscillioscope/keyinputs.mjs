"use strict"

// all possible modes in oscillioscope
const OscModes = {
  ModeOff: 0,
  ModeOscillioscope: 1,
  ModeVolt: 2,
  ModeAmp: 3,
  ModeOhm: 4,
  ModeContinuity: 5,
  ModeDiode: 6,
  ModeCapacitance: 7,
}; Object.entries(OscModes).forEach(([key,vlu])=>OscModes[vlu]=key);

export {OscModes};

/**
 * The Menu controlling singleton
 * Should be created once per application
 */
export class KeyInputManager {
  static classes = {}
  instances = {};

  /** create a instance of this managre, should be a singleton
   * @param {Oscillioscope} oscInstance A instance of the oscillioscope
   * @param {OscModes} startupMode Which mode we should default to after a cold boot
   */
  constructor(oscInstance, startupMode) {
    this.oscInstance = oscInstance;
    if (startupMode === undefined)
      startupMode = OscModes[this.defaultMode()];
    this.switchMode(startupMode)
  }

  /**
   * Switch to another mode
   * @param {number} mode from OscModes.
   */
  switchMode(mode) {
    switch (mode) {
    case OscModes.ModeOff:
      return this.activateMode("ModeOff");
    case OscModes.ModeOscillioscope:
      return this.activateMode("ModeOscillioscope");
    case OscModes.ModeVolt:
      return this.activateMode("ModeVolt");
    case OscModes.ModeAmp:
      return this.activateMode("ModeAmp");
    case OscModes.ModeMilliAmp:
      return this.activateMode("ModeMilliAmp");
    case OscModes.ModeOhm:
      return this.activateMode("ModeOhm");
    case OscModes.ModeContinuity:
      return this.activateMode("ModeContinuity");
    case OscModes.ModeDiode:
      return this.activateMode("ModeDiode");
    case OscModes.ModeCapacitance:
      return this.activateMode("ModeCapacitance");
    default:
      throw new Error(`Can't switch to ${mode} mode, unknown mode`)
    }
  }

  /**  registers a new menu
  * @param {KeyInputBase | KeyInputBase} cls A menu derived from MenuBase
  */
  static register(cls) {
    // get the className from a static object
    const name = cls.toString().replace(
      /^class(?: |\n|\r)+([^\s\n\r{]+)[\s\n\r{](?:\s|\n|\r|.)+/i,
               '$1').trim();
    if (KeyInputManager.classes[name])
      throw new Error(`Menu ${name} already registered`);
    KeyInputManager.classes[name] = cls;
  }

  /**
   * Get all keyinput instances in names
   * @param {[string]} names Array with all names of classes
   * @returns {KeyInputBase} All menu instances
   * @throws {Error} if not found
   */
  getInstances(names) {
    const classes = {};
    for (const name of names)
      classes[name] = this.getInstance(name);
    return classes;
  }

  /**
   * Get the menu instance registered as clsName
   * @param {string} clsName The name of the MenuCls instance
   * @returns
   */
  getInstance(clsName) {
    const menuCls = KeyInputManager.classes[clsName];
    if (!menuCls)
      throw new Error(`Menu ${clsName} is not registered can't be used as submenu`);
    if (this.instances[clsName])
      return this.instances[clsName];
    return this.instances[clsName] = new KeyInputManager.classes[clsName](this);
  }


  /**
   * Get the last used mode, or default
   * @returns the className of the last used mode, or default
   */
  defaultMode() {
    return localStorage.getItem("lastMode") || "ModeOscillioscope";
  }

  ensureMode(name) {
    if (this.currentMode.constructor.name !== name)
      this.activateMode(name);
  }

  /**
   * Set the currently active mode
   * @param {string} name Classname of the Mode to activate
   */
  activateMode(name) {
    this._activate(name, "currentMode", (instance)=>{
      if (!(instance instanceof ModeBase))
        throw new Error(`${name} does not inherit ModeBase`);
    });
  }

  /**
   * Sets the currently active menu
   * @param {string} name ClassName of the menu to activate
   */
  activateMenu(name) {
    this._activate(name, "currentMenu", (instance)=>{
      if (!(instance instanceof MenuBase))
        throw new Error(`${name} does not inherit MenuBase`);
    });
  }

  _activate(name, prop, checker) {
    const instance = this.getInstance(name)
    if (!instance)
      throw new Error(`${name} is not registered to ${this.name}`);
    checker(instance);

    const buttons = this.oscInstance.buttons;
    // deactivate old
    if (this[prop]) {
      const old = this[prop];
      for (const [key, node] of Object.entries(this.oscInstance.buttons)) {
        if (old.bound && old.bound[`on_${key}_bound`])
          buttons[key].removeEventListener("click", old.bound[`on_${key}_bound`]);
        else
          console.warn(key, "not detached from DOM");
      }
      delete old.bound;
      old.cleanup();
    }
    // activate the new
    this[prop] = instance;
    instance.bound = {};
    for (const [key, node] of Object.entries(this.oscInstance.buttons)) {
      const bound = instance.bound[`on_${key}_bound`] = instance[`on_${key}`].bind(instance);
      buttons[key].addEventListener("click", bound, instance);
    }

    if (prop === "currentMode" && name !== 'ModeOff')
      localStorage.setItem("lastMode", name);
    instance.redraw();
    instance.activated();
    console.log(name, "activated")
  }
}

/**
 * The base class for each menu
 * @prop {InputBase} parent reference to my parent
 * @prop {[InputBase|]} references to my submenus/submodes, if present
 */
export class KeyInputBase {
  parent = null;
  subInstances = [];

  /**
   * Base class constructor for all Menus
   * @param {KeyInputManager} manager The menu manager singleton
   */
  constructor(manager, subInstances = []) {
    this.manager = manager;
    this.subInstances = manager.getInstances(subInstances);
  }

  activated() {}
  deactivated() {}
  cleanup() {}
  redraw() {}

  /// all possible events from SVG buttons
  on_F1Btn(e) {}
  on_F2Btn(e) {}
  on_F3Btn(e) {}
  on_F4Btn(e) {}
  on_modeBtn(e) {}
  on_ch1_2Btn(e) {}
  on_horBtn(e) {}
  on_backBtn(e) {}
  on_systemBtn(e) {}
  on_saveBtn(e) {}
  on_onOffBtn(e) {}
  on_upBtn(e) {}
  on_rightBtn(e) {}
  on_downBtn(e) {}
  on_leftBtn(e) {}
  on_measureRangeBtn(e) {}
  on_autoBtn(e) {}
  on_runPauseBtn(e) {}
  on_trigBtn(e) {}
}



/**
 * The base class for all menus
 */
export class ModeBase extends KeyInputBase {
  autoRange = true;
  constructor(manager, subModes) {
    super(manager, subModes);
  }

  activated() {
    super.activated();
  }

  on_onOffBtn(e) {
    // we should always be in on mode if we land here,
    // the special off case is handled in its class
    this.manager.switchMode(OscModes.ModeOff);
  }

  measurementType() {
    return this.acMode ? "⏦ ?" : "⎓ ?";
  }

  cleanup() {
    this.clearScreen();
  }

  /**
   * Called to redraw a clean screen
   */
  redraw() {
    if (this.screen) this.screen.redraw();
  }

  clearScreen() {
    const sc = this.manager.oscInstance.screen;
    while (sc.lastChild !== sc.firstElementChild)
      sc.removeChild(sc.lastChild);
  }

  value() {
    return 0
  }
}

/**
 * The base class for each menu
 */
export class MenuBase extends KeyInputBase {
  /**
   * Base class constructor for all Menus
   * @param {MenuManager} manager The menu manager singleton
   */
  constructor(manager,subMenus = []) {
    super(manager, subMenus);
  }
}


class ModeOscillioscope extends ModeBase {
  constructor(manager) {
    super(manager, [])
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
  }

  redraw() {

  }

  // FIXME stub
}
KeyInputManager.register(ModeOscillioscope);


class ModeContinuity extends ModeBase {
  constructor(manager) {
    super(manager, []);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
  }

  // FIXME stub
}
KeyInputManager.register(ModeContinuity);


class ModeDiode extends ModeBase {
  constructor(menuManager) {
    super(menuManager, []);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
  }
  // FIXME stub
}
KeyInputManager.register(ModeDiode);


class ModeCapacitance extends ModeBase {
  constructor(manager) {
    super(manager, []);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.add("on");
  }
  // FIXME stub
}
KeyInputManager.register(ModeCapacitance);


// registered last
/**
 * The off menu
 */
class ModeOff extends ModeBase {
  constructor(manager) {
    super(manager, [
      "ModeOscillioscope",
      "ModeVolt",
      "ModeAmp",
      "ModeMilliAmp",
      "ModeOhm",
      "ModeContinuity",
      "ModeDiode",
      "ModeCapacitance"
    ]);
  }

  activated() {
    this.manager.oscInstance.buttons.onOffBtn.classList.remove("on");
  }

  redraw() {
    this.clearScreen();
  }

  on_onOffBtn(e) {
    this.manager.activateMode(this.manager.defaultMode());
  }
}
KeyInputManager.register(ModeOff);