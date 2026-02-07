module.exports = ({ Services, config }) => {
    const axios = require('axios');
    const { getSignedCookies } = require('@aws-sdk/cloudfront-signer');

    const buildPolicy = (resourcePrefix, expiresInSeconds = config.s3cdn.cdnCookieExpirationSeconds) => {
        return JSON.stringify({
            Statement: [
                {
                    Resource: `${resourcePrefix}*`,
                    Condition: {
                        DateLessThan: {
                            "AWS:EpochTime": Math.floor(Date.now() / 1000) + expiresInSeconds
                        }
                    }
                }
            ]
        });
    };

    const validateCdnConfig = () => {
        if (!config.s3cdn || !config.s3cdn.cdnPrivateKey || !config.s3cdn.cdnKeyPairId) {
            throw new Error('CloudFront credentials not configured');
        }
    };

    return {
        signCookiesForVideoUrl: ({ filePath }) => {
            validateCdnConfig();
            if (!filePath) {
                return {
                    success: false,
                    message: 'filePath is required to sign cookies'
                };
            }
            const resourcePrefix = `${config.s3cdn.domain}/${filePath}`;
            console.log('Signing cookies for resource prefix:', resourcePrefix);
            const policy = buildPolicy(resourcePrefix, config.s3cdn.cdnCookieExpirationSeconds);

            const cookies = getSignedCookies({
                policy,
                privateKey: config.s3cdn.cdnPrivateKey,
                keyPairId: config.s3cdn.cdnKeyPairId
            });

            return { success: true, data: { cookies } };
        },
    }
}