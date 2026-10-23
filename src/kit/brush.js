// Keep brush setup separate: the film can use cached brush layers without mutable frame history.
export async function prepareBrush(p, brush) {
  brush.instance(p);
  brush.load();
  brush.seed(314159);
  brush.noiseSeed(271828);
  const previousDraw = p.draw;
  p.draw = () => {
    p.clear();
    brush.noFill();
    brush.set('HB', '#8e7750', 1.2);
    brush.line(-210, 0, 210, 0);
  };
  // The documented p5 lifecycle flushes brush masks in its postdraw hook.
  await p.redraw();
  p.draw = previousDraw;
  p._renderer?.flushDraw?.();
  p.drawingContext.finish();
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 120;
  canvas.getContext('2d').drawImage(p.canvas, p.width / 2 - 240, p.height / 2 - 60, 480, 120, 0, 0, 480, 120);
  const pixels = canvas.getContext('2d').getImageData(0, 0, 480, 120).data;
  const visible = pixels.some((value, index) => index % 4 !== 3 && value > 20);
  if (!visible) throw new Error('p5.brush did not produce a visible stroke');
  return { stroke: canvas, verified: true };
}
