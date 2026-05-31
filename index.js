import dotenv from 'dotenv';

import {
    readCustomerData
}
from './services/excelReader.js';

import {
    buildPaymentReminderPrompt
}
from './utils/promptBuilder.js';

import {
    createUltravoxCall
}
from './services/ultravox.js';

import {
    makePhoneCall
}
from './services/twilio.js';

dotenv.config();

async function main() {

    try {

        console.log(
            '🚀 Starting AI Voice Call System...'
        );

        // Validate Environment Variables

        const requiredEnvVars = [

            'ULTRAVOX_API_KEY',
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_PHONE_NUMBER',
            'NGROK_URL'
        ];

        const missingVars =

            requiredEnvVars.filter(
                envVar =>
                    !process.env[envVar]
            );

        if (missingVars.length) {

            throw new Error(

                `Missing Environment Variables: ${missingVars.join(', ')}`
            );
        }

        console.log(
            '✅ Environment Variables Loaded'
        );

        // Load Customers

        const customers =
            readCustomerData();

        console.log(
            '📚 Customers Loaded:',
            customers.length
        );

        if (!customers.length) {

            throw new Error(
                'No customers found in Excel sheet'
            );
        }

        // Test First Customer

        const customer =
            customers[0];

        console.log(
            `📞 Calling ${customer.Name}`
        );

        console.log(
            '📄 Invoice:',
            customer.Invoice
        );

        console.log(
            '💰 Due Amount:',
            customer["Due Amount"]
        );

        // Generate Prompt

        const prompt =
            buildPaymentReminderPrompt(
                customer
            );

        console.log(
            '🧠 Prompt Generated'
        );

        // Create Ultravox Session

        const ultravoxResponse =
            await createUltravoxCall(
                prompt
            );

        if (
            !ultravoxResponse ||
            !ultravoxResponse.joinUrl
        ) {

            throw new Error(
                'Ultravox did not return a joinUrl'
            );
        }

        console.log(
            '✅ Ultravox Session Created'
        );

        console.log(
            '🔗 Join URL:',
            ultravoxResponse.joinUrl
        );

        // Generate TwiML URL

        const twimlUrl =

            `${process.env.NGROK_URL}/twiml?ws=${encodeURIComponent(
                ultravoxResponse.joinUrl
            )}`;

        console.log(
            '🌐 TwiML URL:',
            twimlUrl
        );

        // Initiate Phone Call

        const call =
            await makePhoneCall(

                customer["Contact Number"],

                twimlUrl
            );

        console.log(
            '🎉 Call Initiated Successfully'
        );

        console.log(
            '📋 Call SID:',
            call.sid
        );

        console.log(
            '📞 Call Status:',
            call.status
        );

    } catch (error) {

        console.error(
            '❌ Main Execution Failed'
        );

        console.error(error);
    }
}

main();