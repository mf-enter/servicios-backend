let wssInstance = null;

export function setWss(wss) {
  wssInstance = wss;
}

async function getFetch() {
  if (typeof fetch === 'function') return fetch.bind(globalThis);
  try {
    const m = await import('node-fetch');
    return m.default;
  } catch (e) {
    return null;
  }
}

export async function sendWebhook(url, payload) {
  if (!url) return null;
  try {
    const f = await getFetch();
    if (!f) throw new Error('fetch not available');
    const res = await f(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (err) {
    console.error('Webhook send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

export function broadcast(event, payload) {
  if (!wssInstance) return 0;
  const message = JSON.stringify({ event, payload });
  let count = 0;
  wssInstance.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
      count++;
    }
  });
  return count;
}

export default { setWss, sendWebhook, broadcast };
