import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

const processes = [
  {
    name: "api",
    command: "python",
    args: ["-m", "uvicorn", "app.main:app", "--reload", "--app-dir", "backend"],
  },
  {
    name: "web",
    command: isWindows ? "npm.cmd" : "npm",
    args: ["--prefix", "frontend", "run", "dev"],
  },
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with status ${code}`);
      process.exitCode = code;
    }
  });

  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  stopAll();
  process.exit();
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit();
});
