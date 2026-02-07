/**
 * http.js
 * Here server level middlewares are defined
 */
let bodyParser = require("body-parser").json({ limit: "50mb" });
let compression = require("compression");
let cors = require("cors");
let cookieParser = require("cookie-parser");

/* This whitelist can only filter requests from the browser clients */
var whitelist = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:5173"
];

var corsOptions = {
	origin: function (origin, callback) {
		
		if (!origin) {
			console.log("✅ Allowed: No origin header (same-origin or non-browser request)");
			callback(null, true);
		} else if (whitelist.indexOf(origin) !== -1) {
			console.log("✅ Allowed: Origin in whitelist");
			callback(null, true);
		} else if (origin == null) {
			console.log("✅ Allowed: Origin is null");
			callback(null, true);
		} else if (origin.indexOf("chrome-extension") >= 0) {
			console.log("✅ Allowed: Chrome extension");
			callback(null, true);
		} else {
			console.log("⚠️ [Not in whitelist] but allowed temporarily:", origin);
			callback(null, true);
			// callback("Not allowed by CORS", false)
			// callback(new Error("Not allowed by CORS"), false)
		}
		return;
	},
	credentials: true, // CRITICAL: Required for cookies with withCredentials: true
	methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
	allowedHeaders: ["*"],
	exposedHeaders: ["Set-Cookie", "Cookie", "*"],
	preflightContinue: false,
	optionsSuccessStatus: 204
};

let corsMiddle = cors(corsOptions);

// CORS must come FIRST before body parser
module.exports = [corsMiddle, bodyParser, compression(), cookieParser()];