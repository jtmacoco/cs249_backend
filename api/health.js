const checkhealth = async (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(), // Server uptime in seconds
        timestamp: new Date().toISOString(),
    });
}

export default {checkhealth}