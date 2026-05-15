import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { UserRole } from "../models/UserRole.js";
import { Admin } from "../models/Admin.js";
import { Worker } from "../models/Worker.js";
import { UserProfile } from "../models/UserProfile.js";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

const buildAuthTokenPayload = (entity, role, entityIdKey) => ({
  user_id: entity[entityIdKey],
  role,
  [entityIdKey]: entity[entityIdKey]
});

export const register = async (req,res,next)=>{
  try{
    const { name, lastname, email, password, role, bio, hourly_rate, experience_years } = req.body;
    if(!name||!lastname||!email||!password) return res.status(400).json({status:false,message:"Datos incompletos"});
    const [adminExists, workerExists, userExists] = await Promise.all([
      Admin.findByEmail(email),
      Worker.findByEmail(email),
      User.findByEmail(email)
    ]);
    if(adminExists || workerExists || userExists) return res.status(400).json({status:false,message:"Correo ya registrado"});
    const hash = await bcrypt.hash(password,10);
    if (role === "worker") {
      const id = await Worker.create({
        name,
        lastname,
        email,
        password: hash,
        bio,
        hourly_rate,
        experience_years,
        is_verified: false
      });
      return res.status(201).json({status:true,message:"Trabajador creado", role:"worker", id, worker_id: id});
    }

    const id = await User.create({ name, lastname, email, password: hash, user_type_id: 2 });
    await UserRole.create({ user_id: id, role_id: 2 });
    await UserProfile.create(id, null);
    return res.status(201).json({status:true,message:"Cuenta creada", role:"user", id, user_id: id});
  }catch(err){next(err);}
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findByEmail(email);
    if (admin && await bcrypt.compare(password, admin.password)) {
      return res.json({
        status:true,
        token: signToken(buildAuthTokenPayload(admin, "admin", "admin_id")),
        user:{ id: admin.admin_id, role:"admin", email: admin.email }
      });
    }

    const worker = await Worker.findByEmail(email);
    if (worker && await bcrypt.compare(password, worker.password)) {
      return res.json({
        status:true,
        token: signToken(buildAuthTokenPayload(worker, "worker", "worker_id")),
        user:{ id: worker.worker_id, role:"worker", email: worker.email, worker_id: worker.worker_id }
      });
    }

    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({status:false,message:"Usuario no existe. Regístrate."});

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ status:false,message:"Credenciales inválidas" });

    return res.json({
      status:true,
      token: signToken({ user_id: user.user_id, role:"user" }),
      user:{ id:user.user_id, email:user.email, role:"user" }
    });
  } catch (err) { next(err); }
};