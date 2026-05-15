import { UserProfile } from "../models/UserProfile.js";

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