/**
 * Custom logging middleware
 * Logs HTTP requests with timestamp, method, URL, and response status
 */
const logger = (req, res, next) => {
  const start = Date.now();
  
  // Store original res.json to capture response data
  const originalJson = res.json;
  
  res.json = function(data) {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    // Log format: [TIMESTAMP] METHOD URL - STATUS RESPONSE_TIME ms
    const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} ${duration}ms`;
    
    // Color coding for different status codes in development
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m'
      };
      
      let color = colors.reset;
      if (res.statusCode >= 500) color = colors.red;
      else if (res.statusCode >= 400) color = colors.yellow;
      else if (res.statusCode >= 300) color = colors.cyan;
      else if (res.statusCode >= 200) color = colors.green;
      
      console.log(`${color}${logMessage}${colors.reset}`);
      
      // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const safeBody = { ...req.body };
        // Remove sensitive fields from logs
        delete safeBody.password;
        delete safeBody.token;
        delete safeBody.refreshToken;
        
        if (Object.keys(safeBody).length > 0) {
          console.log(`${colors.blue}Request Body: ${JSON.stringify(safeBody, null, 2)}${colors.reset}`);
        }
      }
      
      // Log response body for errors
      if (res.statusCode >= 400 && data && data.error) {
        console.log(`${colors.red}Error Response: ${JSON.stringify(data.error, null, 2)}${colors.reset}`);
      }
    } else {
      // Production logging (you might want to use a proper logging library like Winston)
      console.log(logMessage);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = logger;