import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import app from "../src/app.js";

const serverState = {
  server: null,
  baseUrl: null
};

const startServer = () => new Promise((resolve) => {
  const server = http.createServer(app);

  server.listen(0, "127.0.0.1", () => {
    const { port } = server.address();
    resolve({
      server,
      baseUrl: `http://127.0.0.1:${port}`
    });
  });
});

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${serverState.baseUrl}${path}`, options);
  const text = await response.text();

  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body };
};

before(async () => {
  const started = await startServer();
  serverState.server = started.server;
  serverState.baseUrl = started.baseUrl;
});

after(async () => {
  if (!serverState.server) return;
  await new Promise((resolve) => serverState.server.close(resolve));
});

test("GET /api/workers responde JSON", async () => {
  const { response, body } = await requestJson("/api/workers", {
    headers: { Origin: "https://frontend.example.com" }
  });

  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(response.ok, true);
  assert.equal(body.status, true);
  assert.equal(Array.isArray(body.data), true);
});

test("GET /api/service-types responde JSON", async () => {
  const { response, body } = await requestJson("/api/service-types", {
    headers: { Origin: "https://frontend.example.com" }
  });

  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(response.ok, true);
  assert.equal(body.status, true);
  assert.equal(Array.isArray(body.data), true);
});

test("POST /api/auth/login devuelve JSON de error controlado", async () => {
  const email = `missing-${Date.now()}@example.invalid`;
  const { response, body } = await requestJson("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://frontend.example.com"
    },
    body: JSON.stringify({ email, password: "wrong-password" })
  });

  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(body.status, false);
  assert.equal(typeof body.message, "string");
});

test("POST /api/login es compatible con /api/auth/login", async () => {
  const email = `missing-${Date.now()}@example.invalid`;
  const payload = {
    email,
    password: "wrong-password"
  };

  const canonical = await requestJson("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://frontend.example.com"
    },
    body: JSON.stringify(payload)
  });

  const alias = await requestJson("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://frontend.example.com"
    },
    body: JSON.stringify(payload)
  });

  assert.equal(canonical.response.status, alias.response.status);
  assert.deepEqual(alias.body, canonical.body);
});

test("GET /api/workers/profile responde 401 JSON sin token", async () => {
  const { response, body } = await requestJson("/api/workers/profile", {
    headers: { Origin: "https://frontend.example.com" }
  });

  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(response.status, 401);
  assert.equal(body.status, false);
  assert.equal(typeof body.message, "string");
});

test("OPTIONS preflight conserva CORS para login", async () => {
  const { response } = await requestJson("/api/login", {
    method: "OPTIONS",
    headers: {
      Origin: "https://frontend.example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type"
    }
  });

  assert.equal(response.headers.get("access-control-allow-origin"), "https://frontend.example.com");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});