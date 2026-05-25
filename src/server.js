import dotenv from "dotenv";
import app from "./app.js";
import http from 'http';
import { WebSocketServer } from 'ws';
import notify from './utils/notify.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const WS_PATH = process.env.WS_PATH || '/ws';
const ALLOW_ROOT_COMPAT = process.env.WS_ALLOW_ROOT_COMPAT !== 'false';
const server = http.createServer(app);

// Attach WebSocket server and keep a canonical production path while remaining compatible with legacy root clients.
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'welcome', message: 'connected' }));
});

server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const isCanonicalPath = requestUrl.pathname === WS_PATH;
    const isLegacyRootPath = ALLOW_ROOT_COMPAT && requestUrl.pathname === '/';

    if (!isCanonicalPath && !isLegacyRootPath) {
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

notify.setWss(wss);

server.listen(PORT,"0.0.0.0", () => 
    console.log(`API running on port ${PORT} with WebSocket path ${WS_PATH}`)
);