import user from "../../models/Users.js";
import Document from "../../models/Document.js";
import UserServices from "./UserServices.js";
import mongoose from 'mongoose';
import User from "../../models/Users.js";


//Fetch shared documents
const getSharedDocs = async (query, fields) => {
    try {
        console.log("Getting Shared Documents")
        //const users = await user.find();
        //console.log(users)
        //console.log(query)
        //console.log(fields)
        //console.log("----------")
        const curr_user = await user.findOne(query, fields).populate('sharedDocs', 'name').exec();
        if (!curr_user) {
            console.error(`User not found.`);
            return null;
        }
        //console.log("Array content", urr_user.sharedDocs)
        //console.log("Array content: ", curr_user.sharedDocs)
        for (const sharedDoc of curr_user.sharedDocs) {
            //console.log(sharedDoc)
        }
        return curr_user.sharedDocs
    } catch (err) {
        console.error("Error in DocumentService.getSharedDocs:", err);
        throw new Error("Failed to fetch shared documents.");
    }
};

//Share a document with a user
const shareDocument = async (content) => {
    try {
        console.log("DocumentID: %s, email: %s", content.documentId, content.recipient)
        const curr_user = await user.findOne({ email: content.recipient });
        if (!curr_user) {
            console.error(`User not found.`);
            return 0;
        }
        //console.log(curr_user)
        //Ensure the document exists
        const document = await Document.findById(content.documentId);
        if (!document) {
            console.error(`Document with ID ${content.documentId} not found.`);
            return 1;
        }

        // Add the document to the user's shared documents
        try {
            const res = await user.updateOne(
                { email: content.recipient },
                { $addToSet: { sharedDocs: content.documentId } }
            );
            if (res.matchedCount === 0) {
                console.error(`No user found with email ${content.recipient}.`);
                return 0;
            }
            if (res.modifiedCount === 0) {
                console.log(`Document with ID ${content.documentId} was already shared with user ${content.recipient}.`);
                return 2;
            }
            if (res.modifiedCount > 0) {
                console.log(`Document with ID ${content.documentId} successfully shared with user ${content.recipient}.`);
                return 3;
            }
        } catch (err) {
            console.error(`Error updating shared document in MongoDB: ${err}`);
            return 4;
        }
    } catch (err) {
        console.error("Error in DocumentService.shareDocument:", err);
        throw new Error("Failed to share document.");
    }
};

const getMyDocs = async (query, fields) => {
    try{
        //console.log("Getting Documents")
        const curr_user = await user.findOne(query);
        if (!curr_user) {
            console.log('User not found');
            return [];
        }
        //console.log("User ID: ", curr_user._id)
        // Step 2: Find all documents owned by the user
        const documents = await Document.find({ owner: curr_user._id });
        //console.log(documents)
        return documents;
    }catch (err) {
        console.error("Error in DocumentService.getMyDocs:", err);
        throw new Error("Failed to fetch documents.");
    }
    
}

const createDoc = async(body)=>{
    try{
        const docName = body['name']
        const userdata = await UserServices.getUser({email:body['email']})//need to grab uid
        const uid = userdata['_id']
        const newDoc = await Document.create({name:docName,owner:uid})
        return newDoc
    }catch(error){
        console.log("error in creating document:",error)
        throw new Error(error)
    }
}

export default { getSharedDocs, shareDocument, getMyDocs,createDoc};
