import { pool } from "../src/config/db.js";
import { Service } from "../src/models/Service.js";
import { Worker } from "../src/models/Worker.js";
import { Quote } from "../src/models/Quote.js";
import { ServiceType } from "../src/models/ServiceType.js";
import { AdminLog } from "../src/models/AdminLog.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let ids = {};

async function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

async function setup() {
  const [countryResult] = await pool.query(`INSERT INTO countries (country_name) VALUES (?) ON DUPLICATE KEY UPDATE country_id=country_id`, ["Colombia"]);
  const [countries] = await pool.query(`SELECT country_id FROM countries WHERE country_name = 'Colombia' LIMIT 1`);
  ids.countryId = countries[0].country_id;

  const [stateResult] = await pool.query(`INSERT INTO states (country_id, state_name) VALUES (?, ?)`, [ids.countryId, `QState ${Date.now()}`]);
  ids.stateId = stateResult.insertId;
  const [cityResult] = await pool.query(`INSERT INTO cities (state_id, city_name) VALUES (?, ?)`, [ids.stateId, `QCity ${Date.now()}`]);
  ids.cityId = cityResult.insertId;
  const [postalResult] = await pool.query(`INSERT INTO postal_codes (city_id, postal_code) VALUES (?, ?)`, [ids.cityId, `54321`]);
  ids.postalCodeId = postalResult.insertId;

  const [addrRes] = await pool.query(`INSERT INTO addresses (postal_code_id, street_name, ext_number, int_number, phone_number, address_type, entity_type) VALUES (?,?,?,?,?,?,?)`, [ids.postalCodeId, 'Client Street', '1', null, '5551010101', 'Residencial', 'Casa']);
  ids.clientAddr = addrRes.insertId;

  const [u] = await pool.query(`INSERT INTO users (name, lastname, email, password, user_type_id, is_active, address_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, ['QClient','Test',`qclient${Date.now()}@example.com`,'pwd',1,1,ids.clientAddr, '2020-01-01', '2020-01-01']);
  ids.clientId = u.insertId;

  // Service type
  const [stypes] = await pool.query(`SELECT service_type_id FROM service_types LIMIT 1`);
  if (!stypes.length) throw new Error('No service_type');
  ids.serviceTypeId = stypes[0].service_type_id;

  // Create service
  ids.serviceId = await Service.create({ service_type_id: ids.serviceTypeId, client_id: ids.clientId, worker_id: null, address_id: ids.clientAddr, description: 'Quote flow service', status_id: 1 });

  // Create worker and address
  const [waddr] = await pool.query(`INSERT INTO addresses (postal_code_id, street_name, ext_number, int_number, phone_number, address_type, entity_type) VALUES (?,?,?,?,?,?,?)`, [ids.postalCodeId, 'Worker Road', '9', null, '5552020202', 'Residencial', 'Casa']);
  ids.workerAddr = waddr.insertId;
  ids.workerId = await Worker.create({ name: 'QWorker', lastname: 'Test', email: `qworker${Date.now()}@example.com`, password: null, bio: null, hourly_rate: null, experience_years: null, is_verified: false, address_id: ids.workerAddr });

  // Assign worker to service
  await Service.update(ids.serviceId, { worker_id: ids.workerId, status_id: 2 });

  return ids;
}

async function run() {
  try {
    log('Setup DB entries');
    await setup();

    log('Worker creates a quote');
    const quoteId = await Quote.create({ service_id: ids.serviceId, worker_id: ids.workerId, amount: 12345 });
    log(`Quote created: ${quoteId}`);

    // Ensure quote exists
    const q = await Quote.findById(quoteId);
    if (!q) throw new Error('Quote not found after create');

    const serviceBeforeAccept = await Service.findById(ids.serviceId);
    if (!serviceBeforeAccept.latest_quote || Number(serviceBeforeAccept.latest_quote.quote_id) !== Number(quoteId)) {
      throw new Error('Service detail does not expose latest_quote');
    }
    if (serviceBeforeAccept.latest_quote.status !== 'PENDIENTE') {
      throw new Error('latest_quote should start as PENDIENTE');
    }
    if (Number(serviceBeforeAccept.amount) !== 12345) {
      throw new Error('Service amount alias should expose quote amount');
    }

    log('Client accepts the quote');
    await Quote.accept(quoteId, ids.clientId);
    await sleep(300);

    // Check service accepted_at timestamp
    const svc = await Service.findById(ids.serviceId);
    if (!svc.accepted_at) throw new Error('Service accepted_at not set');
    log(`Service accepted_at: ${svc.accepted_at}`);
    if (!svc.latest_quote || svc.latest_quote.status !== 'ACEPTADA') {
      throw new Error('latest_quote not updated to ACEPTADA');
    }
    if (Number(svc.amount) !== 12345) {
      throw new Error('Service amount alias should remain available after acceptance');
    }

    // Check AdminLog for quote_accepted
    const logs = await AdminLog.findAll();
    const found = logs.find(l => l.action === 'quote_accepted' && Number(l.entity_id) === Number(quoteId));
    if (!found) throw new Error('No admin log for quote_accepted');
    log('AdminLog recorded quote_accepted');

    // Verify worker sees client address in service details
    const workerView = (await Service.findByWorker(ids.workerId)).find(s => s.service_id === ids.serviceId);
    if (!workerView || !workerView.client_address) throw new Error('Worker cannot see client_address');
    log('Worker can see client address in details');

    if (!Array.isArray(await Quote.findByServiceId(ids.serviceId))) {
      throw new Error('GET quotes by service contract would fail');
    }

    console.log('ALL OK');

    // Cleanup
    await pool.query('DELETE FROM admin_logs WHERE action IN (?)', [['quote_accepted', 'quote_cancelled']]);
    await pool.query('DELETE FROM quotes WHERE service_id = ?', [ids.serviceId]);
    await pool.query('DELETE FROM payments WHERE service_id = ?', [ids.serviceId]);
    await pool.query('DELETE FROM services WHERE service_id = ?', [ids.serviceId]);
    await pool.query('DELETE FROM workers WHERE worker_id = ?', [ids.workerId]);
    await pool.query('DELETE FROM users WHERE user_id = ?', [ids.clientId]);
    await pool.query('DELETE FROM addresses WHERE address_id IN (?,?)', [ids.clientAddr, ids.workerAddr]);
    await pool.query('DELETE FROM postal_codes WHERE postal_code_id = ?', [ids.postalCodeId]);
    await pool.query('DELETE FROM cities WHERE city_id = ?', [ids.cityId]);
    await pool.query('DELETE FROM states WHERE state_id = ?', [ids.stateId]);

    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
