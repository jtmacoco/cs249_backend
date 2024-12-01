import user from '../../models/Users.js'
import mongoose from 'mongoose';
const registerUser=async(body)=>{
    try{
        const newUser=await user.create(body)
        return newUser
    }catch(e){
        if (e instanceof mongoose.Error.ValidationError) {
            // Extract validation error messages
            const errorMessages = Object.values(e.errors).map(err => err.message);
            // Throw the error message to be handled in the controller
            throw new Error(errorMessages.join(', ')); 
        }
        // Handle other errors
        throw new Error('An unexpected error occurred.');
    }
}
const getUser = async(query,fields) =>{
    console.log("getUser called")
    console.log(query)
    console.log("------------")
    //console.log(fields)
    const cur_user = await user.findOne({ ...query}).select(fields).exec();
    if (!cur_user){
        return null
    }
    return {
        ...cur_user._doc,
    }
};
const getAllUsers=async(query,fields)=>{
    let queryObjects = {...query}
    const users = await user.find({...queryObjects}).select(fields).exec()
    return users
}
const getAllEmail=async(query,fields)=>{
    let queryObjects = {...query}
    const users = await user.find({...queryObjects}).select(fields).exec()
    return users
}
export default{
    registerUser,
    getAllUsers,
    getAllEmail,
    getUser,
}