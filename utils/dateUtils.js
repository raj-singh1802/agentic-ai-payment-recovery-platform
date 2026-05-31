export function calculateCommitmentDate(
    delayedDays
) {

    try {

        const days =
            Number(delayedDays || 0);

        // Fresh current date
        const currentDate =
            new Date();

        // Create NEW date object
        const commitmentDate =
            new Date(currentDate);

        // Add delayed days safely
        commitmentDate.setDate(
            commitmentDate.getDate() + days
        );

        // Format YYYY-MM-DD
        const formattedDate =
            commitmentDate
                .toISOString()
                .split('T')[0];

        return formattedDate;

    } catch (error) {

        console.error(
            '❌ Commitment date calculation failed'
        );

        console.error(error);

        return '';
    }
}