const workflowHistory = {

    INV001: [

        {
            timestamp: '2026-06-01 10:30 AM',
            event: '📞 AI Call Attempted'
        },

        {
            timestamp: '2026-06-02 11:15 AM',
            event: '📧 Reminder Email Sent'
        },

        {
            timestamp: '2026-06-03',
            event: '🤝 Customer Promised Payment'
        },

        {
            timestamp: '2026-06-04',
            event: '⚠️ Escalated To Supervisor'
        }
    ],

    INV002: [

        {
            timestamp: '2026-06-02',
            event: '📞 AI Call Attempted'
        },

        {
            timestamp: '2026-06-03',
            event: '📧 Reminder Email Sent'
        }
    ]
};


export function addWorkflowEvent(
    invoiceNumber,
    event
) {

    if (

        !workflowHistory[invoiceNumber]

    ) {

        workflowHistory[invoiceNumber] = [];
    }

    workflowHistory[invoiceNumber].unshift({

        event,

        timestamp:
            new Date().toLocaleString()
    });
}

export function getWorkflowHistory(
    invoiceNumber
) {

    return (
        workflowHistory[invoiceNumber]
        || []
    );
}