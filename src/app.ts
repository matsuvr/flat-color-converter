// src/app.ts
// HTML elements
const canvasIn  = document.getElementById('canvasIn')  as HTMLCanvasElement;
const canvasOut = document.getElementById('canvasOut') as HTMLCanvasElement;
const ctxIn     = canvasIn.getContext('2d')!;
const ctxOut    = canvasOut.getContext('2d')!;
const dropzone  = document.getElementById('dropzone') as HTMLDivElement;
const loader    = document.getElementById('loader') as HTMLDivElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLAnchorElement;
const resetHSVBtn = document.getElementById('resetHSV') as HTMLButtonElement;
const resetRGBBtn = document.getElementById('resetRGB') as HTMLButtonElement;

// モード切替とコントロール群
const modeRadios  = document.getElementsByName('mode') as NodeListOf<HTMLInputElement>;
const hsvGroup    = document.getElementById('hsvControls')!;
const rgbGroup    = document.getElementById('rgbControls')!;

// HSV controls
const satScale    = document.getElementById('satScale')   as HTMLInputElement;
const vMin        = document.getElementById('vMin')       as HTMLInputElement;
const vMax        = document.getElementById('vMax')       as HTMLInputElement;
const gammaHSV    = document.getElementById('gammaHSV')   as HTMLInputElement;
const satScaleVal = document.getElementById('satScaleVal')!;
const vMinVal     = document.getElementById('vMinVal')!;
const vMaxVal     = document.getElementById('vMaxVal')!;
const gammaHSVVal = document.getElementById('gammaHSVVal')!;

// RGB controls
const contrast    = document.getElementById('contrast')   as HTMLInputElement;
const brightOff   = document.getElementById('brightOff')  as HTMLInputElement;
const gammaRGB    = document.getElementById('gammaRGB')   as HTMLInputElement;
const contrastVal = document.getElementById('contrastVal')!;
const brightOffVal= document.getElementById('brightOffVal')!;
const gammaRGBVal = document.getElementById('gammaRGBVal')!;

// 現在の選択モード
let mode: 'HSV'|'RGB' = 'HSV';

// イメージ読み込み
let originalImage: HTMLImageElement;

// デフォルト値の定義
const DEFAULT_VALUES = {
  HSV: {
    satScale: 0.7,
    vMin: 0.05,
    vMax: 0.90,
    gammaHSV: 1.1
  },
  RGB: {
    contrast: 0.8,
    brightOff: 0.0,
    gammaRGB: 1.1
  }
};

// ファイル入力からの読み込み処理
function loadImageFromFile(file: File) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  originalImage = new Image();
  originalImage.onload = () => {
    canvasIn.width  = originalImage.width;
    canvasIn.height = originalImage.height;
    canvasOut.width  = originalImage.width;
    canvasOut.height = originalImage.height;
    ctxIn.drawImage(originalImage, 0, 0);
    applyFilter();
  };
  originalImage.src = url;
}

// ドラッグ＆ドロップ関連のイベントハンドラ
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('image/')) {
      loadImageFromFile(file);
    }
  }
});

// ダウンロードボタン処理
downloadBtn.addEventListener('click', (e) => {
  if (!originalImage) return;
  
  // キャンバスから画像データを取得
  const dataURL = canvasOut.toDataURL('image/png');
  downloadBtn.href = dataURL;
});

// モード切替
modeRadios.forEach(r => {
  r.addEventListener('change', () => {
    if (r.checked) {
      mode = r.value as any;
      hsvGroup.style.display = mode === 'HSV' ? 'block' : 'none';
      rgbGroup.style.display = mode === 'RGB' ? 'block' : 'none';
      applyFilter();
    }
  });
});

// スライダー変更時の即時再描画とデバウンス処理
let debounceTimer: number | null = null;
[satScale,vMin,vMax,gammaHSV,contrast,brightOff,gammaRGB].forEach(slider => {
  slider.addEventListener('input', () => {
    // 値表示更新
    switch (slider.id) {
      case 'satScale': satScaleVal.textContent = slider.value; break;
      case 'vMin':     vMinVal.textContent     = slider.value; break;
      case 'vMax':     vMaxVal.textContent     = slider.value; break;
      case 'gammaHSV': gammaHSVVal.textContent = slider.value; break;
      case 'contrast': contrastVal.textContent = slider.value; break;
      case 'brightOff': brightOffVal.textContent = slider.value; break;
      case 'gammaRGB': gammaRGBVal.textContent = slider.value; break;
    }
    
    // ローディング表示
    loader.style.display = 'block';
    
    // 即時フィルタ適用のためのデバウンス処理
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
    }
    
    debounceTimer = window.setTimeout(() => {
      applyFilter();
      debounceTimer = null;
    }, 10); // 10ミリ秒のデバウンス（ほぼ即時だが、連続入力時に過剰な処理を防ぐ）
  });
});

// リセットボタンのイベントハンドラ
resetHSVBtn.addEventListener('click', () => {
  // HSVパラメータを初期値に戻す
  satScale.value = DEFAULT_VALUES.HSV.satScale.toString();
  vMin.value = DEFAULT_VALUES.HSV.vMin.toString();
  vMax.value = DEFAULT_VALUES.HSV.vMax.toString();
  gammaHSV.value = DEFAULT_VALUES.HSV.gammaHSV.toString();
  
  // 値表示の更新
  satScaleVal.textContent = satScale.value;
  vMinVal.textContent = vMin.value;
  vMaxVal.textContent = vMax.value;
  gammaHSVVal.textContent = gammaHSV.value;
  
  // フィルタを再適用
  applyFilter();
});

resetRGBBtn.addEventListener('click', () => {
  // RGBパラメータを初期値に戻す
  contrast.value = DEFAULT_VALUES.RGB.contrast.toString();
  brightOff.value = DEFAULT_VALUES.RGB.brightOff.toString();
  gammaRGB.value = DEFAULT_VALUES.RGB.gammaRGB.toString();
  
  // 値表示の更新
  contrastVal.textContent = contrast.value;
  brightOffVal.textContent = brightOff.value;
  gammaRGBVal.textContent = gammaRGB.value;
  
  // フィルタを再適用
  applyFilter();
});

// フィルタ適用
function applyFilter() {
  if (!originalImage) return;
  
  // 処理開始時にローダーを表示
  loader.style.display = 'block';
  
  // 少し遅延を入れて非同期処理に
  setTimeout(() => {
    // 元データ取得
    ctxIn.drawImage(originalImage, 0, 0);
    const imgData = ctxIn.getImageData(0,0,canvasIn.width,canvasIn.height);
    const outData = ctxOut.createImageData(imgData);

    const w = imgData.width, h = imgData.height;
    const inBuf  = imgData.data;
    const outBuf = outData.data;

    // パラメータ取得
    const a    = parseFloat(satScale.value);
    const Bmin = parseFloat(vMin.value);
    const Bmax = parseFloat(vMax.value);
    const gHSV = parseFloat(gammaHSV.value);
    const k    = parseFloat(contrast.value);
    const o    = parseFloat(brightOff.value);
    const gRGB = parseFloat(gammaRGB.value);

    // RGB→HSV / HSV→RGB helper
    function rgb2hsv(r:number,g:number,b:number) {
      r/=255; g/=255; b/=255;
      const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
      const d = mx - mn;
      let h=0, s = mx? d/mx:0, v=mx;
      if (d) {
        if (mx===r) h = ((g-b)/d + (g<b?6:0));
        else if (mx===g) h = ((b-r)/d + 2);
        else h = ((r-g)/d + 4);
        h /= 6;
      }
      return [h,s,v];
    }
    function hsv2rgb(h:number,s:number,v:number) {
      let r=0,g=0,b=0;
      const i = Math.floor(h*6);
      const f = h*6 - i;
      const p = v*(1-s);
      const q = v*(1-f*s);
      const t = v*(1-(1-f)*s);
      switch (i%6) {
        case 0: r=v;g=t;b=p; break;
        case 1: r=q;g=v;b=p; break;
        case 2: r=p;g=v;b=t; break;
        case 3: r=p;g=q;b=v; break;
        case 4: r=t;g=p;b=v; break;
        case 5: r=v;g=p;b=q; break;
      }
      return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
    }

    // ピクセルごとに変換
    for (let i=0; i<w*h; i++) {
      const idx = i*4;
      const r = inBuf[idx], g = inBuf[idx+1], b = inBuf[idx+2];
      if (mode === 'HSV') {
        let [h,s,v] = rgb2hsv(r,g,b);
        // S' = clamp(a*S)
        s = Math.min(1, Math.max(0, a*s));
        // V のクランプ→正規化→γ→再スケール
        v = Math.min(Bmax, Math.max(Bmin, v));
        let vn = (v - Bmin)/Math.max(Bmax-Bmin,1e-6);
        vn = Math.pow(vn, gHSV);
        v = Bmin + (Bmax-Bmin)*vn;
        const [r2,g2,b2] = hsv2rgb(h,s,v);
        outBuf[idx]   = r2;
        outBuf[idx+1] = g2;
        outBuf[idx+2] = b2;
        outBuf[idx+3] = inBuf[idx+3];
      } else {
        // RGB モード
        let rr = (r/255 - 0.5)*k + 0.5 + o;
        let gg = (g/255 - 0.5)*k + 0.5 + o;
        let bb = (b/255 - 0.5)*k + 0.5 + o;
        rr = Math.min(1,Math.max(0,rr)); rr = Math.pow(rr, gRGB);
        gg = Math.min(1,Math.max(0,gg)); gg = Math.pow(gg, gRGB);
        bb = Math.min(1,Math.max(0,bb)); bb = Math.pow(bb, gRGB);
        outBuf[idx]   = Math.round(rr*255);
        outBuf[idx+1] = Math.round(gg*255);
        outBuf[idx+2] = Math.round(bb*255);
        outBuf[idx+3] = inBuf[idx+3];
      }
    }

    ctxOut.putImageData(outData, 0, 0);
    
    // ダウンロードボタンのURLを更新
    const dataURL = canvasOut.toDataURL('image/png');
    downloadBtn.href = dataURL;
    
    // 処理完了後にローダーを非表示
    loader.style.display = 'none';
  }, 10); // 10ミリ秒の遅延で非同期処理化
}
