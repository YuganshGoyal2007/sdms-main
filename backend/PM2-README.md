# PM2 Quick Start

## First-time setup
```powershell
cd backend
npm install
```

## Run in production (recommended)
```powershell
npm run pm2:start      # starts with PM2, auto-restart on crash
npm run pm2:logs       # tail all logs
npm run pm2:status     # see running processes
npm run pm2:restart    # manual restart
npm run pm2:stop       # stop without removing
npm run pm2:delete     # remove from PM2
```

`npm start` (without `pm2:`) runs `pm2-runtime` — used in Docker / when you want PM2 to be the parent of the Node process.

## Run in dev (nodemon, no auto-restart)
```powershell
npm run start:dev
```

## Where logs go
| File | Contents |
|---|---|
| `logs/output.log` | All app-level logs (info/warn/error/fatal) — request logs, startup, DB events. |
| `logs/error.log` | Only `error` and `fatal` levels — duplicates of `output.log` for errors. |
| `logs/output-pm2.log` | Raw stdout from PM2 (stdout from Node process). |
| `logs/error-pm2.log` | Raw stderr from PM2. |

Logs rotate daily + at 10MB, kept up to 50MB total per file.

## First-run check
1. `npm run pm2:start`
2. `curl http://localhost:5000/health` should return `{ "success": true, "status": "ok", ... }`
3. `npm run pm2:logs` should show startup banner and the `/health` request
