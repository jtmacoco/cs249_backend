import bcrypt from 'bcrypt';
import UserServices from "../services/UserServices.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
const generateToken = (user) => {
    const payload = {
      id: user.user, 
      email: user.email, 
    };
  
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  };
const register = async (req, res) => {
    try {
        const users = await UserServices.getAllUsers({ username: req.body.username }, { _id: 1, username: 1 })
        const emails = await UserServices.getAllEmail({ email: req.body.email }, { _id: 1, email: 1 })
        if (users.length > 0) {//a user already exists 
            return res.json({
                success: false,
                message: 'user already exists'
            })
        }
        if (emails.length > 0) {
            return res.json({
                success: false,
                message: 'email already exists'
            })
        }
        try {
            const user = await UserServices.registerUser({ ...req.body })
            return res.status(200).json({
                success: true,
                data: user,
                message: "Successfully register user"
            })
        } catch (e) {
            return res.json({
                success: false,
                message: e.message,  // Send the validation error message to frontend
            });
        }
    } catch (e) {
        return res.status(500).json({
            status: 'error',
            message: e.message || 'API SERVER ERROR'
        })
    }
}
const login = async(req,res)=>{
    //console.log("DEBUG : user login start for :")
    //console.log({email: req.body.email})
    try{
        const user = await UserServices.getUser({email: req.body.email})
        if(user===null){
            return res.json({
                success:false,
                message:'user doesn\'t exist',
                })
        }
        const isMatch = await bcrypt.compare(req.body.password,user.password)
        if(!isMatch){
            return res.json({
                success:false,
                message:'invalid credentials',
                })
        }
        console.log(user._id.toString(),user.email)
        const token = generateToken({user:user._id.toString(),email:user.email})

        return res.json({
            success:true,
            data:user.email,
            message:'successfully logged in user :)',
            token:token,
        })
    }catch(e){
        return res.status(400).json({
            success:false,
            message:`Error occured sorry lol ${e}`
        })
    }
}
const getname = async(req,res)=>{
    try{
        const user = await UserServices.getUser({email: req.body.email})
        if(user===null){
            return res.json({
                success:false,
                message:'user doesn\'t exist',
                })
        }
        return res.json({
            success:true,
            data:user.username,
            message:'successfully aquired username',
        })
    }
    catch(e){
        return res.status(400).json({
            success:false,
            message:`Error occured sorry lol ${e}`
        })
    }
}
export default {
    register,
    login,
    getname,
}