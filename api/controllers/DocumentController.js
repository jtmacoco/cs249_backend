import DocumentService from "../services/DocumentService.js";
import Document from "../../models/Document.js";
import dotenv from 'dotenv';
dotenv.config();

//Fetch shared documents
const getSharedDocs = async (req, res) => {
    try {
        //console.log("getSharedDoc called")
        //console.log(req.body)
        //console.log("---------------")
        const documents = await DocumentService.getSharedDocs(req.body, { sharedDocs: 1 });
        if (!documents) {
            return res.status(404).json({ message: "Incorrect User" });
        }
        else if (documents.length === 0) {
            return res.status(200).json({ message: "No shared documents found for this user." });
        }

        res.json(documents);
    } catch (err) {
        console.error("Error fetching shared documents:", err);
        res.status(500).json({ message: "Internal server error while fetching shared documents." });
    }
};


//Share a document with a user
const shareDocument = async (req, res) => {
    try {
        console.log(req.body)
        // Validate input
        if (!req.body.documentId) {
            return res.status(400).json({ message: "Document ID is required." });
        }

        const success = await DocumentService.shareDocument(req.body);
        
        switch (success) {
            case 0: // User not found
                return res.status(404).json({ message: "User not found." });
            case 1: // Document not found
                return res.status(404).json({ message: "Document not found." });
            case 2: // Document already shared
                return res.status(200).json({ message: "Document is already shared with the user." });
            case 3: // Successfully shared
                return res.status(200).json({ message: "Document successfully shared with the user." });
            case 4: // MongoDB update error
                return res.status(500).json({ message: "An error occurred while sharing the document." });
            default: // Unexpected error
                return res.status(500).json({ message: "An unexpected error occurred." });
        }
    } catch (err) {
        console.error("Error sharing document:", err);
        res.status(500).json({ message: "Internal server error while sharing document." });
    }
};



export default { getSharedDocs, shareDocument };
