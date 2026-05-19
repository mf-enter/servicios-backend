import { User } from "../models/User.js";
import { WorkerProfile } from "../models/WorkerProfile.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const profile = await WorkerProfile.findByUserId(userId);
    // Return profile even if null (worker_profile record might not exist yet)
    res.json({ status: true, data: profile });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { name, lastname, email, bio, hourly_rate, experience_years } = req.body;

    // Basic validation
    if (name != null && typeof name !== "string") throw createHttpError(400, "name inválido");
    if (lastname != null && typeof lastname !== "string") throw createHttpError(400, "lastname inválido");
    if (email != null && typeof email !== "string") throw createHttpError(400, "email inválido");
    if (bio != null && typeof bio !== "string") throw createHttpError(400, "bio inválido");
    const parsedHourly = hourly_rate == null ? null : Number(hourly_rate);
    const parsedExp = experience_years == null ? null : Number(experience_years);
    if (parsedHourly != null && (!Number.isFinite(parsedHourly) || parsedHourly < 0)) throw createHttpError(400, "hourly_rate inválido");
    if (parsedExp != null && (!Number.isFinite(parsedExp) || parsedExp < 0)) throw createHttpError(400, "experience_years inválido");

    // Update users table (name/lastname/email) preserving user_type_id
    const user = await User.findById(userId);
    if (!user) throw createHttpError(404, "Usuario no encontrado");

    const updatedUser = {
      name: name != null ? name.trim() : user.name,
      lastname: lastname != null ? lastname.trim() : user.lastname,
      email: email != null ? email.trim() : user.email,
      user_type_id: user.user_type_id
    };

    await User.update(userId, updatedUser);

    // Update worker profile
    await WorkerProfile.update(userId, {
      bio: bio != null ? bio.trim() : null,
      hourly_rate: parsedHourly,
      experience_years: parsedExp
    });

    const profile = await WorkerProfile.findByUserId(userId);
    res.json({ status: true, data: profile });
  } catch (err) {
    next(err);
  }
};
