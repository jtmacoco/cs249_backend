import DocumentService from "../services/DocumentService.js";

//Fetch shared documents
const getSharedDocs = async (req, res) => {
    try {
        const documents = await DocumentService.getSharedDocs(req.params.username);
        if (!documents) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(documents);
    } catch (err) {
        console.error("Error fetching shared documents:", err);
        res.status(500).json({ message: "Failed to fetch shared documents" });
    }
};

//Share a document with a user
const shareDocument = async (req, res) => {
    try {
        const { documentId } = req.body;
        const success = await DocumentService.shareDocument(req.params.username, documentId);
        if (!success) {
            return res.status(404).json({ message: "User not found or document could not be shared" });
        }
        res.status(200).json({ message: "Document shared successfully" });
    } catch (err) {
        console.error("Error sharing document:", err);
        res.status(500).json({ message: "Failed to share document" });
    }
};

export default { getSharedDocs, shareDocument };
