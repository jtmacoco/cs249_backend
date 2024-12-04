import mongoose from "mongoose";
import User from "./Users.js";
import VectorClock from "../algorithms/vectorClock/vectorClock.js";
const vc = new VectorClock("testing_id")
const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        default:"",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vectorClock:{
        type: mongoose.Schema.Types.Mixed,
        default:{},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Document = mongoose.model("Document", documentSchema);
export default Document;
