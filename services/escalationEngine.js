export function determineEscalation(
    existingCustomer,
    analysis
) {

    // Rule 1
    // Delay greater than 3 days
    if (analysis.delayedDays > 3) {

        return {
            escalation: true,
            reason: 'Delay exceeds 3 days'
        };
    }

    // Rule 2
    // Repeated delays extending beyond 3 days total
    const previousDelay =
        existingCustomer["Delayed Days"] || 0;

    const totalDelay =
        previousDelay + analysis.delayedDays;

    if (
        previousDelay > 0 &&
        totalDelay > 3
    ) {

        return {
            escalation: true,
            reason: 'Repeated delay beyond threshold'
        };
    }

    // Rule 3
    // Payment refusal
    if (
        analysis.customerIntent === 'Payment Risk'
    ) {

        return {
            escalation: true,
            reason: 'Customer refused payment'
        };
    }

    // Rule 4
    // No response multiple times
    const noResponseCount =
        existingCustomer["No Response Count"] || 0;

    if (noResponseCount >= 3) {

        return {
            escalation: true,
            reason: 'Customer unreachable multiple times'
        };
    }

    // Default
    return {
        escalation: false,
        reason: ''
    };
}