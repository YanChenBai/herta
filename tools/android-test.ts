import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { root, nativeEnvironment } from "./environment";

const result = spawnSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  ["connectedDebugAndroidTest", "--console=plain", "--quiet"],
  {
    cwd: join(root, "platforms/android"),
    env: nativeEnvironment(),
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
