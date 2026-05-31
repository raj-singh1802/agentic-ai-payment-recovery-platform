import {
    calculateCommitmentDate
}
from '../utils/dateUtils.js';

import {
    analyzeConversationAI
}
from './aiConversationAnalyzer.js';

import {
    updateCustomerStatus,
    getCustomerByInvoice
}
from './excelUpdater.js';

import {
    determineEscalation
}
from './escalationEngine.js';

import {
    detectCallOutcome
}
from '../utils/callOutcomeDetector.js';

import {
    callSupervisor
}
from './supervisorCall.js';

import {
    sendCustomerDueEmail,
    sendEscalationEmail
}
from './emailService.js';

import {
    logActivity
}
from './activityLogger.js';

import {
    addWorkflowEvent
}
from './workflowHistoryStore.js';


// Prevent duplicate webhook processing

const processedCallIds =
    new Set();


// Extract invoice safely

function getInvoiceNumberFromPrompt(
    systemPrompt = ''
) {

    const markerMatch =
        systemPrompt.match(
            /INVOICE_NUMBER:\s*(INV\d+)/i
        );

    if (markerMatch) {

        return markerMatch[1];
    }

    const invoiceMatch =
        systemPrompt.match(
            /Invoice(?:\s+Number)?:\s*(INV\d+)/i
        );

    return invoiceMatch?.[1];
}


export async function processWebhook(
    payload
) {

    try {

        console.log(
            'Processing webhook...'
        );

        const call =
            payload.call;

        if (!call) {

            console.log(
                'Invalid webhook payload'
            );

            return;
        }


        // DUPLICATE WEBHOOK PROTECTION

        const callId =
            call.callId;

        if (
            processedCallIds.has(callId)
        ) {

            console.log(
                'Duplicate webhook ignored:',
                callId
            );

            return;
        }

        processedCallIds.add(callId);

        console.log(
            'Processing new call:',
            callId
        );


        // IGNORE SUPERVISOR CALL WEBHOOKS

        if (

            call.systemPrompt?.includes(
                'CALL_TYPE:SUPERVISOR'
            ) ||

            call.systemPrompt?.includes(
                'CALL_TYPE: SUPERVISOR_ESCALATION'
            ) ||

            call.systemPrompt?.includes(
                'professional escalation assistant'
            )

        ) {

            console.log(
                'Skipping supervisor escalation webhook'
            );

            return;
        }


        const summary =
            call.summary || '';

        console.log(
            'Summary:'
        );

        console.log(summary);


        logActivity(
            'AI customer call completed'
        );


        // AI ANALYSIS

        const analysis =
            await analyzeConversationAI(
                summary
            );

        console.log(
            'Analysis Result:'
        );

        console.log(analysis);


        logActivity(
            `AI detected ${analysis.delayedDays} delayed days`
        );


        // COMMITMENT DATE

        const commitmentDate =
            calculateCommitmentDate(
                analysis.delayedDays
            );

        console.log(
            'Commitment Date:',
            commitmentDate
        );


        // EXTRACT INVOICE

        const invoiceNumber =
            getInvoiceNumberFromPrompt(
                call.systemPrompt
            );

        if (!invoiceNumber) {

            console.log(
                'Invoice not found'
            );

            return;
        }

        console.log(
            `Invoice: ${invoiceNumber}`
        );

        logActivity(
            `📄 Processing invoice ${invoiceNumber}`
        );

        addWorkflowEvent(

            invoiceNumber,

            '📞 AI customer call completed'
        );

        addWorkflowEvent(

            invoiceNumber,

            `🧠 AI analyzed payment delay: ${analysis.delayedDays} days`
        );


        // CUSTOMER STATE

        const existingCustomer =
            getCustomerByInvoice(
                invoiceNumber
            );

        if (!existingCustomer) {

            console.log(
                'Customer not found'
            );

            return;
        }

        console.log(
            'Existing Customer State:'
        );

        console.log(existingCustomer);

        logActivity(
            `👤 Customer loaded: ${existingCustomer.Name}`
        );


        // CALL OUTCOME

        const callOutcome =
            detectCallOutcome(call);

        console.log(
            'Call Outcome:',
            callOutcome
        );


        // NO RESPONSE COUNT

        let updatedNoResponseCount = 0;

        if (

            analysis.customerIntent ===
            'Unreachable'

            ||

            !callOutcome.customerResponded

        ) {

            updatedNoResponseCount =

                Number(
                    existingCustomer[
                        "No Response Count"
                    ] || 0
                ) + 1;

        } else {

            updatedNoResponseCount = 0;
        }

        console.log(
            'Updated No Response Count:',
            updatedNoResponseCount
        );


        // ESCALATION ENGINE

        const escalationDecision =

            determineEscalation(

                {
                    ...existingCustomer,

                    "No Response Count":
                        updatedNoResponseCount
                },

                analysis
            );

        console.log(
            'Escalation Decision:'
        );

        console.log(
            escalationDecision
        );


        // CUSTOMER EMAIL

        if (
            analysis.paymentStatus !==
            'Paid'
        ) {

            try {

                await sendCustomerDueEmail({

                    customer:
                        existingCustomer,

                    summary
                });

                addWorkflowEvent(

                    invoiceNumber,

                    '📧 Customer reminder email sent'
                );

                logActivity(
                    'Customer due email sent'
                );

            } catch (error) {

                console.error(
                    'Customer email failed'
                );

                console.error(error);
            }
        }


        // ESCALATION FLOW

        if (
            escalationDecision.escalation
        ) {

            addWorkflowEvent(

                invoiceNumber,

                `⚠️ Escalation triggered: ${escalationDecision.reason}`
            );

            logActivity(
                'Escalation triggered'
            );


            // SUPERVISOR CALL

            try {

                await callSupervisor({

                    customer: {

                        ...existingCustomer,

                        "Escalation Status":
                            escalationDecision.reason
                    }
                });

                addWorkflowEvent(

                    invoiceNumber,

                    '📞 Supervisor escalation call initiated'
                );

                logActivity(
                    'Supervisor notified'
                );

            } catch (error) {

                console.error(
                    'Supervisor call failed'
                );

                console.error(error);
            }


            // ADMIN EMAIL

            try {

                await sendEscalationEmail({

                    adminEmail:
                        existingCustomer[
                            "Admin Email"
                        ],

                    customer:
                        existingCustomer,

                    escalationReason:
                        escalationDecision.reason,

                    summary
                });

                addWorkflowEvent(

                    invoiceNumber,

                    '📧 Admin escalation email sent'
                );

                logActivity(
                    'Escalation email sent'
                );

            } catch (error) {

                console.error(
                    'Escalation email failed'
                );

                console.error(error);
            }
        }


        // UPDATE EXCEL

        updateCustomerStatus(

            invoiceNumber,

            {

                "Payment Status":

                    escalationDecision.escalation
                        ? 'Escalated'
                        : analysis.paymentStatus,

                "Delayed Days":

                    Number(
                        existingCustomer[
                            "Delayed Days"
                        ] || 0
                    )

                    +

                    Number(
                        analysis.delayedDays || 0
                    ),

                "Escalation Status":

                    escalationDecision.escalation
                        ? 'Yes'
                        : 'No',

                "Last Commitment Date":
                    commitmentDate,

                "No Response Count":
                    updatedNoResponseCount
            }
        );
        
        addWorkflowEvent(
            invoiceNumber,
            '💾 Customer record updated'
        );

        logActivity(
            `💾 Excel updated for ${invoiceNumber}`
        );

        logActivity(
            'Workflow completed successfully'
        );

        console.log(
            'Workflow completed'
        );

    } catch (error) {

        console.error(
            'Webhook processing failed'
        );

        console.error(error);

        logActivity(
            'Workflow execution failed'
        );
    }
}
