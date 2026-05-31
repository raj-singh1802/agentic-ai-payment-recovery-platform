export function calculateRecoveryScore(
    customer
) {

    let score = 100;


    // DELAY PENALTY

    const delayedDays =

        Number(
            customer["Delayed Days"] || 0
        );

    score -= delayedDays * 5;


    // NO RESPONSE PENALTY

    const noResponseCount =

        Number(
            customer["No Response Count"] || 0
        );

    score -= noResponseCount * 15;


    // ESCALATION PENALTY

    if (

        customer["Escalation Status"] ===
        'Yes'

    ) {

        score -= 25;
    }


    // PAYMENT STATUS BONUS

    if (

        customer["Payment Status"] ===
        'Paid'

    ) {

        score = 100;
    }


    // FLOOR + CEILING

    if (score < 0) {

        score = 0;
    }

    if (score > 100) {

        score = 100;
    }


    // RISK LABEL

    let riskLevel = 'Low';

    if (score < 70) {

        riskLevel = 'Medium';
    }

    if (score < 40) {

        riskLevel = 'High';
    }


    return {

        score,

        riskLevel
    };
}
