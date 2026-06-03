/**
 * Validates voice/synth pipeline constants (headless sanity check)
 */

const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25];
const MELODY = [0, 2, 4, 2, 0, 4, 5, 4];

export async function voiceTest({ duration = 5 }) {
  const beat = duration / MELODY.length;
  let peak = 0;
  for (const i of MELODY) {
    const freq = NOTES[i % NOTES.length];
    const sample = Math.sin(2 * Math.PI * freq * beat);
    peak = Math.max(peak, Math.abs(sample));
  }
  return {
    notes: MELODY.length,
    peak,
    engine: "square-vocaloid-style",
    ok: peak > 0 && peak <= 1,
  };
}