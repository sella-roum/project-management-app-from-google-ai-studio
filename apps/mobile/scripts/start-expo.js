require("./stream-polyfill");

const { spawn } = require("child_process");

const expoBin = require.resolve("expo/bin/cli");
const args = process.argv.slice(2);

const child = spawn(process.execPath, [expoBin, "start", ...args], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
