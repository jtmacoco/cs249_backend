import mongoose from "mongoose"
import hashPassword from "../api/passHash.js";
import Document from "./Document.js";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
        unique:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        validate: {
            validator: function (v) {
                return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address`
        }
    },
    password:{
        type: String,
        required:true,
        validate: {
            validator: function(v) {
                return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v);
            },
            message: props => "Password must be at least 8 characters, with a mix of letters and numbers"
        }
    },
    sharedDocs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    createdAt:{
        type:Date,
        default:Date.now,
    },
})
userSchema.pre('save', hashPassword)
const User = mongoose.model("User",userSchema)
export default User