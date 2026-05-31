import twilio from 'twilio';

import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export async function makePhoneCall(
    to,
    twimlUrl
) {

    try {

        console.log('📲 Calling:', to);

        console.log('🔗 TwiML URL:', twimlUrl);

        const call =
            await client.calls.create({

                from:
                    process.env.TWILIO_PHONE_NUMBER,

                to:
                    to.toString(),

                url:
                    twimlUrl
            });

        console.log(
            '📞 Call SID:',
            call.sid
        );

        return call;

    } catch (error) {

        console.error(
            '❌ Twilio call failed'
        );

        console.error(error);

        throw error;
    }
}