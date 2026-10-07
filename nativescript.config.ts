import type { NativeScriptConfig } from "@nativescript/core";

export default {
  id: "app.viyuni.herta",
  appPath: "src",
  appResourcesPath: "App_Resources",
  bundler: "vite",
  bundlerConfigPath: "nativescript.vite.config.ts",
  cli: { packageManager: "pnpm" },
  android: { v8Flags: "--expose_gc", markingMode: "none" },
} satisfies NativeScriptConfig;
