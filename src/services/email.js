const Sib = require("sib-api-v3-sdk");
const tryCatch = require("../middleware/tryCatch");
require("dotenv").config();

// Create client instance
const client = Sib.ApiClient.instance;

// Instantiate the client
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_V3_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi();

exports.sendAccountVerificationOtpOnEmail = tryCatch(async (email, otp) => {
  const sender = {
    email: "friendbook.info@gmail.com",
    name: "Friendbook",
  };

  const receivers = [
    {
      email: email,
    },
  ];

  const result = await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Friendbook Account verification",
    textContent: `Your account verification OTP-${otp} is valid for 5 minutes only! Don't share your OTP to others!`,
  });

  return result;
});

exports.sendForgotPasswordOtpOnEmail = tryCatch(async (email, otp) => {
  const sender = {
    email: "friendbook.info@gmail.com",
    name: "Friendbook",
  };

  const receivers = [
    {
      email: email,
    },
  ];

  const result = await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Friendbook Forgot Password",
    textContent: `Your password reset OTP-${otp} is valid for 5 minutes only! Don't share your OTP to others!`,
  });

  return result;
});
