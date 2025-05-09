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

// Web Workerの初期化
let filterWorker: Worker | null = null;
if (window.Worker) {
  filterWorker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

// フィルタ適用
function applyFilter() {
  if (!originalImage || !filterWorker) return;

  loader.style.display = 'block';
  ctxIn.drawImage(originalImage, 0, 0);
  const imgData = ctxIn.getImageData(0, 0, canvasIn.width, canvasIn.height);

  // パラメータ取得
  const params = {
    mode,
    satScale: parseFloat(satScale.value),
    vMin: parseFloat(vMin.value),
    vMax: parseFloat(vMax.value),
    gammaHSV: parseFloat(gammaHSV.value),
    contrast: parseFloat(contrast.value),
    brightOff: parseFloat(brightOff.value),
    gammaRGB: parseFloat(gammaRGB.value)
  };

  // Workerに画像データとパラメータを送信
  filterWorker.postMessage({ imageData: imgData, params });
}

// Workerからのメッセージ受信
if (filterWorker) {
  filterWorker.onmessage = function (e) {
    const { imageData } = e.data;
    ctxOut.putImageData(imageData, 0, 0);
    // ダウンロードボタンのURLを更新
    const dataURL = canvasOut.toDataURL('image/png');
    downloadBtn.href = dataURL;
    loader.style.display = 'none';
  };
}
