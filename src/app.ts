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
// 数式表示エリア
const formulaArea = document.getElementById('formulaArea')!;

function updateFormula() {
  // HTML形式で数式を直接構築する（KaTeX使用なし）
  if (mode === 'HSV') {
    // HSV数式
    const a = satScale.value;
    const Bmin = vMin.value;
    const Bmax = vMax.value;
    const gamma = gammaHSV.value;
    
    formulaArea.innerHTML = `
      <h3 style="margin-top:0">HSB（HSV）空間での変換式</h3>
      <div style="font-family: 'Noto Sans JP', sans-serif; line-height: 2; font-size: 1.1rem;">
        <div>H' = H （色相はそのまま）</div>
        <div>S' = clamp(<span style="background-color:#e3f6f5;padding:2px 5px;border-radius:3px;">${a}</span> × S, 0, 1)</div>
        <div>B<sub>1</sub> = clamp(B, <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${Bmin}</span>, <span style="background-color:#e3eefa;padding:2px 5px;border-radius:3px;">${Bmax}</span>)</div>
        <div>B<sub>2</sub> = ((B<sub>1</sub> - <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${Bmin}</span>) / (<span style="background-color:#e3eefa;padding:2px 5px;border-radius:3px;">${Bmax}</span> - <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${Bmin}</span>))<sup><span style="background-color:#e3eee6;padding:2px 5px;border-radius:3px;">${gamma}</span></sup></div>
        <div>B' = <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${Bmin}</span> + (<span style="background-color:#e3eefa;padding:2px 5px;border-radius:3px;">${Bmax}</span> - <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${Bmin}</span>) × B<sub>2</sub></div>        <div style="margin-top:1em; display:flex; flex-wrap:wrap; gap:10px; font-size:0.95rem; color:#333;">
          <div><span style="background-color:#e3f6f5;padding:2px 5px;border-radius:3px;">a</span>: 飽和度スケール</div>
          <div><span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">B<sub>min</sub></span>: 明るさ下限</div>
          <div><span style="background-color:#e3eefa;padding:2px 5px;border-radius:3px;">B<sub>max</sub></span>: 明るさ上限</div>
          <div><span style="background-color:#e3eee6;padding:2px 5px;border-radius:3px;">γ</span>: ガンマ</div>
          <div><span style="background-color:#f2f2f2;padding:2px 5px;border-radius:3px;">H,S,B</span>: 色相, 彩度, 明度</div>
        </div>
      </div>
    `;
  } else {
    // RGB数式
    const k = contrast.value;
    const o = brightOff.value;
    const gamma = gammaRGB.value;
    
    formulaArea.innerHTML = `      <h3 style="margin-top:0">RGB空間での変換式</h3>
      <div style="font-family: 'Noto Sans JP', sans-serif; line-height: 2; font-size: 1.1rem;">
        <div>C' = clamp(((C - 0.5) × <span style="background-color:#e3f6f5;padding:2px 5px;border-radius:3px;">${k}</span> + 0.5 + <span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">${o}</span>), 0, 1)<sup><span style="background-color:#e3eee6;padding:2px 5px;border-radius:3px;">${gamma}</span></sup></div>
        <div style="margin-top:1em; display:flex; flex-wrap:wrap; gap:10px; font-size:0.95rem; color:#333;">
          <div><span style="background-color:#e3f6f5;padding:2px 5px;border-radius:3px;">k</span>: コントラスト</div>
          <div><span style="background-color:#ffeded;padding:2px 5px;border-radius:3px;">o</span>: 明るさオフセット</div>
          <div><span style="background-color:#e3eee6;padding:2px 5px;border-radius:3px;">γ</span>: ガンマ</div>
          <div><span style="background-color:#f2f2f2;padding:2px 5px;border-radius:3px;">C</span>: 各色成分（R, G, B値）</div>
        </div>
      </div>    `;
  }
}

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
    // キャンバスサイズを画像サイズに合わせる
    const width = originalImage.width;
    const height = originalImage.height;
    
    // 両方のキャンバスに同じサイズを設定
    canvasIn.width = width;
    canvasIn.height = height;
    canvasOut.width = width;
    canvasOut.height = height;

    // サイズが同じになるよう調整
    const aspectRatio = width / height;
    
    // スタイル属性の設定を省略（CSSで制御）
    
    // dropzoneメッセージを非表示に
    const dropzoneMessage = document.querySelector('.dropzone-message');
    if (dropzoneMessage) {
      (dropzoneMessage as HTMLElement).style.display = 'none';
    }
    
    // 画像を描画
    ctxIn.drawImage(originalImage, 0, 0, width, height);
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
      updateFormula();
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
    updateFormula();
    // ローディング表示
    loader.style.display = 'block';
    // 即時フィルタ適用のためのデバウンス処理
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      applyFilter();
      debounceTimer = null;
    }, 10);
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
  updateFormula();
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
  updateFormula();
  // フィルタを再適用
  applyFilter();
});

// Web Workerの初期化
let filterWorker: Worker | null = null;
if (window.Worker) {
  filterWorker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

// 初期表示
// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  // すぐに数式を表示
  updateFormula();
});

// フィルタ適用
function applyFilter() {
  if (!originalImage || !filterWorker) return;

  loader.style.display = 'block';
  ctxIn.drawImage(originalImage, 0, 0, canvasIn.width, canvasIn.height);
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
    
    // キャンバスの描画領域が同じになるように明示的に再描画
    const width = canvasIn.width;
    const height = canvasIn.height;
    const tempData = ctxOut.getImageData(0, 0, width, height);
    ctxOut.canvas.width = width;
    ctxOut.canvas.height = height;
    ctxOut.putImageData(tempData, 0, 0);
    
    // ダウンロードボタンのURLを更新
    const dataURL = canvasOut.toDataURL('image/png');
    downloadBtn.href = dataURL;
    loader.style.display = 'none';
  };
}
