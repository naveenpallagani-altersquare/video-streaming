const e = require("express");

module.exports.routes = function ({ Services, config }) {
    return {
        "GET /refresh-cookies": {
            handler: async (req, res) => {
                try {

                    const { success, data, message } = Services.Video.signCookiesForVideoUrl(req.query);

                    if (!success) {
                        return res.status(400).json({ success: false, message });
                    }

                    const { cookies } = data;

                    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id'], {
                        httpOnly: true,
                        secure: true, // MUST be true in HTTPS
                        expires: new Date(Date.now() + config.s3cdn.cdnCookieExpirationSeconds),
                        sameSite: 'none'
                    });

                    res.cookie('CloudFront-Policy', cookies['CloudFront-Policy'], {
                        httpOnly: true,
                        secure: true, // MUST be true in HTTPS
                        expires: new Date(Date.now() + config.s3cdn.cdnCookieExpirationSeconds),
                        sameSite: 'none'
                    });

                    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature'], {
                        httpOnly: true,
                        secure: true, // MUST be true in HTTPS
                        expires: new Date(Date.now() + config.s3cdn.cdnCookieExpirationSeconds),
                        sameSite: 'none'
                    });

                    res.json({
                        success: true,
                        message: 'Cookies refreshed successfully'
                    });
                } catch (error) {
                    console.error('Error in /refresh-cookies route:', error);
                    res.status(500).send('Internal Server Error');
                }
            }
        },
    }
}