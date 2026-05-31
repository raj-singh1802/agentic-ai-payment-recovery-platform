const workflowHistory = {};

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