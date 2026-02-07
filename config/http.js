/**
 * http.js
 * Here server level middlewares are defined
 */
let bodyParser = require("body-parser").json({ limit: "50mb" });
let compression = require("compression");
let cors = require("cors");
let cookieParser = require("cookie-parser");

/* Allow all origins with full configuration */
let corsMiddle = cors({
	origin: true, // Allow all origins
	credentials: true, // Allow cookies
	methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
	allowedHeaders: ["*"],
	exposedHeaders: ["*"],
	preflightContinue: false,
	optionsSuccessStatus: 204
});

// CORS must come FIRST before body parser
module.exports = [corsMiddle, bodyParser, compression(), cookieParser()];