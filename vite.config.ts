import * as vite from 'vite';

export default vite.defineConfig({
  // ルートディレクトリを指定
  root: '.',
  
  // 開発サーバーの設定
  server: {
    port: 3000,
    open: true
  },
  
  // ビルド設定
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  
  // プロジェクトのルート構造を維持する
  publicDir: 'public',
  
  // TypeScriptのサポート
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
});
