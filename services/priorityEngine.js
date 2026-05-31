export function calculatePriorityScore(
    customer
) {

    let score = 0;


    // HIGH DUE AMOUNT

    score +=
        Number(
            customer["Due Amount"] || 0
        ) / 1000;


    // DELAY IMPACT

    score +=
        Number(
            customer["Delayed Days"] || 0
        ) * 5;


    // NO RESPONSE IMPACT

    score +=
        Number(
            customer["No Response Count"] || 0
        ) * 15;


    // ESCALATION BOOST

    if (

        customer["Escalation Status"] ===
        'Yes'

    ) {

        score += 40;
    }


    // LOW RECOVERY SCORE BOOST

    const recoveryScore =
        Number(
            customer.recoveryScore || 0
        );

    score +=
        (100 - recoveryScore);


    return Math.round(score);
}
