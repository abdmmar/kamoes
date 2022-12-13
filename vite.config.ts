import path from 'path';
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  worker: {
    format: 'es',
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }, {find: 'react', replacement: 'preact/compat'}, {find: 'react-dom', replacement: 'preact/compat'}],
  },
  plugins: [preact(), svgr({exportAsDefault: true, svgrOptions: {
    // Types are out of sync with package & docs
    // https://react-svgr.com/docs/options/#jsx-runtime-import-source
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jsxRuntimeImport: {
      importSource: 'preact',
      specifiers: ['h'],
    },
  },})],
})
