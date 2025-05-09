// 画像フィルター処理用Web Worker
self.onmessage = function(e: MessageEvent) {
  const { imageData, params } = e.data;
  const data: Uint8ClampedArray = imageData.data;
  const w: number = imageData.width, h: number = imageData.height;

  // RGB<->HSV変換
  function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const d = mx - mn;
    let h = 0, s = mx ? d / mx : 0, v = mx;
    if (d) {
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = ((b - r) / d + 2);
      else h = ((r - g) / d + 4);
      h /= 6;
    }
    return [h, s, v];
  }
  function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // パラメータ展開
  const {
    mode, satScale, vMin, vMax, gammaHSV,
    contrast, brightOff, gammaRGB
  }: {
    mode: string,
    satScale: number,
    vMin: number,
    vMax: number,
    gammaHSV: number,
    contrast: number,
    brightOff: number,
    gammaRGB: number
  } = params;

  // ピクセルごとに変換
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const r: number = data[idx], g: number = data[idx + 1], b: number = data[idx + 2];
    if (mode === 'HSV') {
      let [hh, s, v] = rgb2hsv(r, g, b);
      s = Math.min(1, Math.max(0, satScale * s));
      v = Math.min(vMax, Math.max(vMin, v));
      let vn = (v - vMin) / Math.max(vMax - vMin, 1e-6);
      vn = Math.pow(vn, gammaHSV);
      v = vMin + (vMax - vMin) * vn;
      const [r2, g2, b2] = hsv2rgb(hh, s, v);
      data[idx] = r2;
      data[idx + 1] = g2;
      data[idx + 2] = b2;
      // alphaはそのまま
    } else {
      // RGB モード
      let rr: number = (r / 255 - 0.5) * contrast + 0.5 + brightOff;
      let gg: number = (g / 255 - 0.5) * contrast + 0.5 + brightOff;
      let bb: number = (b / 255 - 0.5) * contrast + 0.5 + brightOff;
      rr = Math.min(1, Math.max(0, rr)); rr = Math.pow(rr, gammaRGB);
      gg = Math.min(1, Math.max(0, gg)); gg = Math.pow(gg, gammaRGB);
      bb = Math.min(1, Math.max(0, bb)); bb = Math.pow(bb, gammaRGB);
      data[idx] = Math.round(rr * 255);
      data[idx + 1] = Math.round(gg * 255);
      data[idx + 2] = Math.round(bb * 255);
    }
    // alphaはそのまま
  }

  // 処理後のImageDataを返す
  self.postMessage({ imageData });
};
