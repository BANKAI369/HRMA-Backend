#!/usr/bin/env node
const cp = require('child_process');
const port = process.env.PORT || 4000;

function exec(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8' });
}

if (process.platform === 'win32') {
  try {
    const out = exec('netstat -ano');
    const lines = out.split(/\r?\n/);
    const pids = new Set();
    for (const l of lines) {
      if (l.includes(':' + port) && /\sLISTENING\s/.test(l)) {
        const parts = l.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== String(process.pid)) pids.add(pid);
      }
    }
    if (pids.size === 0) process.exit(0);
    for (const pid of pids) {
      try {
        exec(`taskkill /PID ${pid} /F`);
        console.log(`Killed PID ${pid} listening on port ${port}`);
      } catch (e) {
        console.error(`Failed to kill PID ${pid}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
} else {
  try {
    const out = exec(`lsof -i :${port} -t`);
    const pids = out.split(/\r?\n/).filter(Boolean);
    for (const pid of pids) {
      if (pid !== String(process.pid)) {
        try {
          process.kill(Number(pid), 'SIGKILL');
          console.log(`Killed PID ${pid} listening on port ${port}`);
        } catch (e) {
          console.error(`Failed to kill PID ${pid}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    // no process found
  }
}

process.exit(0);
