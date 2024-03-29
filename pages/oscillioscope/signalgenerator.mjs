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
    SignalGenerator.instance = this;
  }

  /**
   * Used to update Gui when a property is changed by code
   * @param {SignalBase} sigInstance The signal affected
   * @param {string} prop The propertyName
   */
  setPropertyValue(sigInstance, prop) {
    [this.ch1, this.ch2, this.multimeter].find(channel=>{
      if (channel.signal === sigInstance) {
        channel.setPropertyValue(prop, channel.signal[prop]);
        return true;
      }
    })
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
    else if (+this.signal.frequency)
      this.frequency = this.signal.frequency;

    Object.entries(this.signal.props).forEach(([key, prop])=>{
      this._createProp(idPart, prop, key);
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
    SignalManager.instance().allSignals().forEach(([cls, sigName])=>{
      const option = document.createElement("option");
      option.innerText = sigName.replace(/^Signal/,"");
      option.value = cls;
      if (cls === this.signal?.constructor.name)
        option.selected = true;
      select.append(option);
    });
    select.addEventListener("change", (e)=>{
      this.setSignal(e.target.value);
    });
    div.append(lbl, select);
    this.node.append(div);
  }

  _createRange(idPart, prop, initVlu, key) {
    const div = document.createElement("div"),
          lbl = document.createElement("label"),
          range = document.createElement("input"),
          vlu = document.createElement("input");
    vlu.type = "number";
    vlu.value = initVlu;
    vlu.max = prop.max;
    vlu.min = prop.min;
    vlu.id = `${idPart}${key}_vlu`;
    lbl.for = `${idPart}${key}_range`;
    lbl.innerText = prop.caption;
    range.id = lbl.for;
    range.type = "range";
    range.min = prop.min;
    range.max = prop.max;
    range.value = initVlu;
    if (prop.step) {
      range.setAttribute("step", prop.step);
      vlu.setAttribute("step", prop.step);
    }
    div.append(lbl,range,vlu);
    this.node.append(div);
    return {vlu, range, lbl, div};
  }

  _createProp(idPart, prop, key) {
    const initVlu = prop.getCallback(this.signal[key]);
    const {range,vlu} = this._createRange(idPart, prop, initVlu, key);
    const cb = (e)=>{
      const fn = this.signal.propertySetter(key);
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

  setPropertyValue(prop, vlu) {
    const idPart = `${this.name}_${prop}`;
    const vluNode = document.getElementById(`${idPart}_vlu`),
          rangeNode = document.getElementById(`${idPart}_range`);
    if (vluNode) vluNode.value = vlu;
    if (rangeNode) rangeNode.value = vlu;
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

    if (this.signal.liveInput)
      this.signal.update();

    if (from === -1 && this.signal.alwaysSampleFrom !== undefined)
      from = this.signal.alwaysSampleFrom;

    const signalDurationMs = this.signal.points.length / this.frequency,
          periodMs = signalDurationMs / (this.signal.cycles || 1),
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
  _createdInstances = [];

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
    return Object.keys(SignalManager.classes).map(clsName=>{
      const sig = new SignalManager.classes[clsName]();
      return [clsName, sig.name()];
    });
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
    const instance = new SignalManager.classes[clsName]();
    this._createdInstances.push(instance)
    return instance;
  }

  /**
   * Finds alla created signals of type
   * @param {string|SignalBase} signal The signal to filter in
   * @returns {[SignalBase]} All created signals which matches signal
   */
  findSignals(signal) {
    if (signal instanceof SignalBase)
      signal = signal.constructor.name;
    return this._createdInstances.filter(i=>
      i.constructor.name === signal);
  }
}

/**
 * Signal properties
 */
class SignalProperty {
  constructor({
    name, min = 1, max = 100,
    callbackSet = null, callbackGet = null,
    caption = "", step
  }) {
    this.name = name;
    this.min = min;
    this.max = max;
    this._caption = caption || name;
    this.setCallback = callbackSet || ((vlu)=>vlu);
    this.getCallback = callbackGet || ((vlu)=>vlu);
    this.step = step;
  }

  get caption() { return this._caption || this.name ;}
  set caption(caption) { this._caption = caption; }
}

/**
 * Base class of all signals
 */
class SignalBase {

  /**
   * special handling when these properties exists
   * @prop {number} [frequency]  Force signalGenerator to use this frequency
   * @prop {number} [alwaysSampleFrom] Start to sample from this point, for syning 2 signals
   * @prop {boolean} [liveInput] If true always re-genereate data
   */
  frequency = undefined;
  alwaysSampleFrom = undefined;
  liveInput = false;


  constructor(props, name = "") {
    this._name = name;
    this.points = new Int16Array(12000);
    // store all properties and name them if needed
    this.props = props;
    Object.entries(this.props).forEach(([key,prop])=>{
      if (!prop.name) prop.name = key;
    });
  }

  propertySetter(name) {
    return `set${
      name[0].toUpperCase()
    }${
      name.substring(1)
    }`;
  }

  name() {
    if (this._name) return this._name;
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
  constructor(props, amplitude, name = "") {
    super(props, name);
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
  constructor(props, amplitude, offset, cycles, name = "") {
    super(props, amplitude, name);
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
 * A base class when 2 signals must be in sync
 */
class Signal2Channel extends SignalBase {
  constructor(props, amplitude, name) {
    super(props,name)
    this.amplitude = amplitude;
    this.props = props;
    this._updateLock = false;
  }

  syncProperty(propertyName, vlu = null) {
    this._updateLock = true;
    SignalManager.instance().findSignals(this).forEach(s=>{
      s.syncSetProperty(
        this.propertySetter(propertyName),
        vlu ?? this[propertyName]);
    });
    this._updateLock = false;
  }

  syncSetProperty(setFn, vlu) {
    if (this._updateLock) return;
    if (!this[setFn])
      throw new Error("Can't set property using " + setFn);
    this[setFn](vlu);
    const prop = setFn[3].toLowerCase() + setFn.substring(4);
    SignalGenerator.instance.setPropertyValue(this, prop);
  }

  setAmplitude(amplitude) {
    this.amplitude = amplitude;
    this.syncProperty("amplitude");
    this.update();
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
    super(props, amplitude, "Likspänning");
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
    super(props, amplitude, offset, cycles, "PWM");
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
    super(props, amplitude, offset, cycles, "Sågtand");
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
    super(props, amplitude, offset, cycles, "Triangel");
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
    super(props, amplitude, offset, cycles, "Sinus");
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
  constructor(props, amplitude, offset, name = "", duration = 0.1, repeats = 3) {
    super(props, name);
    this.amplitude = amplitude;
    this.offset = offset;
    this.duration = duration;
    this.repeats = repeats;
  }

  setAmplitude(amplitude) {
    this.amplitude = amplitude;
    this.update();
  }

  setOffset(offset) {
    this.offset = offset;
    this.update();
  }

  setDuration(duration) {
    this.duration = duration;
    this.update();
  }

  setRepeats(repeats) {
    this.repeats = repeats;
    this.update();
  }

  update() {}
}


class SignalTransient extends SignalDiscontinuous {
  constructor(amplitude = 12, offset = 0, name = "", duration = 0.1, repeats = 1) {
    const props = {
      amplitude: new SignalProperty({min:-1000, max:1000, step:0.1}),
      offset: new SignalProperty({min:-20,max:20}),
      repeats: new SignalProperty({min:1,max:5}),
      duration: new SignalProperty({min:0.001,max:1, step:0.001})
    };
    super(props, amplitude, offset, name, duration, repeats);
    this.frequency = 1;
    this.alwaysSampleFrom = 0;

    this.update();
  }

  update() {
    const distance = this.points.length / this.repeats,
          halfDur = this.duration / 2 * 100,
          mulFactor = Math.pow(Math.abs(this.amplitude), 1/(halfDur*100));
    let x = distance -20 - halfDur, y = this.offset, mul = 1.0;
    for (let i = 0; i < this.points.length; ++i, ++x) {
      if (x >= distance) {
        // decrease
        y -= this.amplitude * Math.pow(mulFactor, 1/(x-distance+1));
        if (y <= this.offset-0.1) {
          x = 0;
          y = this.offset;
        }
      } else if (x+halfDur >= distance) {
        // increase
        y += this.amplitude * Math.pow(mulFactor, 1/(distance-x));
      }
      this.points[i] = y * 100;
    }
  }
}
SignalManager.register(SignalTransient);


class SignalVRSensor extends SignalDiscontinuous {
  constructor(amplitude = 1, duration = 0) {
    const props = {
      amplitude: new SignalProperty({min:0.1,max:10, step:0.1}),
      duration: new SignalProperty({name:"Ojämn fart",min:0,max:10,step:0.1}),
      repeats: new SignalProperty({name:"Tänder",min:10,max:80}),
      missingTooths: new SignalProperty({name:"Saknad tand",min:0,max:2}),
      speed: new SignalProperty({min:1,max:100}),
      slowDown: new SignalProperty({min:0,max:1,step:0.05})
    }
    super(props, amplitude, 0, "VR sensor", duration, 10);
    this.missingTooths = 2;//0;
    this.speed = 1;
    this.slowDown = 1;
    this.update();
    this.frequency = Math.PI;
  }

  setMissingTooths(tooths) {
    this.missingTooths = tooths;
    this.update();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.update();
  }

  setSlowDown(slowDown) {
    this.slowDown = slowDown;
    this.update();
  }

  update() {
    // at 1s tDiv sample speed we get 12 kPts in 48s
    // speed is in rps
    const oneRotFact = 12 / 4800 * this.speed,
          slowDownAmplitude = this.amplitude * this.slowDown,
          oneTooth =  this.repeats * oneRotFact,
          slowDownSpeed = 4 * oneTooth * oneRotFact; // for 4 cyl compression


    let lastVlu = 0, x = 0, t = 0, toothCnt = 0, blockFor = 0;
    for (let i = 0; i < this.points.length; i++, x++, t++) {
      const slow = Math.sin((x*slowDownSpeed)*0.8) * this.duration;
      const vlu = Math.sin(((x*oneTooth)+slow)*0.8) *
        this.amplitude * (1+slowDownAmplitude * slow);


      if (vlu < 0 && lastVlu >= 0) {
        toothCnt++;
        if (toothCnt % this.repeats === 0)
          blockFor = this.missingTooths;
        else
          blockFor--;
      }
      if (blockFor < 1)
        this.points[i] = vlu * 100;
      lastVlu = vlu;
    }
  }
}
SignalManager.register(SignalVRSensor);

class SignalLinBus extends SignalDiscontinuous {
  constructor(amplitude = 12, duration = 0.5, repeats = 0.5) {
    const props = {
      amplitude: new SignalProperty({min:12,max:24, step:1}),
      duration: new SignalProperty({name:"Paket utspridda", min:0,max:0.9,step:0.1}),
      repeats: new SignalProperty({name:"Belastning",min:0.1,max:0.8,step:0.1})
    }
    super(props, amplitude, 0.2, "LIN bus", duration, repeats);
    this.frequency = 96;
    this._bitLen =  2; // as i point len
    this._pos = 0;
    this.update();
  }

  _genBits(bits) {
    if (typeof bits === 'string')
      bits = bits.split('').map(c=>+c);
    let pos = this._pos;
    for (const bit of bits) {
      const bitVlu = bit ? this.amplitude : this.amplitude * 0.3;
      this.points.fill(bitVlu*100, pos, pos+this._bitLen);
      pos+=this._bitLen;
    }
    this._pos = pos;
  }

  _randomByte() {
    return Math.round(Math.random()*256).toString(2);
  }

  _genPkg() {
    // gen break
    this._genBits("".padStart(13,0));
    // sync
    this._genBits("10101010");
    //gen id
    const id = "0" + this._randomByte();
    this._genBits(id);
    // gen data
    const pkgLen = Math.round(Math.random()*8);
    for (let i = 0; i < pkgLen; ++i){
      const byte = this._randomByte();
      this._genBits(byte);
    }
    // gen checksum
    this._genBits(this._randomByte());
  }

  _genIdle(spacing) {
    this.points.fill(this.amplitude*100, this._pos, this._pos + spacing);
    this._pos += spacing;
  }

  update() {
    // frequency is 10kHz 12kpts at 10kHz gives 1200ms long
    const repeats = (this.points.length / 960 * this.repeats);
    const spacing = (this.points.length / repeats) - 48,
          spacingFactor = spacing/ 2 * this.duration;

    for (let i = 0; i < repeats; ++i) {
      this._genIdle(spacing - (spacingFactor - Math.round(Math.random()*spacingFactor)));
      this._genPkg();
      this._genIdle(13); // idle time
    }

    this._pos = 0;
  }
}
SignalManager.register(SignalLinBus);



class SignalResolver extends Signal2Channel {
  constructor(amplitude = 5, cos = undefined, baseFrequency = 10000) {
    const maxSpeed = 1000,
          props = {
      amplitude: new SignalProperty({min:1,max:10}),
      baseFrequency: new SignalProperty({name:"bas.frekv.",min:5000,max:10000,step:100}),
      speed: new SignalProperty({name:"rpm.", min:0,max:maxSpeed,step:20}),
      cos: new SignalProperty({name:"Sin/cos",min:0,max:1})
    };
    super(props, amplitude, "Resolver");
    this.frequency = 1000;
    this.alwaysSampleFrom = 0;
    this.baseFrequency = baseFrequency;
    this.cos = cos ?? SignalManager.instance().findSignals(
      this.constructor.name).length ? 1 : 0;
    this.speed = 100;
    this.maxSpeed = maxSpeed;
    this._updateLock = false;
    this.update();
  }

  setBaseFrequency(frequency) {
    this.baseFrequency = frequency;
    this.update();
    this.syncProperty("baseFrequency", frequency);
  }

  setCos(cos) {
    this.cos = cos;
    this.update();
    this.syncProperty("cos", cos ? 0 : 1);
  }

  setSpeed(speed) {
    this.speed = speed;
    this.update();
    this.syncProperty("speed", speed);
  }

  update() {
    const fFac = this.baseFrequency / this.points.length / 100,
          cosFac = this.cos * Math.PI / 2,
          nRevs = Math.floor(this.speed / 60),
          ptsPerRev =  nRevs * Math.PI / (this.points.length-1);

    for (let i = 0; i < this.points.length; ++i) {
      let vlu = Math.sin(((i*fFac)+cosFac)*Math.PI) * this.amplitude;
      if (this.speed)
        vlu *= Math.sin(((i*ptsPerRev)+cosFac));
      else
        vlu *= this.cos;
      this.points[i] = vlu * 100;
    }
  }
}
SignalManager.register(SignalResolver);

class SignalMicrophone extends SignalDiscontinuous {
  constructor(amplitude = 10, offset = 0) {
    const props = {
      amplitude: new SignalProperty({min:1,max:10}),
      powerOn: new SignalProperty({name:"Mic på", min:0,max:1})
    }
    super(props, amplitude, offset, "Mic");
    this.powerOn = 0;
    this.liveInput = true;
    this.alwaysSampleFrom = 0;

    if (!SignalMicrophone._listenerCnt)
      SignalMicrophone._listenerCnt = 0;
  }

  setupAudio() {
    if (this.powerOn) {
      SignalMicrophone._listenerCnt++;
    } else if (SignalMicrophone._listenerCnt) {
      SignalMicrophone._listenerCnt--;
    }


    if (!SignalMicrophone._ctx) {
      const ctx = SignalMicrophone._ctx = new AudioContext();
      const analyser = SignalMicrophone._analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      SignalMicrophone._dataArray = dataArray;

      navigator.mediaDevices.getUserMedia({audio:true})
        .then(stream=>{
          const mic = SignalMicrophone._microphone =
            ctx.createMediaStreamSource(stream);
          mic.connect(analyser);
          //analyser.connect(ctx.destination); // route to speakers debug
          if (this.powerOn) SignalMicrophone._capture();
      }).catch(reason=>{
        console.error(reason);
        alert(reason);
      });
    } else if (!SignalMicrophone._listenerCnt) {
      const ctx = SignalMicrophone._ctx;
      ctx.close();
      delete SignalMicrophone._ctx;
    }

  }

  static _capture() {
    const analyzer = SignalMicrophone._analyser,
          dataArray = SignalMicrophone._dataArray;
    analyzer.getByteTimeDomainData(dataArray);

    if (SignalMicrophone._listenerCnt > 0)
      requestAnimationFrame(SignalMicrophone._capture);
  }

  setPowerOn(on) {
    this.powerOn = on;
    this.setupAudio();

    if (on) {
      SignalMicrophone._capture();
      this.update();
    }
  }

  update() {
    const dataArray = SignalMicrophone._dataArray;
    if (!dataArray) return;
    if (!this.powerOn) {
      this.points.fill(0,0, this.points.length);
      return;
    }
    let j = 0;
    for (let i = 0; i < this.points.length; i++, j++) {
      this.points[i] = this.amplitude * (dataArray[j] - 0x7F); // To signed
      if (j >=  dataArray.length -1)
        j = 0;
    }
  }
}
SignalManager.register(SignalMicrophone);


