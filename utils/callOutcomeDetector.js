export function detectCallOutcome(call) {

    const summary =
        (call.summary || '')
        .toLowerCase();

    const endReason =
        (call.endReason || '')
        .toLowerCase();

    // Successful interaction
    if (
        summary.length > 20 &&
        !summary.includes('no answer') &&
        !summary.includes('voicemail') &&
        !summary.includes('unreachable')
    ) {

        return {
            customerResponded: true
        };
    }

    // Unreachable patterns
    if (
        summary.includes('no answer') ||
        summary.includes('voicemail') ||
        summary.includes('unreachable') ||
        endReason.includes('failed')
    ) {

        return {
            customerResponded: false
        };
    }

    // Default fallback
    return {
        customerResponded: false
    };
}