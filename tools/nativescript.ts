import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { root, nativeEnvironment } from "./environment";

// 参考 robin/tools：直接运行本项目 CLI，避免 Windows shell 转义和全局版本差异。
const require = createRequire(resolve(root, "package.json"));
const manifest = require("nativescript/package.json") as { bin: { ns: string } };
const cli = resolve(dirname(require.resolve("nativescript/package.json")), manifest.bin.ns);
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: nativeEnvironment(),
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
