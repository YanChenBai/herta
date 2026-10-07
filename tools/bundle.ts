import { build } from "vite-plus";
import { join } from "node:path";
import { root } from "./environment";

async function main() {
  const platform = process.argv[2] ?? "android";
  if (platform !== "android" && platform !== "ios") throw new Error("平台必须是 android 或 ios");
  process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ [platform]: true });
  // 当前 NativeScript Vite 的生产解析器仍从 argv 读取平台标记。
  process.argv.push("--", `--env.${platform}`);
  await build({ configFile: join(root, "nativescript.vite.config.ts"), mode: "production" });
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
