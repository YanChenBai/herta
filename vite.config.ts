import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["**/node_modules/**"],
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
  run: {
    tasks: {
      typecheck: { command: "vue-tsc --noEmit", cache: false },
      ready: {
        command: ["vp check", "vp run typecheck", "vp test", "vp run bundle:android"],
        cache: false,
      },
      "bundle:android": { command: "oxnode tools/bundle.ts android", cache: false },
      "build:android": { command: "oxnode tools/nativescript.ts build android", cache: false },
      "test:android": {
        command: "oxnode tools/android-test.ts",
        dependsOn: ["build:android"],
        cache: false,
      },
      android: { command: "oxnode tools/nativescript.ts debug android", cache: false },
      "doctor:android": { command: "oxnode tools/nativescript.ts doctor android", cache: false },
      ios: { command: "oxnode tools/nativescript.ts debug ios", cache: false },
      "build:ios": { command: "oxnode tools/nativescript.ts build ios", cache: false },
    },
  },
});
