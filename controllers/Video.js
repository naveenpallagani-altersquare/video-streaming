module.exports.routes = function ({ Services, config }) {
    return {
        "GET /watch": {
            handler: async (req, res) => {
                try {
                    const { videoUrl } = req.query;

                    if (!videoUrl) {
                        return res.status(400).send('videoUrl query param is required');
                    }

                    const versionSegment = req.path.split("/").filter(Boolean)[0];
                    const proxyPath = `${req.baseUrl}/${versionSegment}/proxy-video`;
                    const refreshPath = `${req.baseUrl}/${versionSegment}/refresh-cookies`;

                    const html = Services.Video.buildWatchHtml({
                        proxyUrl: `${proxyPath}?url=${encodeURIComponent(videoUrl)}`,
                        refreshUrl: `${refreshPath}?videoUrl=${encodeURIComponent(videoUrl)}`
                    });

                    return res.send(html);
                } catch (error) {
                    console.error('Error in /watch route:', error);
                    res.status(500).send('Internal Server Error');
                }
            }
        },

        "GET /refresh-cookies": {
            handler: async (req, res) => {
                try {

                    const { cookies } = Services.Video.signCookiesForVideoUrl(req.query);

                    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id'], {
                        httpOnly: true,
                        secure: false,
                        sameSite: 'Lax'
                    });
                    res.cookie('CloudFront-Policy', cookies['CloudFront-Policy'], {
                        httpOnly: true,
                        secure: false,
                        sameSite: 'Lax'
                    });
                    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature'], {
                        httpOnly: true,
                        secure: false,
                        sameSite: 'Lax'
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

        "GET /proxy-video": {
            handler: async (req, res) => {
                try {
                    const url = req.query.url;
                    if (!url) {
                        return res.status(400).send('Missing url parameter');
                    }
                    console.log('Proxying video URL:', url);

                    const versionSegment = req.path.split("/").filter(Boolean)[0];
                    const proxyPath = `${req.baseUrl}/${versionSegment}/proxy-video`;

                    const response = await Services.Video.proxyVideo({
                        url,
                        cookies: req.cookies,
                        proxyPath
                    });

                    res.set(response.headers);
                    if (response.isPlaylist) {
                        res.send(response.data);
                    }
                    else {
                        response.data.pipe(res);
                    }
                } catch (error) {
                    console.error('Error in /proxy-video route:', error);
                    res.status(500).send('Internal Server Error');
                }
            }
        }
    }
}