import {
    createUltravoxCall
}
from './ultravox.js';

import {
    generateSupervisorPrompt
}
from '../utils/supervisorPromptGenerator.js';

import {
    makePhoneCall
}
from './twilio.js';


export async function callSupervisor({
    customer
}) {

    try {

        console.log(
            '📞 Initiating supervisor escalation call...'
        );

        const supervisorPrompt =
            generateSupervisorPrompt({

                customerName:
                    customer.Name,

                invoiceNumber:
                    customer.Invoice,

                dueAmount:
                    customer["Due Amount"],

                escalationReason:
                    customer["Escalation Status"],

                delayedDays:
                    customer["Delayed Days"]
            });

        console.log(
            '🧠 Supervisor Prompt Generated'
        );
        
        console.log(
            '✅ Supervisor Ultravox session created'
        );
        
        // Create Ultravox session
        const ultravoxResponse =
    await createUltravoxCall(
        supervisorPrompt
    );

    const twimlUrl =
        `${process.env.NGROK_URL}/twiml?ws=${encodeURIComponent(
            ultravoxResponse.joinUrl
        )}`;

    await makePhoneCall(
        customer["Supervisor Contact"],
        twimlUrl
    );

        console.log(
            '✅ Supervisor call initiated'
        );

    } catch (error) {

        console.error(
            '❌ Supervisor call failed'
        );

        console.error(error);
    }
}