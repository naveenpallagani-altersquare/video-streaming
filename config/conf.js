/**
 * conf.js
 * this is the main config file and can be accessed through the "config" dependency
 * which is injected in both controllers and middlewares
 */
module.exports = {
    // CloudFront distribution URL (without protocol)
    s3cdn: {
        domain: process.env.CLOUDFRONT_URL || 'dxxxx.cloudfront.net',
        cdnKeyPairId: process.env.CDN_KEY_PAIR_ID,
        cdnPrivateKey: process.env.CDN_PRIVATE_KEY ? process.env.CDN_PRIVATE_KEY.replace(/\\\n/g, '\n') : null
    }
};
