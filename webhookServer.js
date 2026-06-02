import express from 'express';

import http from 'http';

import {
    Server
}
from 'socket.io';

import path from 'path';

import { fileURLToPath }
from 'url';

import {
    processWebhook
}
from './services/webhookProcessor.js';

import {
    readCustomerData
}
from './services/excelReader.js';

import {
    getActivities,
    logActivity
}
from './services/activityLogger.js';

import {
    calculateRecoveryScore
}
from './services/riskScoringEngine.js';

import {
    calculatePriorityScore
}
from './services/priorityEngine.js';

import {
    getWorkflowHistory
}
from './services/workflowHistoryStore.js';

import {

    generateAIRecommendations

}
from './services/decisionEngine.js';

const app = express();

app.use(express.json());

app.get('/api/activity', (req, res) => {

    res.json(
        getActivities()
    );
});

app.get(

    '/api/workflow/:invoice',

    (req, res) => {

        const invoiceNumber =
            req.params.invoice;

        console.log(
            'Invoice Requested:',
            invoiceNumber
        );

        const history =
            getWorkflowHistory(
                invoiceNumber
            );

        console.log(
            'History Found:',
            history
        );

        res.json(history);
    }
);


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


// SERVE FRONTEND

app.use(
    express.static(
        path.join(__dirname, 'frontend')
    )
);


// HOME ROUTE

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'frontend',
            'index.html'
        )
    );
});


// CUSTOMERS API

app.get('/api/customers', (req, res) => {


    try {

        const customers =
            readCustomerData();

        const enrichedCustomers =

            customers.map(customer => {

                const riskData =

                    calculateRecoveryScore(
                        customer
                    );

                const priorityScore =
                    calculatePriorityScore({

                        ...customer,

                        recoveryScore:
                            riskData.score
                    });

                return {

                    ...customer,

                    recoveryScore:
                        riskData.score,

                    riskLevel:
                        riskData.riskLevel,

                    priorityScore
                };
            });

        res.json(enrichedCustomers);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                'Failed to fetch customers'
        });
    }
});


app.get(

    '/api/recommendations',

    (req, res) => {

        try {

            const customers =
                readCustomerData();

            const enrichedCustomers =

                customers.map(customer => {

                    const riskData =

                        calculateRecoveryScore(
                            customer
                        );

                    return {

                        ...customer,

                        recoveryScore:
                            riskData.score
                    };
                });

            const recommendations =

                generateAIRecommendations(
                    enrichedCustomers
                );

            res.json(
                recommendations
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({

                error:
                    'Failed to generate AI recommendations'
            });
        }
    }
);

// ESCALATIONS API

app.get(
    '/api/escalations',
    (req, res) => {

        try {

            const customers =
                readCustomerData();

            const escalated =
                customers.filter(
                    customer =>
                        customer["Escalation Status"] === 'Yes'
                );

            res.json(escalated);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    'Failed to fetch escalations'
            });
        }
    }
);






// WEBHOOK

app.post('/webhook', async (req, res) => {

    console.log('📞 Webhook received');

    await processWebhook(req.body);

    res.status(200).send('OK');
});


// TWIML ROUTE

app.post('/twiml', (req, res) => {

    const websocketUrl =
        req.query.ws;

    const twiml = `
<Response>
    <Connect>
        <Stream url="${websocketUrl}" />
    </Connect>
</Response>
`;

    res.type('text/xml');

    res.send(twiml);
});


// SERVER START

const PORT = 3000;

const server =
    http.createServer(app);

const io =
    new Server(server);

global.io = io;

logActivity(
    '🚀 Server Started'
);

logActivity(
    '🚀 AI Collections Platform Started'
);

logActivity(
    '📊 Dashboard Monitoring Active'
);

logActivity(
    '🤖 AI Recovery Engine Ready'
);

server.listen(PORT, () => {

    console.log(
        `🚀 Webhook server running on port ${PORT}`
    );
});
