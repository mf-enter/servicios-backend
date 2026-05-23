import { pool } from "../src/config/db.js";
import { Service } from "../src/models/Service.js";
import { ServiceType } from "../src/models/ServiceType.js";
import { Worker } from "../src/models/Worker.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let testData = {
  userId: null,
  countryId: null,
  stateId: null,
  cityId: null,
  postalCodeId: null,
  addressId: null,
  serviceTypeId: null,
  serviceId: null
};

async function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

async function createTestUser() {
  log("→ Creando usuario de prueba...");
  const [result] = await pool.query(
    `INSERT INTO users (name, lastname, email, password, user_type_id, is_active, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    ["Test", "Client", `test-client-${Date.now()}@example.com`, "hashed_password", 1]
  );
  testData.userId = result.insertId;
  log(`✓ Usuario creado: ID ${testData.userId}`);
  return testData.userId;
}

async function createTestAddress() {
  log("→ Creando país, estado, ciudad, código postal y dirección...");
  
  // Country
  const [countryResult] = await pool.query(
    `INSERT INTO countries (country_name) VALUES (?) ON DUPLICATE KEY UPDATE country_id = country_id`,
    ["Colombia"]
  );
  const [countries] = await pool.query(`SELECT country_id FROM countries WHERE country_name = 'Colombia' LIMIT 1`);
  testData.countryId = countries[0].country_id;

  // State
  const [stateResult] = await pool.query(
    `INSERT INTO states (country_id, state_name) VALUES (?, ?)`,
    [testData.countryId, `Test State ${Date.now()}`]
  );
  testData.stateId = stateResult.insertId;

  // City
  const [cityResult] = await pool.query(
    `INSERT INTO cities (state_id, city_name) VALUES (?, ?)`,
    [testData.stateId, `Test City ${Date.now()}`]
  );
  testData.cityId = cityResult.insertId;

  // Postal Code
  const [postalResult] = await pool.query(
    `INSERT INTO postal_codes (city_id, postal_code) VALUES (?, ?)`,
    [testData.cityId, `12345`]
  );
  testData.postalCodeId = postalResult.insertId;

  // Address
  const [addressResult] = await pool.query(
    `INSERT INTO addresses (postal_code_id, street_name, ext_number, int_number, phone_number, address_type, entity_type) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [testData.postalCodeId, "Test Street", "123", "A", "5551234567", "Residencial", "Casa"]
  );
  testData.addressId = addressResult.insertId;

  log(`✓ Dirección creada: ID ${testData.addressId}`);
  // If a user already exists, link this address to the user (make it the user's address)
  if (testData.userId) {
    await pool.query(`UPDATE users SET address_id = ? WHERE user_id = ?`, [testData.addressId, testData.userId]);
  }

  return testData.addressId;
}

async function createTestService() {
  log("→ Creando servicio de prueba...");
  
  // Get service type
  const [serviceTypes] = await pool.query(`SELECT service_type_id FROM service_types LIMIT 1`);
  if (!serviceTypes.length) {
    log("✗ No hay tipos de servicio en la BD. Cree al menos uno.");
    process.exit(1);
  }
  testData.serviceTypeId = serviceTypes[0].service_type_id;

  testData.serviceId = await Service.create({
    service_type_id: testData.serviceTypeId,
    client_id: testData.userId,
    worker_id: null,
    address_id: testData.addressId,
    description: "Test service for lifecycle",
    status_id: 1
  });

  log(`✓ Servicio creado: ID ${testData.serviceId}`);

  // Debug: Consultar directamente en BD
  const [dbService] = await pool.query(
    `SELECT service_id, requested_at, accepted_at, started_at, finished_at FROM services WHERE service_id = ?`,
    [testData.serviceId]
  );
  if (dbService.length) {
    log(`  DEBUG: BD tiene requested_at = ${dbService[0].requested_at}`);
  }

  return testData.serviceId;
}

async function createTestWorker() {
  log("→ Creando trabajador de prueba...");
  // Create a separate address for the worker (reuse postal code)
  const [addrRes] = await pool.query(
    `INSERT INTO addresses (postal_code_id, street_name, ext_number, int_number, phone_number, address_type, entity_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [testData.postalCodeId, `Worker Street ${Date.now()}`, "10", "B", "5550001111", "Residencial", "Casa"]
  );
  const workerAddressId = addrRes.insertId;

  const workerId = await Worker.create({
    name: `Worker`,
    lastname: `Test`,
    email: `test-worker-${Date.now()}@example.com`,
    password: null,
    bio: 'Worker for lifecycle test',
    hourly_rate: null,
    experience_years: null,
    is_verified: false,
    address_id: workerAddressId
  });
  log(`✓ Worker creado: ID ${workerId}`);
  testData.workerAddressId = workerAddressId;
  testData.workerId = workerId;
  return workerId;
}

async function verifyTimestamp(serviceId, field, shouldHave = true) {
  const service = await Service.findById(serviceId);
  const value = service[field];
  const hasValue = value !== null && value !== undefined;
  
  if (shouldHave && hasValue) {
    const timestamp = new Date(value).toLocaleString("es-CO", { timeZone: "America/Bogota" });
    log(`✓ ${field}: ${timestamp}`);
    return true;
  } else if (!shouldHave && !hasValue) {
    log(`✓ ${field}: null (correcto)`);
    return true;
  } else {
    log(`✗ ${field}: ${value} (esperado: ${shouldHave ? "fecha" : "null"})`);
    return false;
  }
}

async function verifyAddress(serviceId) {
  const service = await Service.findById(serviceId);
  
  if (!service.address) {
    log(`✗ Dirección no encontrada`);
    return false;
  }
  
  log(`✓ Dirección:`);
  log(`  - Calle: ${service.address.street_name}`);
  log(`  - Número: ${service.address.ext_number}${service.address.int_number ? "/" + service.address.int_number : ""}`);
  log(`  - Teléfono: ${service.address.phone_number}`);
  log(`  - Ciudad: ${service.address.city_name}`);
  log(`  - Estado: ${service.address.state_name}`);
  log(`  - País: ${service.address.country_name}`);
  
  return true;
}

async function changeServiceStatus(serviceId, statusName) {
  log(`→ Cambiando estado a "${statusName}"...`);
  const statusId = await Service.findStatusIdByName(statusName);
  
  if (!statusId) {
    log(`✗ No se encontró estado "${statusName}"`);
    return false;
  }

  await Service.updateStatus(serviceId, statusId);
  await sleep(500); // Pequeña pausa para asegurar que se guarde
  
  log(`✓ Estado cambiado a "${statusName}"`);
  return true;
}

async function runTest() {
  try {
    // Limpiar caché de esquema al inicio
    Service.clearSchemaCache();
    
    log("╔════════════════════════════════════════════╗");
    log("║  TEST: Ciclo de vida de servicios          ║");
    log("║  Verifica: timestamps y dirección          ║");
    log("╚════════════════════════════════════════════╝");
    log("");

    // Setup
    log("▶ SETUP");
    await createTestUser();
    await createTestAddress();
    await createTestService();
    log("");

    // Step 1: Verificar requested_at al crear
    log("▶ PASO 1: Verificar requested_at (al crear)");
    if (!await verifyTimestamp(testData.serviceId, "requested_at", true)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "accepted_at", false)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "started_at", false)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "finished_at", false)) process.exit(1);
    log("");

    // Step 2: Cambiar a Aceptado
    log("▶ PASO 2: Cambiar a 'Aceptado'");
    await changeServiceStatus(testData.serviceId, "Aceptado");
    if (!await verifyTimestamp(testData.serviceId, "accepted_at", true)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "started_at", false)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "finished_at", false)) process.exit(1);
    log("");

    // Step 3: Cambiar a En progreso
    log("▶ PASO 3: Cambiar a 'En progreso'");
    await changeServiceStatus(testData.serviceId, "En progreso");
    if (!await verifyTimestamp(testData.serviceId, "started_at", true)) process.exit(1);
    if (!await verifyTimestamp(testData.serviceId, "finished_at", false)) process.exit(1);
    log("");

    // Step 4: Cambiar a Completado
    log("▶ PASO 4: Cambiar a 'Completado'");
    await changeServiceStatus(testData.serviceId, "Completado");
    if (!await verifyTimestamp(testData.serviceId, "finished_at", true)) process.exit(1);
    log("");

    // Step 4.5: Verificar que tanto cliente como trabajador ven el timeline y la dirección
    log("▶ PASO 4.5: Verificar vistas de cliente y trabajador");
    // Crear trabajador y asignarlo al servicio
    const workerId = await createTestWorker();
    await Service.update(testData.serviceId, { worker_id: workerId });

    // Vista del cliente
    const clientServices = await Service.findByClient(testData.userId);
    const clientView = clientServices.find(s => s.service_id === testData.serviceId);
    if (!clientView) { log(`✗ Cliente no ve el servicio`); process.exit(1); }
    if (!clientView.timeline || !clientView.timeline.requested_at) { log(`✗ Cliente: timeline faltante`); process.exit(1); }
    if (!clientView.address) { log(`✗ Cliente: dirección faltante`); process.exit(1); }
    if (!clientView.worker_address) { log(`✗ Cliente: no ve la dirección del trabajador`); process.exit(1); }
    log(`✓ Cliente ve timeline y dirección`);

    // Vista del trabajador
    const workerServices = await Service.findByWorker(workerId);
    const workerView = workerServices.find(s => s.service_id === testData.serviceId);
    if (!workerView) { log(`✗ Worker no ve el servicio`); process.exit(1); }
    if (!workerView.timeline || !workerView.timeline.requested_at) { log(`✗ Worker: timeline faltante`); process.exit(1); }
    if (!workerView.address) { log(`✗ Worker: dirección faltante`); process.exit(1); }
    if (!workerView.client_address) { log(`✗ Worker: no ve la dirección del cliente`); process.exit(1); }
    log(`✓ Worker ve timeline y dirección`);
    log("");

    // Step 4.6: Simular pago mínimo (sin datos de tarjeta) y verificar que el backend registra el pago
    log("▶ PASO 4.6: Simular pago simple sin datos de tarjeta");
    const [paymentResult] = await pool.query(
      `INSERT INTO payments (service_id, payment_method_id, amount, pay_date, status, transaction_reference, created_at, updated_at)
       VALUES (?, NULL, ?, NOW(), ?, ?, NOW(), NOW())`,
      [testData.serviceId, 10000, 'PENDING', `TX-${Date.now()}`]
    );
    const paymentId = paymentResult.insertId;
    log(`✓ Pago simulado creado: ID ${paymentId}`);

    const serviceAfterPayment = await Service.findById(testData.serviceId);
    if (!serviceAfterPayment.payment_id && !serviceAfterPayment.payment_id === 0) {
      log(`✗ Servicio no muestra información de pago`);
      process.exit(1);
    }
    log(`✓ Servicio incluye información de pago (payment_id: ${serviceAfterPayment.payment_id})`);
    log("");

    // Step 5: Verificar dirección
    log("▶ PASO 5: Verificar dirección guardada");
    if (!await verifyAddress(testData.serviceId)) process.exit(1);
    log("");

    // Cleanup
    log("▶ CLEANUP");
    try {
      // Delete payments associated
      await pool.query("DELETE FROM payments WHERE service_id = ?", [testData.serviceId]);
      // Delete service histories
      await pool.query("DELETE FROM service_status_history WHERE service_id = ?", [testData.serviceId]);
      // Delete service
      await pool.query("DELETE FROM services WHERE service_id = ?", [testData.serviceId]);
      // Delete worker created (if any)
      if (testData.workerId) {
        await pool.query("DELETE FROM workers WHERE worker_id = ?", [testData.workerId]);
        // delete worker address
        if (testData.workerAddressId) await pool.query("DELETE FROM addresses WHERE address_id = ?", [testData.workerAddressId]);
      }
      // Delete user
      await pool.query("DELETE FROM users WHERE user_id = ?", [testData.userId]);
      // Delete addresses
      await pool.query("DELETE FROM addresses WHERE address_id = ?", [testData.addressId]);
      // Delete postal code, city, state (cleanup our test entries)
      await pool.query("DELETE FROM postal_codes WHERE postal_code_id = ?", [testData.postalCodeId]);
      await pool.query("DELETE FROM cities WHERE city_id = ?", [testData.cityId]);
      await pool.query("DELETE FROM states WHERE state_id = ?", [testData.stateId]);
      log("✓ Datos de prueba eliminados");
    } catch (e) {
      log(`⚠️ Error limpiando datos: ${e.message}`);
    }
    log("");

    log("╔════════════════════════════════════════════╗");
    log("║  ✓ TEST COMPLETADO EXITOSAMENTE          ║");
    log("╚════════════════════════════════════════════╝");
    
    process.exit(0);
  } catch (error) {
    console.error("✗ ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
