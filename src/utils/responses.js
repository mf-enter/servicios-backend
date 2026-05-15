export const sendSuccess = (res, data = null, message = "OK", status = 200) => {
  res.status(status).json({ status: true, message, data });
};

export const sendError = (res, message = "Error", status = 400) => {
  res.status(status).json({ status: false, message });
};