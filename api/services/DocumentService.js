import User from "../models/User.js";
import Document from "../models/Document.js";

//Fetch shared documents
const getSharedDocs = async (username) => {
    try {
        const user = await User.findOne({ username }).populate({
            path: "sharedDocs.documents",
            model: "Document",
        });

        if (!user) {
            throw new Error(`User with username ${username} not found`);
        }

        return user.sharedDocs.documents;
    } catch (err) {
        console.error("Error in DocumentService.getSharedDocs:", err);
        throw err;
    }
};


//Share a document with a user
const shareDocument = async (username, documentId) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return false;
        }

        // Ensure the document exists
        const document = await Document.findById(documentId);
        if (!document) {
            console.error(`Document with ID ${documentId} not found`);
            return false;
        }

        // Add the document if it doesn't already exist in the user's sharedDocs
        if (!user.sharedDocs.documents.includes(documentId)) {
            user.sharedDocs.documents.push(documentId);
            await user.save();
        }
        return true;
    } catch (err) {
        console.error("Error in DocumentService.shareDocument:", err);
        throw err;
    }
};


export default { getSharedDocs, shareDocument };
