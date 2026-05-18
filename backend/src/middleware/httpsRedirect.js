const enforceHttps = (req, res, next) => {
  // Only redirect in production environments
  if (process.env.NODE_ENV === 'production') {
    // Railway, Heroku, Render pass 'x-forwarded-proto' header indicating the original request protocol
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    
    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
};

module.exports = { enforceHttps };
