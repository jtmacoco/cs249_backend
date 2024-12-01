import User from "../../models/Users.js";
import Document from "../../models/Document.js";

//Fetch shared documents
const getSharedDocs = async (username) => {
    try {
        const user = await User.findOne({ username }).populate({
            path: "sharedDocs.documents",
            model: "Document",
        });

        if (!user) {
            console.error(`User with username ${username} not found.`);
            return null;
        }

        return user.sharedDocs.documents;
    } catch (err) {
        console.error("Error in DocumentService.getSharedDocs:", err);
        throw new Error("Failed to fetch shared documents.");
    }
};

//Share a document with a user
const shareDocument = async (username, documentId) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.error(`User with username ${username} not found.`);
            return false;
        }

        //Ensure the document exists
        const document = await Document.findById(documentId);
        if (!document) {
            console.error(`Document with ID ${documentId} not found.`);
            return false;
        }

        //Check if document is already shared
        const isAlreadyShared = user.sharedDocs.documents.some(
            (docId) => docId.toString() === documentId.toString()
        );
        if (!isAlreadyShared) {
            user.sharedDocs.documents.push(documentId);
            await user.save();
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
