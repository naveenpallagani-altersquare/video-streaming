/**
 * http.js
 * Here server level middlewares are defined
 */
let bodyParser = require("body-parser").json({ limit: "50mb" });
let compression = require("compression");
let cors = require("cors");
let cookieParser = require("cookie-parser");

/* Allow all origins for now */
let corsMiddle = cors();

module.exports = [bodyParser, compression(), corsMiddle, cookieParser()];