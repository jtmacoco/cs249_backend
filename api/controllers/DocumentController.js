import DocumentService from "../services/DocumentService.js";

//Fetch shared documents
const getSharedDocs = async (req, res) => {
    try {
        const documents = await DocumentService.getSharedDocs(req.params.username);
        if (!documents || documents.length === 0) {
            return res.status(404).json({ message: "No shared documents found for this user." });
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
        const { documentId } = req.body;

        // Validate input
        if (!documentId) {
            return res.status(400).json({ message: "Document ID is required." });
        }

        const success = await DocumentService.shareDocument(req.params.username, documentId);
        if (!success) {
            return res.status(404).json({ message: "User or document not found, or sharing failed." });
        }

        res.status(200).json({ message: "Document shared successfully." });
    } catch (err) {
        console.error("Error sharing document:", err);
        res.status(500).json({ message: "Internal server error while sharing document." });
    }
};

export default { getSharedDocs, shareDocument };
