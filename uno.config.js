import { defineConfig, presetUno } from 'unocss';
import extractorPug from '@unocss/extractor-pug'
import presetAttr from '@unocss/preset-attributify'
// import presetWind from '@unocss/preset-wind'
export default defineConfig({
  presets: [presetUno(), presetAttr({
    prefix: 'un-',
  })],
  extractors: [
    extractorPug(),
  ],
});