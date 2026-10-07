import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function nativeEnvironment() {
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/token|secret|password|api.?key|auth/i.test(key),
    ),
  );
  const sdk =
    process.env.ANDROID_HOME ??
    process.env.ANDROID_SDK_ROOT ??
    (process.platform === "win32"
      ? join(homedir(), "AppData", "Local", "Android", "Sdk")
      : process.platform === "darwin"
        ? join(homedir(), "Library", "Android", "sdk")
        : join(homedir(), "Android", "Sdk"));
  if (existsSync(sdk)) {
    environment.ANDROID_HOME = sdk;
    environment.ANDROID_SDK_ROOT = sdk;
  }
  if (!environment.JAVA_HOME && process.platform === "win32") {
    const result = spawnSync("where.exe", ["java"], { encoding: "utf8" });
    const executable = result.stdout?.trim().split(/\r?\n/)[0];
    if (executable) environment.JAVA_HOME = dirname(dirname(executable));
  }
  return environment;
}
