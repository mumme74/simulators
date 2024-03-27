"use strict"

// this file is supposed to generate signals

/**
 * Base class for all inputs to oscillioscope
 */
export class SignalInputBase {
  /**
   * Constructor
   * @param {ModeBase} mode The controlling mode instance
   * @param {string} attachToInput The input to attach to
   * @param {number} [intervall] The intervall to aquire
   */
  constructor(mode, attachToInput, intervall = 200) {
    this.mode = mode;
    this.attachToCh(attachToInput);
    this.intervall = intervall;
  }

  /**
   * Plug in to output from signal generator
   * @param {string} attachToInput
   */
  attachToCh(attachToInput) {
    this.attachToInput = attachToInput;
    this.attachedCh = this.mode.manager.oscInstance.signalGenerator
      [this.attachToInput];
  }

  /**
   * Start periodic acquire
   */
  start() {
    this.tmr = setInterval(this.sample.bind(this), this.intervall);
  }

  /**
   * Stop periodic acquire
   */
  stop() {
    clearInterval(this.tmr);
    this.tmr = null;
  }

  setHold(hold) {
    hold ? this.stop() : this.start();
  }

  /**
   * Change the refresh rate to acquire
   * @param {number} intervall Time in milliseconds
   */
  setInterval(intervall) {
    this.intervall = intervall;
    if (this.tmr) {
      this.stop();
      this.start();
    }
  }

  /**
   * Sample from signal generator
   * Normally not needed, auto-acquires if start-ed
   */
  sample() {
    this.sampleTimeMs = this.mode.sampleTimeMs();
    const data = this.attachedCh.sample(this.sampleTimeMs);
    this.inspectData(data);
  }

  /**
   * Callback for acquired data, subclasses must implement
   * @param {Int16Array} data The data-points acquired
   */
  inspectData(data) {}
}


export class SignalGenerator {
  constructor(oscInstance) {
    this.oscInstance = oscInstance;
    this.ch1 = new SignalGeneratorChannel(this, "ch1", true);
    this.ch2 = new SignalGeneratorChannel(this, "ch2");
    this.multimeter = new SignalGeneratorChannel(this, "multi", true);
  }
}

class SignalGeneratorChannel {
  constructor(owner, name, running = false) {
    this.owner = owner;
    this.frequency = 1;
    this.running = running;
    this._acquireFrom = 0;
    this.name = name;

    this.node = document.getElementById(`${this.name}_fieldset`);
    this.setSignal(localStorage.getItem(`${name}_signal`) || "SignalSine");
  }

  _clearHtml() {
    while(this.node.firstElementChild != this.node.lastChild)
      this.node.lastChild.remove();
  }

  setSignal(signalName) {
    this._clearHtml();
    this.signal = SignalManager.instance().createInstance(signalName);
    localStorage.setItem(`${this.name}_signal`, signalName);
    // create same for all
    const idPart = `${this.name}_`;
    this._createOnOff(idPart);
    this._createSelect(idPart);
    if (this.signal instanceof SignalCyclic)
      this._createFrequency(idPart);
    Object.values(this.signal.props).forEach(prop=>{
      this._createProp(idPart, prop);
    });
  }

  _createOnOff(idPart) {
    const div = document.createElement("div"),
          lbl = document.createElement("label"),
          chk = document.createElement("input");
    div.append(lbl, chk);
    lbl.for = `${idPart}on`;
    lbl.innerText = "Signal på";
    chk.type = "checkbox";
    chk.id = lbl.for;
    chk.checked = this.running;
    chk.addEventListener("change", (e)=>{this.running=e.target.checked});
    this.node.append(div);
  }

  _createSelect(idPart) {
    const div = document.createElement("div"),
          lbl = document.createElement("label"),
          select = document.createElement("select");
    lbl.for = `${idPart}signals`;
    lbl.innerText = "Signaler";
    select.id = lbl.for;
    SignalManager.instance().allSignals().forEach(sigName=>{
      const option = document.createElement("option");
      option.innerText = sigName.replace("Signal","");
      option.value = sigName;
      if (sigName === this.signal.name())
        option.selected = true;
      select.append(option);
    });
    select.addEventListener("change", (e)=>{
      this.setSignal(e.target.value);
    });
    div.append(lbl, select);
    this.node.append(div);
  }

  _createRange(idPart, prop, initVlu) {
    const div = document.createElement("div"),
          lbl = document.createElement("label"),
          range = document.createElement("input"),
          vlu = document.createElement("input");
    vlu.type = "number";
    vlu.value = initVlu;
    vlu.max = prop.max;
    vlu.min = prop.min;
    lbl.for = `${idPart}${prop.name}`;
    lbl.innerText = prop.caption;
    range.id = lbl.for;
    range.type = "range";
    range.min = prop.min;
    range.max = prop.max;
    range.value = initVlu;
    div.append(lbl,range,vlu);
    this.node.append(div);
    return {vlu, range, lbl, div};
  }

  _createProp(idPart, prop) {
    const initVlu = prop.getCallback(this.signal[prop.name]);
    const {range,vlu} = this._createRange(idPart, prop, initVlu);
    const cb = (e)=>{
      const fn = `set${
        prop.name[0].toUpperCase()
      }${
        prop.name.substring(1)
      }`;
      const v = + e.target.value;
      this.signal[fn](prop.setCallback(v));
      range.value = v;
      vlu.value = v;
    };
    range.addEventListener("change",cb);
    vlu.addEventListener("change", cb)
  }

  _createFrequency(idPart) {
    const {range, vlu} = this._createRange(idPart, {
      caption:"Frekvens", name: "frequency",
      min:1, max: 10000000,
      getCallback: ((vlu)=>vlu),
      setCallback: ((vlu)=>vlu)
    }, this.frequency);
    const cb = (e)=>{
      const v = +e.target.value;
      this.setFrequency(v);
      range.value = v;
      vlu.value = v;
    }
    range.addEventListener("change", cb);
    vlu.addEventListener("change", cb)
  }

  setFrequency(frequency) {
    this.frequency = +frequency;
  }

  sample(durationMs, from = -1) {
    // acquire for ms long
    const data = new Int16Array(this.signal.points.length);
    if (!this.running) return data;

    // special case DC
    if (this.signal.cycles === 0) {
      data.fill(this.signal.points[0]);
      return data;
    }

    const signalDurationMs = this.signal.points.length / this.frequency,
          periodMs = signalDurationMs / this.signal.cycles,
          fromIdx = (from>-1 ? from / periodMs : this._acquireFrom);

    // loop signal as acquire duration is longer than signal
    const xInc = durationMs / signalDurationMs;
    let si = fromIdx;
    for (let i = 0; i < data.length; ++i, si += xInc) {
      if (si >= this.signal.points.length)
        si = 0;
      const vlu = this.signal.points[Math.floor(si)];
      data[i] = vlu;
    }
    this._acquireFrom = si-1;

    return data;
  }
}

/**
 * Manages all signal used by signal generator
 */
class SignalManager {
  static classes = {};

  /**
   * Register a signal class to Signal manager
   * @param {SignalBase} signalCls The class to register
   */
  static register(signalCls) {
    // get the className from a static object
    const name = signalCls.toString().replace(
      /^class(?: |\n|\r)+([^\s\n\r{]+)[\s\n\r{](?:\s|\n|\r|.)+/i,
                '$1').trim();
    if (SignalManager.classes[name])
      throw new Error(` ${name} already registered`);
    SignalManager.classes[name] = signalCls;
  }

  /**
   * Get the singleton for this instance
   * @returns {SignalManager} This instance
   */
  static instance() {
    if (!SignalManager._instance)
      SignalManager._instance = new SignalManager();
    return SignalManager._instance;
  }

  constructor() {
  }

  /**
   * List all registered signals
   * @returns {[string]} An array with all Classnames of registered signals
   */
  allSignals() {
    return Object.keys(SignalManager.classes);
  }

  /**
   * Create a new instance from clsName
   * @param {string} clsName The name of the class to get
   * @returns {SignalBase} The instance of the signal
   * @throws {Error} if clsName is'nt registered
   */
  createInstance(clsName) {
    const signalCls = SignalManager.classes[clsName];
    if (!signalCls)
      throw new Error(`${clsName} is not registered`);
    return new SignalManager.classes[clsName]();
  }
}

/**
 * Signal properties
 */
class SignalProperty {
  constructor({
    name, min = 1, max = 100,
    callbackSet = null, callbackGet = null,
    caption = ""
  }) {
    this.name = name;
    this.min = min;
    this.max = max;
    this._caption = caption || name;
    this.setCallback = callbackSet || ((vlu)=>vlu);
    this.getCallback = callbackGet || ((vlu)=>vlu);
  }

  get caption() { return this._caption || this.name ;}
  set caption(caption) { this._caption = caption; }
}

/**
 * Base class of all signals
 */
class SignalBase {
  constructor(props) {
    this.points = new Int16Array(12000);
    // store all properties and name them if needed
    this.props = props;
    Object.entries(this.props).forEach(([key,prop])=>{
      if (!prop.name) prop.name = key;
    });
  }

  name() {
    return this.constructor.name;
  }

  clamp(vlu) {
    return vlu > 32766 ? 32766 : vlu < -32768 ? -32768 : vlu;
  }

  setAmplitude(amplitude) {}
  setOffset(offset) {}
  setCycles(cycles) {}
}

/**
 * Base class for all continuous signals
 */
class SignalContinuous extends SignalBase {
  constructor(props, amplitude) {
    super(props);
    this.amplitude = amplitude;
  }

  /**
   * Change the amplitude of the signal
   * @param {number} amplitude The new amplitude in baseUnits (Volt,ampere etc)
   */
  setAmplitude(amplitude) {
    this.amplitude = +amplitude;
    this.update();
  }
}

class SignalCyclic extends SignalContinuous {
  constructor(props, amplitude, offset, cycles) {
    super(props, amplitude);
    this.offset = offset;
    this.cycles = cycles;
  }

  /**
   * Change the offset of the signal, ie how far from 0 the middle is
   * @param {number} offset
   */
  setOffset(offset) {
    this.offset = +offset;
    this.update();
  }

  /**
   * How many cycles to generate in one sample period
   * @param {number} cycles The cycles to generate should always be positive integer
   */
  setCycles(cycles) {
    this.cycles = +cycles;
    this.update();
  }

  /**
   * Update all data points
   */
  update() {} // stub, subclasses implement

  _period(cycles) {
    const len = this.points.length,
          period = Math.round(len / cycles);
    return {len, period};
  }
}

/**
 * A DC signal, flatline
 */
class SignalDC extends SignalContinuous {
  // values scales to 10mV
  constructor(amplitude = 12) {
    const props = {
      amplitude: new SignalProperty({min:0.01,max:1000}),
    };
    super(props, amplitude);
    this.update();
  }

  update() {
    this.points.fill(this.clamp(Math.round(this.amplitude)*100));
  }
}
SignalManager.register(SignalDC);

/**
 * Generate square wave
 */
class SignalSquare extends SignalCyclic {
  constructor(amplitude = 12, offset = 0, cycles = 12, duty = 0.5) {
    const props = {
      amplitude: new SignalProperty({min:0.01,max:1000}),
      offset: new SignalProperty({min:-20,max:20}),
      duty: new SignalProperty({min:0,max:100,
        callbackSet(vlu){ return +vlu / 100; },
        callbackGet(vlu) { return vlu * 100; }
      })
    };
    super(props, amplitude, offset, cycles);
    this.duty = duty;
    this.update();
  }

  update() {
    const {len, period} = this._period(this.cycles),
          onSteps = Math.round(period * this.duty),
          offSteps = Math.round(period - onSteps);

    let state = false;
    for (let i = 0, steps; i < len; i += steps) {
      steps = state ? onSteps : offSteps;
      const amp = state ? this.amplitude : -this.amplitude;
      const vlu = amp * 100 + this.offset * 100;
      this.points.fill(this.clamp(vlu), i, i + steps);
      state = !state;
    }
  }

  setDuty(duty) {
    this.duty = duty;
    this.update();
  }
}
SignalManager.register(SignalSquare);

/**
 * Generate a ramp (sawtooth) wave
 */
class SignalRamp extends SignalCyclic {
  constructor(amplitude = 12, offset = 0, cycles = 12) {
    const props = {
      amplitude: new SignalProperty({min:0.01,max:1000}),
      offset: new SignalProperty({min:-20,max:20})
    };
    super(props, amplitude, offset, cycles);
    this.update();
  }

  update() {
    const {len, period} = this._period(this.cycles),
          incr = this.amplitude * 2 / period;
    let vlu = -this.amplitude + this.offset;
    for (let i = 0, steps = period; i < len; i++, steps++) {
      vlu = (steps >= period) ? -this.amplitude + this.offset : vlu + incr;
      if (steps >= period) steps = 0;
      this.points[i] = this.clamp(vlu*100);
    }
  }
}
SignalManager.register(SignalRamp);

/**
 * Generate a triangle wave
 */
class SignalTriangle extends SignalCyclic {
  constructor(amplitude = 12, offset = 0, cycles = 12, skew = 0.5) {
    const props = {
      amplitude: new SignalProperty({min:0.01,max:1000}),
      offset: new SignalProperty({min:-20,max:20}),
      skew: new SignalProperty({min:10,max:90,
        callbackSet(vlu){ return +vlu / 100; },
        callbackGet(vlu) { return vlu * 100; }
      })
    };
    super(props, amplitude, offset, cycles);
    this.skew = skew;
    this.update();
  }

  update() {
    const {len, period} = this._period(this.cycles),
          ampTop = this.amplitude + this.offset,
          ampBottom = -this.amplitude + this.offset,
          tUp = period / 2 * this.skew,
          tDown = period / 2 - tUp,
          // mul by 100 to increase rounding precision
          inc = this.amplitude *100 / tUp / 100,
          dec = -this.amplitude *100 / tDown / 100;

    let state = true,
        vlu = -this.amplitude + this.offset,
        term = inc;
    for (let i = 0; i < len; i++) {
      if (state && vlu >= ampTop) {
        state = false;
        term = dec;
      } else if (!state && vlu <= ampBottom) {
        state = true;
        term = inc;
      }
      vlu += term;
      this.points[i] = this.clamp(vlu*100);
    }
  }

  setSkew(skew) {
    this.skew = skew;
    this.update();
  }
}
SignalManager.register(SignalTriangle);

/**
 * Generate a sine wave
 */
class SignalSine extends SignalCyclic {
  constructor(amplitude = 12, offset = 0, cycles = 12) {
    const props = {
      amplitude: new SignalProperty({min:0.01,max:1000}),
      offset: new SignalProperty({min:-20,max:20})
    };
    super(props, amplitude, offset, cycles);
    this.update();
  }

  update() {
    const {len, period} = this._period(this.cycles),
          rot = Math.PI * 2 * this.cycles / len;

    for (let i = 0; i < len; ++i) {
      const vlu = Math.sin(rot * i) * this.amplitude + this.offset;
      this.points[i] = this.clamp(vlu * 100);
    }
  }
}
SignalManager.register(SignalSine);

/**
 * Base class for all non continuos signals, bit frames and such
 */
class SignalDiscontinuous extends SignalBase {
  constructor() {
    super();
  }
}