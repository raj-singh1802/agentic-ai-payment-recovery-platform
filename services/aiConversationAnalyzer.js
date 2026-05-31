import Groq from 'groq-sdk';

import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


export async function analyzeConversationAI(summary) {

    try {

        const prompt = `
You are an AI payment collection workflow analyzer.

Analyze the following customer payment conversation summary.
The summary may be in Hindi, English, or a mix of both languages.

Your task:
- Detect customer payment intent
- Detect delayed payment duration
- Detect escalation risk
- Detect payment refusal
- Return ONLY valid JSON

Rules:
    - paymentStatus must ONLY be:
      "Pending", "Delayed", "Paid", or "Escalated"
        
    - customerIntent must ONLY be:
      "Payment Delayed",
      "Payment Completed",
      "Payment Risk",
      "Willing To Pay",
      "Unreachable"
        
    - If customer asks for more time,
      paymentStatus = "Delayed"
        
    - If customer already paid,
      paymentStatus = "Paid"
        
    - If customer refuses payment,
      paymentStatus = "Escalated"
        
    - delayedDays must always be numeric
        
    - escalation must always be boolean
        
    - Return ONLY strict valid JSON

JSON format:
{
  "paymentStatus": "",
  "delayedDays": 0,
  "customerIntent": "",
  "escalation": false
}

Conversation Summary:
${summary}
`;

        const completion =
            await groq.chat.completions.create({

                model: 'llama-3.3-70b-versatile',

                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],

                temperature: 0.2
            });

        const response =
            completion.choices[0]
                .message.content;

        console.log('🤖 AI Analysis Raw Response:');

        console.log(response);

        // Convert AI JSON string to object
        // Clean markdown wrappers
        const cleanedResponse = response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        // Convert JSON string to object
        return JSON.parse(cleanedResponse);

    } catch (error) {

        console.error(
            '❌ AI conversation analysis failed'
        );

        console.error(error);

        return {
            paymentStatus: 'Pending',
            delayedDays: 0,
            escalation: false,
            customerIntent: 'Unknown'
        };
    }
}
