const handleResponse = (res, status, message, data) => {
    res.status(status).json({
        success: true,
        message: message,
        data: data || null
    });
};
export default handleResponse;