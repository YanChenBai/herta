import { defineConfig } from "vite-plus";
import { vueConfig } from "@nativescript/vite/vue";

export default defineConfig(({ mode }) => vueConfig({ mode }));
