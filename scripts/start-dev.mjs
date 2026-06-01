import EmbeddedPostgres from "embedded-postgres";
import dotenv from "dotenv";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import net from "node:net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(root, ".env") });
const dataDir = path.join(root, ".data", "postgres");

const DATABASE_URL = "postgresql://postgres:nutricrew@127.0.0.1:5432/nutricrew";

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function removeStalePidFile() {
  const pidFile = path.join(dataDir, "postmaster.pid");
  if (!fs.existsSync(pidFile)) return;

  const pid = Number.parseInt(fs.readFileSync(pidFile, "utf8").split("\n")[0], 10);
  if (!Number.isFinite(pid)) {
    fs.unlinkSync(pidFile);
    return;
  }

  try {
    process.kill(pid, 0);
  } catch {
    fs.unlinkSync(pidFile);
    console.log("Removed stale postmaster.pid");
  }
}

async function ensureDatabase(pg) {
  try {
    await pg.createDatabase("nutricrew");
    console.log("Database 'nutricrew' created");
  } catch {
    /* already exists */
  }
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });

  let pg = null;

  if (await isPortOpen(5432)) {
    console.log("PostgreSQL already listening on port 5432 — skipping embedded start");
  } else {
    pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: "postgres",
      password: "nutricrew",
      port: 5432,
      persistent: true,
    });

    console.log("Starting embedded PostgreSQL on port 5432...");
    const freshCluster = !fs.existsSync(path.join(dataDir, "PG_VERSION"));
    if (freshCluster) {
      await pg.initialise();
    } else {
      removeStalePidFile();
    }
    await pg.start();
    await ensureDatabase(pg);
    console.log("PostgreSQL ready");
  }

  const child = spawn("npm run dev:apps", {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URL, NODE_ENV: "development" },
  });

  const shutdown = async (signal) => {
    console.log(`\nShutting down (${signal})...`);
    child.kill("SIGTERM");
    if (pg) await pg.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  child.on("exit", async (code) => {
    if (pg) await pg.stop();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
