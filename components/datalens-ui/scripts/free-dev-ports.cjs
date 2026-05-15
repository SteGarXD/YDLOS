/**
 * Перед `app-builder dev` освобождает порты локального dev UI и API (Windows)
 * и удаляет старый client.sock, чтобы не было EADDRINUSE и мусора от прошлого запуска.
 */
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const PORTS = process.platform === 'win32' ? [13031, 14040, 3030, 3031, 3040] : [3030, 3031];

function killListenersWin32(port) {
    try {
        const out = execSync(`netstat -ano`, {encoding: 'utf8'});
        const pids = new Set();
        for (const line of out.split(/\r?\n/)) {
            if (!line.includes(`:${port}`) || !line.includes('LISTENING')) {
                continue;
            }
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (/^\d+$/.test(pid)) {
                pids.add(pid);
            }
        }
        for (const pid of pids) {
            try {
                execSync(`taskkill /PID ${pid} /F`, {stdio: 'ignore'});
                // eslint-disable-next-line no-console
                console.log(`[free-dev-ports] freed port ${port}: stopped PID ${pid}`);
            } catch {
                /* ignore */
            }
        }
    } catch {
        /* netstat failed or no listeners */
    }
}

function main() {
    if (process.platform === 'win32') {
        for (const p of PORTS) {
            killListenersWin32(p);
        }
    }
    const sockInProject = path.join(__dirname, '..', 'dist', 'run', 'client.sock');
    try {
        if (fs.existsSync(sockInProject)) {
            fs.unlinkSync(sockInProject);
        }
    } catch {
        /* ignore */
    }
    const tmpSock = path.join(require('os').tmpdir(), 'datalens-ui-dev-client.sock');
    try {
        if (fs.existsSync(tmpSock)) {
            fs.unlinkSync(tmpSock);
        }
    } catch {
        /* ignore */
    }
}

main();
