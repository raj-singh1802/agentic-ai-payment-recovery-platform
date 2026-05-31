export function analyzeConversation(transcript) {

    const lowerTranscript = transcript.toLowerCase();

    // Default result
    const result = {
        paymentStatus: 'Pending',
        delayedDays: 0,
        escalation: false,
        customerIntent: 'Unknown'
    };

    // Detect payment completed
    if (
        lowerTranscript.includes('already paid') ||
        lowerTranscript.includes('payment done') ||
        lowerTranscript.includes('paid already')
    ) {

        result.paymentStatus = 'Paid';

        result.customerIntent = 'Payment Completed';

        return result;
    }

    // Detect numeric delays
    const numericDelayMatch = lowerTranscript.match(
        /(\d+)\s*(more\s*)?(day|days)/i
    );

    if (numericDelayMatch) {

        const days = parseInt(numericDelayMatch[1]);

        result.paymentStatus = 'Delayed';

        result.delayedDays = days;

        result.customerIntent = 'Payment Delayed';

        if (days > 3) {
            result.escalation = true;
        }

        return result;
    }

    // Detect word-based delays
    const wordToNumber = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5
    };

    const wordDelayMatch = lowerTranscript.match(
        /(one|two|three|four|five)[-\s]*(day|days)/i
    );

    if (wordDelayMatch) {

        const word = wordDelayMatch[1];

        const days = wordToNumber[word];

        result.paymentStatus = 'Delayed';

        result.delayedDays = days;

        result.customerIntent = 'Payment Delayed';

        if (days > 3) {
            result.escalation = true;
        }

        return result;
    }

    // Detect payment refusal / escalation risk
    if (
        lowerTranscript.includes('cannot pay') ||
        lowerTranscript.includes('not possible') ||
        lowerTranscript.includes('no money')
    ) {

        result.paymentStatus = 'Escalated';

        result.escalation = true;

        result.customerIntent = 'Payment Risk';

        return result;
    }

    return result;
}