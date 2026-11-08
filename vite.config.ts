import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages ではリポジトリ名のサブパスで公開されるため、ビルド時に BASE_PATH で指定する
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
