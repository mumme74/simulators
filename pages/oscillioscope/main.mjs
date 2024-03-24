"use strict"

import {OscModes} from './keyinputs.mjs';
import {KeyInputManager} from './keyinputs.mjs';
import {ModeVolt} from './multimeterMode.mjs';

const dq = document.querySelector.bind(document);

class Oscillioscope {
  constructor(mode) {
    this.screen = dq("#screen");
    this.buttons = {
      F1Btn: dq("#F1Btn"),
      F2Btn: dq("#F2Btn"),
      F3Btn: dq("#F3Btn"),
      F4Btn: dq("#F4Btn"),
      modeBtn: dq("#modeBtn"),
      ch1_2Btn: dq("#ch1_2Btn"),
      horBtn: dq("#horBtn"),
      backBtn: dq("#backBtn"),
      systemBtn: dq("#systemBtn"),
      saveBtn: dq("#saveBtn"),
      onOffBtn: dq("#onOffBtn"),
      upBtn: dq("#upBtn"),
      rightBtn: dq("#rightBtn"),
      downBtn: dq("#downBtn"),
      leftBtn: dq("#leftBtn"),
      measureRangeBtn: dq("#measureRangeBtn"),
      autoBtn: dq("#autoBtn"),
      runPauseBtn: dq("#runPauseBtn"),
      trigBtn: dq("#trigBtn")
    }
    const lastMode = localStorage.getItem("lastMode")
    this.modeManager = new KeyInputManager(this);
  }
}

const o = new Oscillioscope();