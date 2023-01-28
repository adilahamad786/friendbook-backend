const Sib = require('sib-api-v3-sdk');
require('dotenv').config();

// Create client instance
const client = Sib.ApiClient.instance;

// Instantiate the client
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_V3_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi();

const sendOtpOnEmail = async (email, otp) => {
    const sender = {
        email: "friendbook.info@gmail.com",
        name: "Friendbook"
    }
    
    const receivers = [
        {
            email: email
        }
    ]
    
    try {
        const result = await tranEmailApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: 'Welcome to Friendbook',
            textContent: `This OTP-${otp} is valid for 5 minutes only!`
        });
    
        return result;
    }
    catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { sendOtpOnEmail };