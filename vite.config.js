import { defineConfig } from 'vite';
import resolve from 'vite-plugin-resolve';

export default defineConfig({
  plugins: [
    resolve({
      'three/examples/jsm/webxr/XRWebGLBinding.js': 'three/examples/jsm/webxr/XRWebGLBinding.js',
    }),
  ],
});