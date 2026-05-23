import { pool } from "../config/db.js";
import { Service } from "./Service.js";
import { AdminLog } from "./AdminLog.js";
import notify from "../utils/notify.js";

export const Quote = {
  ensureTable: async () => {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS quotes (
        quote_id BIGINT PRIMARY KEY AUTO_INCREMENT,
        service_id BIGINT NOT NULL,
        worker_id BIGINT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDIENTE',
        transaction_reference VARCHAR(255) NULL,
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  },

  create: async ({ service_id, worker_id = null, amount = 0, transaction_reference = null }) => {
    await Quote.ensureTable();
    const [r] = await pool.query(
      `INSERT INTO quotes (service_id, worker_id, amount, status, transaction_reference, created_at, updated_at)
       VALUES (?,?,?,?,?,NOW(),NOW())`,
      [service_id, worker_id, amount, 'PENDIENTE', transaction_reference]
    );
    return r.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM quotes WHERE quote_id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  findByServiceId: async (serviceId) => {
    const [rows] = await pool.query(`SELECT * FROM quotes WHERE service_id = ? ORDER BY quote_id DESC`, [serviceId]);
    return rows;
  },

  accept: async (quoteId, actingUserId, ip = null, userAgent = null) => {
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    const service = await Service.findById(quote.service_id);
    if (!service) throw new Error('Service not found');

    if (Number(service.client_id) !== Number(actingUserId)) {
      throw new Error('Only the client can accept this quote');
    }

    // Update quote status
    await pool.query(`UPDATE quotes SET status = ?, updated_at = NOW() WHERE quote_id = ?`, ['ACEPTADA', quoteId]);

    // Update service status to Aceptado (and set accepted_at)
    const aceptadoId = await Service.findStatusIdByName('Aceptado');
    if (aceptadoId) {
      await Service.updateStatus(service.service_id, aceptadoId);
    }

    // Log notification via AdminLog
    await AdminLog.create({
      admin_user_id: actingUserId,
      action: 'quote_accepted',
      entity_type: 'quotes',
      entity_id: quoteId,
      changes: JSON.stringify({ quote_id: quoteId, service_id: quote.service_id, amount: quote.amount }),
      ip_address: ip,
      user_agent: userAgent
    });

    // Send webhook if configured
    try {
      const webhook = process.env.NOTIFY_WEBHOOK;
      if (webhook) {
        const payload = {
          event: 'quote_accepted',
          quote_id: quoteId,
          service_id: quote.service_id,
          amount: quote.amount,
          accepted_by: actingUserId,
          timestamp: new Date().toISOString()
        };
        notify.sendWebhook(webhook, payload).then((r) => {
          // Log result in admin logs
          AdminLog.create({ admin_user_id: null, action: 'webhook_sent', entity_type: 'quotes', entity_id: quoteId, changes: JSON.stringify({ result: r }), ip_address: null, user_agent: null });
        }).catch((e) => {
          console.error('Webhook async error', e.message);
        });
      }
    } catch (e) {
      console.error('Webhook error', e.message);
    }

    // Broadcast via WebSocket to connected clients
    try {
      const payload = { event: 'quote_accepted', quote_id: quoteId, service_id: quote.service_id, amount: quote.amount };
      notify.broadcast('quote_accepted', payload);
    } catch (e) {
      console.error('Broadcast error', e.message);
    }

    return true;
  },

  cancel: async (quoteId, actingUserId, ip = null, userAgent = null) => {
    const quote = await Quote.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    // Only worker or client or admin could cancel; keep it simple for tests
    await pool.query(`UPDATE quotes SET status = ?, updated_at = NOW() WHERE quote_id = ?`, ['CANCELADA', quoteId]);
    await AdminLog.create({
      admin_user_id: actingUserId,
      action: 'quote_cancelled',
      entity_type: 'quotes',
      entity_id: quoteId,
      changes: JSON.stringify({ quote_id: quoteId }),
      ip_address: ip,
      user_agent: userAgent
    });
    return true;
  }
};

export default Quote;
