/**
 * Character rig — head/body pose driven by face tracking
 */

let rig = null;
let trackingActive = false;
let smooth = 0.18;

const target = { yaw: 0, pitch: 0, roll: 0, mouth: 0, leanX: 0, leanY: 0 };
const current = { yaw: 0, pitch: 0, roll: 0, mouth: 0, leanX: 0, leanY: 0 };

export function registerCharacterRig(api) {
  rig = api;
}

export function setTrackingActive(active) {
  trackingActive = active;
}

export function isTrackingActive() {
  return trackingActive;
}

export function setSmoothing(amount) {
  smooth = Math.max(0.05, Math.min(0.5, amount));
}

export function setHeadPoseTarget(pose) {
  if (pose.yaw !== undefined) target.yaw = pose.yaw;
  if (pose.pitch !== undefined) target.pitch = pose.pitch;
  if (pose.roll !== undefined) target.roll = pose.roll;
  if (pose.mouth !== undefined) target.mouth = pose.mouth;
  if (pose.leanX !== undefined) target.leanX = pose.leanX;
  if (pose.leanY !== undefined) target.leanY = pose.leanY;
}

export function resetHeadPose() {
  Object.assign(target, { yaw: 0, pitch: 0, roll: 0, mouth: 0, leanX: 0, leanY: 0 });
}

export function tickCharacterRig() {
  if (!rig?.headGroup) return;

  const k = trackingActive ? smooth : 0.08;
  for (const key of Object.keys(current)) {
    current[key] += (target[key] - current[key]) * k;
  }

  const maxYaw = 0.85;
  const maxPitch = 0.55;
  const yaw = Math.max(-maxYaw, Math.min(maxYaw, current.yaw));
  const pitch = Math.max(-maxPitch, Math.min(maxPitch, current.pitch));
  const roll = Math.max(-0.6, Math.min(0.6, current.roll));

  rig.headGroup.rotation.order = "YXZ";
  rig.headGroup.rotation.set(pitch, yaw, roll);

  if (rig.mouthPlane) {
    rig.mouthPlane.scale.y = 0.25 + current.mouth * 0.9;
  }

  if (rig.bodyGroup && trackingActive) {
    rig.bodyGroup.rotation.y = yaw * 0.25;
    rig.bodyGroup.rotation.x = pitch * 0.12;
    rig.bodyGroup.position.x = current.leanX * 0.06;
    rig.bodyGroup.position.y = current.leanY * 0.04;
  } else if (rig.bodyGroup) {
    rig.bodyGroup.rotation.y *= 0.92;
    rig.bodyGroup.rotation.x *= 0.92;
    rig.bodyGroup.position.x *= 0.9;
    rig.bodyGroup.position.y *= 0.9;
  }

  if (rig.eyes) {
    const blink = current.mouth > 0.85 ? 0.3 : 1;
    for (const e of rig.eyes) e.scale.y = blink;
  }
}

export function getPoseDebug() {
  return { ...current, trackingActive };
}