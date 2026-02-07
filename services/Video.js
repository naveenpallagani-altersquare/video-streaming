module.exports = ({ Services, config }) => {
    const axios = require('axios');
    const { getSignedCookies } = require('@aws-sdk/cloudfront-signer');

    const getResourcePrefix = (videoUrl) => {
        const url = new URL(videoUrl);
        return `${url.origin}${url.pathname.split('/').slice(0, -1).join('/')}/`;
    };

    const buildPolicy = (resourcePrefix, expiresInSeconds = 7200) => {
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

    const buildProxyCookieHeader = (cookies = {}) => {
        const parts = [];
        if (cookies['CloudFront-Policy']) parts.push(`CloudFront-Policy=${cookies['CloudFront-Policy']}`);
        if (cookies['CloudFront-Signature']) parts.push(`CloudFront-Signature=${cookies['CloudFront-Signature']}`);
        if (cookies['CloudFront-Key-Pair-Id']) parts.push(`CloudFront-Key-Pair-Id=${cookies['CloudFront-Key-Pair-Id']}`);
        return parts.join('; ');
    };

    const rewritePlaylist = ({ playlistContent, baseUrl, proxyPath }) => {
        return playlistContent.replace(
            /^((?!#|http).+\.(ts|m3u8).*)$/gm,
            (match) => {
                const segmentUrl = new URL(match.trim(), baseUrl).toString();
                return `${proxyPath}?url=${encodeURIComponent(segmentUrl)}`;
            }
        );
    };

    const validateCdnConfig = () => {
        if (!config.s3cdn || !config.s3cdn.cdnPrivateKey || !config.s3cdn.cdnKeyPairId) {
            throw new Error('CloudFront credentials not configured');
        }
    };

    return {
        signCookiesForVideoUrl: ({ filePath }, expiresInSeconds = 7200) => {
            validateCdnConfig();

            const resourcePrefix = `${config.s3cdn.domain}/${filePath}`;
            const policy = buildPolicy(resourcePrefix, expiresInSeconds);

            const cookies = getSignedCookies({
                policy,
                privateKey: config.s3cdn.cdnPrivateKey,
                keyPairId: config.s3cdn.cdnKeyPairId
            });

            return { resourcePrefix, policy, cookies };
        },


        buildWatchHtml: ({ proxyUrl, refreshUrl, filePath }) => {
            return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Secure Video</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
  <h2>CloudFront Secure Video</h2>

  <video id="video" controls autoplay width="720"></video>

  <script>
    const videoUrl = "${proxyUrl}";
        const refreshUrl = "${refreshUrl}";
        const filePath = "${filePath}";
    const video = document.getElementById('video');

        (async () => {
            try {
                await fetch(refreshUrl + "?filePath=" + encodeURIComponent(filePath), { credentials: 'include' });

                if (Hls.isSupported()) {
                    const hls = new Hls({
                        xhrSetup: xhr => {
                            xhr.withCredentials = true;
                        }
                    });
                    hls.loadSource(videoUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('HLS Error:', event, data);
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = videoUrl;
                } else {
                    alert('HLS not supported');
                }
            } catch (err) {
                console.error('Failed to refresh cookies', err);
                alert('Failed to refresh cookies');
            }
        })();
  </script>
</body>
</html>
            `;
        },

        proxyVideo: async ({ url, cookies, proxyPath }) => {
            const isPlaylist = url.endsWith('.m3u8');

            const response = await axios.get(url, {
                headers: {
                    'Cookie': buildProxyCookieHeader(cookies)
                },
                responseType: isPlaylist ? 'text' : 'stream'
            });

            if (isPlaylist) {
                let playlistContent = response.data;
                playlistContent = rewritePlaylist({
                    playlistContent,
                    baseUrl: url,
                    proxyPath
                });

                return {
                    isPlaylist: true,
                    data: playlistContent,
                    headers: {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Cache-Control': 'no-cache',
                        'Access-Control-Allow-Origin': 'http://localhost:3000',
                        'Access-Control-Allow-Credentials': 'true'
                    }
                };
            }

            return {
                isPlaylist: false,
                data: response.data,
                headers: {
                    'Content-Type': response.headers['content-type'],
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                    'Access-Control-Allow-Credentials': 'true'
                }
            };
        }
    }
}