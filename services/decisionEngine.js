export function generateAIRecommendations(
    customers
) {

    const recommendations = [];


    customers.forEach(customer => {

        const delayedDays =

            Number(
                customer["Delayed Days"] || 0
            );

        const noResponseCount =

            Number(
                customer["No Response Count"] || 0
            );

        const recoveryScore =

            Number(
                customer.recoveryScore || 0
            );


        // HIGH RISK ESCALATION

        if (

            recoveryScore < 40

            ||

            delayedDays > 7

        ) {

            recommendations.push({

                type: 'Escalation',

                priority: 'High',

                customer:
                    customer.Name,

                invoice:
                    customer.Invoice,

                action:
                    '⚠️ Immediate supervisor escalation recommended'
            });
        }


        // RETRY CALL

        else if (

            noResponseCount >= 2

        ) {

            recommendations.push({

                type: 'Retry',

                priority: 'Medium',

                customer:
                    customer.Name,

                invoice:
                    customer.Invoice,

                action:
                    '🔁 Retry customer call within 24 hours'
            });
        }


        // FOLLOW-UP REMINDER

        else if (

            delayedDays > 3

        ) {

            recommendations.push({

                type: 'Reminder',

                priority: 'Medium',

                customer:
                    customer.Name,

                invoice:
                    customer.Invoice,

                action:
                    '📧 Send payment follow-up reminder'
            });
        }


        // NORMAL MONITORING

        else {

            recommendations.push({

                type: 'Monitoring',

                priority: 'Low',

                customer:
                    customer.Name,

                invoice:
                    customer.Invoice,

                action:
                    '✅ Continue workflow monitoring'
            });
        }
    });


    // SORT BY PRIORITY

    const priorityMap = {

        High: 3,

        Medium: 2,

        Low: 1
    };

    recommendations.sort(

        (a, b) =>

            priorityMap[b.priority]

            -

            priorityMap[a.priority]
    );

    return recommendations
    .filter(
        rec => rec.priority !== 'Low'
    )
    .slice(0, 10);
}