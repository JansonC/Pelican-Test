// Bake real brush marks once. Frames only sample these immutable masks.
export async function prepareBrush(p, brush) {
  brush.instance(p);
  brush.load();
  brush.seed(314159);
  brush.noiseSeed(271828);
  const previousDraw = p.draw;
  p.draw = () => {
    p.background(255);
    brush.noFill();
    brush.set('HB', '#151515', 2.4);
    brush.line(-310, -120, 310, -120);
    brush.set('charcoal', '#080808', 3.6);
    brush.line(-310, 40, 310, 40);
    brush.set('2B', '#151515', 4);
    brush.line(-310, 190, 310, 190);
  };
  // The documented p5 lifecycle flushes brush masks in its postdraw hook.
  await p.redraw();
  p.draw = previousDraw;
  p._renderer?.flushDraw?.();
  p.drawingContext.finish();
  function mask(y) {
    const canvas = document.createElement('canvas');
    canvas.width = 680;
    canvas.height = 110;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(p.canvas, p.width / 2 - 340, p.height / 2 + y - 55, 680, 110, 0, 0, 680, 110);
    const data = ctx.getImageData(0, 0, 680, 110);
    let visible = 0;
    for (let i = 0; i < data.data.length; i += 4) {
      const alpha = 255 - data.data[i];
      if (alpha > 25) visible += 1;
      data.data[i] = 0;
      data.data[i + 1] = 0;
      data.data[i + 2] = 0;
      data.data[i + 3] = alpha;
    }
    ctx.putImageData(data, 0, 0);
    if (visible < 30) throw new Error('p5.brush did not produce a visible stroke');
    return canvas;
  }
  return { stroke: mask(-120), charcoal: mask(40), graphite: mask(190), verified: true };
}
