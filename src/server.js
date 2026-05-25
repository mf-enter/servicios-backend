import dotenv from "dotenv";
import app from "./app.js";
import http from 'http';
import { WebSocketServer } from 'ws';
import notify from './utils/notify.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach WebSocket server
const wss = new WebSocketServer({ 
    server,
    path: "/ws" 
});
wss.on('connection', (ws) => {
	ws.send(JSON.stringify({ event: 'welcome', message: 'connected' }));
});

notify.setWss(wss);

server.listen(PORT,"0.0.0.0", () => 
    console.log(`API running on port ${PORT}`)
);