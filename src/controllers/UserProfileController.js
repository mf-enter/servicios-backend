import { UserProfile } from "../models/UserProfile.js";
import { User } from "../models/User.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getMyProfile = async (req,res,next)=>{
  try{
    const data = await UserProfile.findByUserId(req.user.user_id);
    res.json({status:true,data});
  }catch(err){next(err);}
};

export const updateAvatar = async (req,res,next)=>{
  try{
    const { avatar_url } = req.body;
    await UserProfile.updateAvatar(req.user.user_id, avatar_url);
    res.json({status:true});
  }catch(err){next(err);}
};

export const updateMyProfile = async (req,res,next)=>{
  try{
    const userId = req.user.user_id;
    const { name, lastname, email, avatar_url } = req.body;

    // Validation
    if (name != null && (typeof name !== "string" || !name.trim())) throw createHttpError(400, "name inválido");
    if (lastname != null && (typeof lastname !== "string" || !lastname.trim())) throw createHttpError(400, "lastname inválido");
    if (email != null && (typeof email !== "string" || !email.trim())) throw createHttpError(400, "email inválido");
    if (avatar_url != null && typeof avatar_url !== "string") throw createHttpError(400, "avatar_url inválido");

    // Get current user
    const user = await User.findById(userId);
    if (!user) throw createHttpError(404, "Usuario no encontrado");

    // Update user table if needed
    if (name != null || lastname != null || email != null) {
      const updatedUser = {
        name: name != null ? name.trim() : user.name,
        lastname: lastname != null ? lastname.trim() : user.lastname,
        email: email != null ? email.trim() : user.email,
        user_type_id: user.user_type_id
      };
      await User.update(userId, updatedUser);
    }

    // Update user profile if avatar provided
    if (avatar_url != null) {
      await UserProfile.update(userId, { avatar_url });
    }

    const profile = await UserProfile.findByUserId(userId);
    res.json({status:true, data: profile});
  }catch(err){next(err);}
};