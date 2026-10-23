import { pedalPhase, TRAVEL_SPEED } from '../beat/timeline.js';
import { twoBoneJoint } from '../kit/math.js';
import { line } from '../kit/canvas.js';

export function poseAt(time) {
  const phase = pedalPhase(time);
  const pedal = (offset) => ({ x: -20 + Math.cos(phase + offset) * 34, y: -4 + Math.sin(phase + offset) * 34 });
  const nearFoot = pedal(0);
  const farFoot = pedal(Math.PI);
  const hip = { x: -50, y: -164 };
  return {
    phase,
    wheelAngle: (time - 5) * TRAVEL_SPEED / 73,
    bob: Math.sin(phase * 2) * 2,
    hip,
    nearFoot,
    farFoot,
    nearKnee: twoBoneJoint(hip, nearFoot, 98, 105, -1),
    farKnee: twoBoneJoint(hip, farFoot, 98, 105, -1),
  };
}

export function drawPelican(ctx, pose, { x = 0, y = 0, scale = 1, ink = '#354136', plumage = '#fcf7e9', accent = '#b88546', sketch = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function limb(hip, knee, foot, color) {
    line(ctx, [[hip.x, hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, 6);
    line(ctx, [[foot.x - 8, foot.y + 3], [foot.x + 20, foot.y + 3], [foot.x + 9, foot.y - 3]], color, 4);
  }
  function ellipse(x0, y0, rx, ry, fill, stroke = ink, width = 3) {
    ctx.beginPath();
    ctx.ellipse(x0, y0, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  limb(pose.hip, pose.farKnee, pose.farFoot, sketch ? ink : '#8b8b70');
  [-135, 135].forEach((center) => {
    ellipse(center, 0, 73, 73, null, ink, 5);
    ellipse(center, 0, 67, 67, null, ink, 1.2);
    for (let spoke = 0; spoke < 12; spoke += 1) {
      const angle = pose.wheelAngle + spoke * Math.PI / 6;
      line(ctx, [[center, 0], [center + Math.cos(angle) * 66, Math.sin(angle) * 66]], ink, 1.2);
    }
    ellipse(center, 0, 4, 4, ink, ink, 1);
  });

  line(ctx, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], ink, 6);
  line(ctx, [[-60, -115], [80, -105], [-20, -4]], ink, 6);
  line(ctx, [[80, -105], [135, 0]], ink, 6);
  line(ctx, [[80, -105], [72, -145], [100, -153], [115, -145], [110, -133]], ink, 5);
  line(ctx, [[-60, -115], [-66, -135]], ink, 5);
  line(ctx, [[-91, -139], [-43, -139]], ink, 7);
  ellipse(-20, -4, 24, 24, null, accent, 2);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], accent, 4);
  line(ctx, [[-123, 4], [-23, 20], [-16, -27], [-128, -5]], ink, 1.6);

  ctx.save();
  ctx.translate(0, pose.bob);
  ctx.beginPath();
  ctx.moveTo(-126, -180);
  ctx.bezierCurveTo(-175, -182, -168, -221, -132, -243);
  ctx.bezierCurveTo(-106, -259, -60, -259, -28, -240);
  ctx.bezierCurveTo(-10, -230, 8, -252, 6, -284);
  ctx.bezierCurveTo(2, -330, 39, -356, 73, -344);
  ctx.bezierCurveTo(99, -334, 95, -310, 76, -298);
  ctx.bezierCurveTo(53, -285, 64, -247, 37, -207);
  ctx.bezierCurveTo(8, -161, -81, -158, -126, -180);
  ctx.fillStyle = plumage;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(80, -326);
  ctx.lineTo(236, -297);
  ctx.quadraticCurveTo(160, -286, 85, -307);
  ctx.quadraticCurveTo(77, -294, 63, -286);
  ctx.quadraticCurveTo(85, -304, 80, -326);
  ctx.fillStyle = sketch ? plumage : '#d8b269';
  ctx.fill();
  ctx.stroke();
  line(ctx, [[85, -316], [230, -297]], ink, 1.8);
  ellipse(68, -330, 3.2, 3.2, ink, ink, 1);

  ctx.beginPath();
  ctx.moveTo(-118, -228);
  ctx.bezierCurveTo(-79, -247, -39, -220, -12, -199);
  ctx.bezierCurveTo(17, -176, 65, -157, 105, -147);
  ctx.bezierCurveTo(73, -154, 20, -160, -24, -172);
  ctx.bezierCurveTo(-73, -174, -116, -181, -133, -197);
  ctx.fillStyle = plumage;
  ctx.fill();
  ctx.stroke();
  for (let feather = 0; feather < 5; feather += 1) {
    const fx = -107 + feather * 16;
    line(ctx, [[fx, -210 + feather * 4], [fx + 22, -188 + feather * 3]], ink, 1.1);
  }
  ctx.restore();
  limb(pose.hip, pose.nearKnee, pose.nearFoot, accent);
  line(ctx, [[pose.nearFoot.x - 10, pose.nearFoot.y + 8], [pose.nearFoot.x + 15, pose.nearFoot.y + 8]], ink, 4);
  line(ctx, [[pose.farFoot.x - 10, pose.farFoot.y + 8], [pose.farFoot.x + 15, pose.farFoot.y + 8]], ink, 4);
  ctx.restore();
}
