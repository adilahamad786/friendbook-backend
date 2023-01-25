const axios = require('axios');
const qs = require('querystring');

const getGoogleOAuthTokens = async (code) => {
    try {
        const url = "https://oauth2.googleapis.com/token";

        const values = {
            code,
            client_id : process.env.GOOGLE_CLIENT_ID,
            client_secret : process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri : process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type : "authorization_code"
        };

        const res = await axios.post(url, qs.stringify(values), {
            headers : {
                "Content-Type" : "application/x-www-form-urlencoded"
            }
        });
        return res.data;
    }
    catch (error) {
        throw new Error(error.message);
    }
}

module.exports = getGoogleOAuthTokens;