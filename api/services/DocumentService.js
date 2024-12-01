import user from "../../models/Users.js";
import Document from "../../models/Document.js";
import mongoose from 'mongoose';

//Fetch shared documents
const getSharedDocs = async (query,fields) => {
    console.log("Getting Shared Documents")
    try {
        const users = await user.find();
        console.log(users)
        console.log(query)
        const urr_user = await user.findOne({query}, {fields})

        if (!urr_user) {
            console.error(`User not found.`);
            return null;
        }
        res_array = urr_user.sharedDocs
        return {
            res_array
        }
    } catch (err) {
        console.error("Error in DocumentService.getSharedDocs:", err);
        throw new Error("Failed to fetch shared documents.");
    }
};

//Share a document with a user
const shareDocument = async (username, documentId) => {
    try {
        const urr_user = await user.findOne({ username });
        if (!urr_user) {
            console.error(`User not found.`);
            return false;
        }

        //Ensure the document exists
        const document = await Document.findById(documentId);
        if (!document) {
            console.error(`Document with ID ${documentId} not found.`);
            return false;
        }

        //Check if document is already shared
        const isAlreadyShared = urr_user.sharedDocs.documents.some(
            (docId) => docId.toString() === documentId.toString()
        );
        if (!isAlreadyShared) {
            urr_user.sharedDocs.documents.push(documentId);
            await urr_user.save();
            console.log(`Document ${documentId} shared with user ${username}.`);
        } else {
            console.log(`Document ${documentId} is already shared with user ${username}.`);
        }

        return true;
    } catch (err) {
        console.error("Error in DocumentService.shareDocument:", err);
        throw new Error("Failed to share document.");
    }
};

export default { getSharedDocs, shareDocument };
