import { Worker } from "../models/Worker.js";
import { WorkerProfile } from "../models/WorkerProfile.js";
import { Service } from "../models/Service.js";
import { Address } from "../models/Address.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getMyProfile = async (req, res, next) => {
  try {
    const workerId = req.user.worker_id ?? req.user.user_id;
    const profile = await WorkerProfile.findByUserId(workerId);
    // Return profile even if null (worker_profile record might not exist yet)
    // Attach latest service (most recent) for quick timeline display
    if (profile) {
      const services = await Service.findByWorker(workerId);
      profile.latest_service = services?.[0] ?? null;
    }
    res.json({ status: true, data: profile });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const workerId = req.user.worker_id ?? req.user.user_id;
    const { name, lastname, email, bio, hourly_rate, experience_years, address_id } = req.body;
    const addressProvided = Object.prototype.hasOwnProperty.call(req.body, "address_id");
    const workersHasAddressId = await Worker.hasAddressColumn();

    // Basic validation
    if (name != null && typeof name !== "string") throw createHttpError(400, "name inválido");
    if (lastname != null && typeof lastname !== "string") throw createHttpError(400, "lastname inválido");
    if (email != null && typeof email !== "string") throw createHttpError(400, "email inválido");
    if (bio != null && typeof bio !== "string") throw createHttpError(400, "bio inválido");
    const parsedHourly = hourly_rate == null ? null : Number(hourly_rate);
    const parsedExp = experience_years == null ? null : Number(experience_years);
    const parsedAddressId = address_id == null || address_id === "" ? null : Number(address_id);
    if (parsedHourly != null && (!Number.isFinite(parsedHourly) || parsedHourly < 0)) throw createHttpError(400, "hourly_rate inválido");
    if (parsedExp != null && (!Number.isFinite(parsedExp) || parsedExp < 0)) throw createHttpError(400, "experience_years inválido");
    if (addressProvided && parsedAddressId !== null && (!Number.isInteger(parsedAddressId) || parsedAddressId <= 0)) throw createHttpError(400, "address_id inválido");

    // Update users table (name/lastname/email) preserving user_type_id
    const worker = await Worker.findById(workerId);
    if (!worker) throw createHttpError(404, "Trabajador no encontrado");

    if (addressProvided && !workersHasAddressId) {
      throw createHttpError(409, "address_id aún no está habilitado en workers. Ejecuta la migración.");
    }

    if (addressProvided && parsedAddressId !== null) {
      const address = await Address.findById(parsedAddressId);
      if (!address) throw createHttpError(404, "address_id no existe");
    }

    const updatedWorker = {
      name: name != null ? name.trim() : worker.name,
      lastname: lastname != null ? lastname.trim() : worker.lastname,
      email: email != null ? email.trim() : worker.email,
      bio: bio != null ? bio.trim() : worker.bio,
      hourly_rate: parsedHourly,
      experience_years: parsedExp,
      is_verified: worker.is_verified,
      address_id: addressProvided ? parsedAddressId : worker.address_id ?? null
    };

    await Worker.update(workerId, updatedWorker);

    const profile = await WorkerProfile.findByUserId(workerId);
    res.json({ status: true, data: profile });
  } catch (err) {
    next(err);
  }
};
