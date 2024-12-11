import { defineConfig,presetUno } from 'unocss';
import extractorPug from '@unocss/extractor-pug'
// import presetWind from '@unocss/preset-wind'
export default defineConfig({
  presets: [presetUno()],
  extractors: [
    extractorPug(),
  ],
});