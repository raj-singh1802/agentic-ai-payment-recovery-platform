import https from 'https';

import dotenv from 'dotenv';

dotenv.config();

const ULTRAVOX_API_KEY =
    process.env.ULTRAVOX_API_KEY;

console.log(
    '🔑 Ultravox API Key Loaded:',
    !!ULTRAVOX_API_KEY
);

export async function createUltravoxCall(
    prompt
) {

    const callConfig = {

        systemPrompt: prompt,

        model: 'ultravox-v0.7',

        voice:
            '9f6262e3-1b03-4a0b-9921-50b9cff66a43',

        temperature: 0.3,

        firstSpeakerSettings: {
            agent: {}
        },

        medium: {
            twilio: {}
        }
    };

    return new Promise((resolve, reject) => {

        const request = https.request(
            'https://api.ultravox.ai/api/calls',
            {
                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json',

                    'X-API-Key':
                        ULTRAVOX_API_KEY
                }
            }
        );

        let data = '';

        request.on(
            'response',
            (response) => {

                response.on(
                    'data',
                    chunk => data += chunk
                );

                response.on(
                    'end',
                    () => {

                        try {

                            const parsedData =
                                JSON.parse(data);

                            console.log(
                                '📡 Ultravox Response:'
                            );

                            console.log(parsedData);

                            if (
                                response.statusCode >= 200 &&
                                response.statusCode < 300
                            ) {

                                resolve(parsedData);

                            } else {

                                reject(
                                    new Error(data)
                                );
                            }

                        } catch (err) {

                            reject(err);
                        }
                    }
                );
            }
        );

        request.on('error', reject);

        request.write(
            JSON.stringify(callConfig)
        );

        request.end();
    });
}