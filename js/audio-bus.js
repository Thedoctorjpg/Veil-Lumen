/**
 * Shared Web Audio bus — synth, glitch chain, recording tap, clone chain
 */

import { initAudioGlitchChain } from "./glitch-engine.js";

let audioCtx = null;
let masterGain = null;
let glitchOut = null;
let cloneGain = null;
let cloneFilter = null;
let recordDest = null;
let reverbNode = null;
let analyser = null;
let cloneSampleBuffer = null;
let clonePitchShift = 1;

export function getAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    glitchOut = audioCtx.createGain();
    cloneGain = audioCtx.createGain();
    cloneFilter = audioCtx.createBiquadFilter();
    cloneFilter.type = "peaking";
    cloneFilter.frequency.value = 2800;
    cloneFilter.Q.value = 0.8;
    cloneFilter.gain.value = 4;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    recordDest = audioCtx.createMediaStreamDestination();

    const convolver = audioCtx.createConvolver();
    reverbNode = audioCtx.createGain();
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.75;
    reverbNode.gain.value = 0.35;

    const rate = audioCtx.sampleRate;
    const length = rate * 1.5;
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;

    initAudioGlitchChain(audioCtx, masterGain, glitchOut);

    glitchOut.connect(cloneGain);
    cloneGain.connect(cloneFilter);
    cloneFilter.connect(dryGain);
    cloneFilter.connect(convolver);
    convolver.connect(reverbNode);
    dryGain.connect(analyser);
    reverbNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.connect(recordDest);

    updateVolume();
    updateReverb();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function getMasterGain() {
  getAudio();
  return masterGain;
}

export function getAnalyser() {
  getAudio();
  return analyser;
}

export function getRecordStream() {
  getAudio();
  return recordDest.stream;
}

export function updateVolume() {
  if (!masterGain) return;
  const v = document.getElementById("volume");
  masterGain.gain.value = v ? Number(v.value) / 100 : 0.65;
}

export function updateReverb() {
  if (!reverbNode) return;
  const r = document.getElementById("reverb");
  reverbNode.gain.value = r ? (Number(r.value) / 100) * 0.6 : 0.35;
}

export function getVibratoDepth() {
  const v = document.getElementById("vibrato");
  return v ? Number(v.value) / 5000 : 0.008;
}

export function setCloneSample(buffer, pitchShift = 1) {
  cloneSampleBuffer = buffer;
  clonePitchShift = pitchShift;
  if (cloneFilter) {
    cloneFilter.gain.value = buffer ? 6 : 4;
    cloneFilter.frequency.value = buffer ? 3200 : 2800;
  }
}

export function getCloneSample() {
  return cloneSampleBuffer;
}

export function getClonePitch() {
  return clonePitchShift;
}

export function playClonePreview() {
  if (!cloneSampleBuffer || !audioCtx) return;
  const src = audioCtx.createBufferSource();
  src.buffer = cloneSampleBuffer;
  src.playbackRate.value = clonePitchShift;
  const g = audioCtx.createGain();
  g.gain.value = 0.85;
  src.connect(g);
  g.connect(masterGain);
  src.start();
}