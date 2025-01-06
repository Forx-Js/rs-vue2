import { defineConfig } from "@rsbuild/core";
import { pluginVue2 } from "@rsbuild/plugin-vue2";
import { pluginPug } from "@rsbuild/plugin-pug";
import { pluginSass } from "@rsbuild/plugin-sass";
export default defineConfig({
  plugins: [pluginSass(), pluginPug(), pluginVue2()],
  source: {
    tsconfigPath: "./jsconfig.json",
  },
  server: {
    proxy: [
      {
        context: ["/kk"],
        target: "http://localhost:8012",
        changeOrigin: true,
      },
    ],
  },
});
