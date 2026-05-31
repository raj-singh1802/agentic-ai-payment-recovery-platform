import nodemailer from 'nodemailer';

import dotenv from 'dotenv';

dotenv.config();

const transporter =
    nodemailer.createTransport({

        service: 'gmail',

        auth: {

            user:
                process.env.AGENT_EMAIL,

            pass:
                process.env.AGENT_EMAIL_PASSWORD
        }
    });

transporter.verify((error, success) => {

    if (error) {

        console.error(
            '❌ SMTP Connection Failed'
        );

        console.error(error);

    } else {

        console.log(
            '✅ SMTP Server Ready'
        );
    }
});

function isValidEmail(email) {

    return (
        email &&
        typeof email === 'string' &&
        email.includes('@')
    );
}

function isPlaceholderEmail(email) {

    if (!email || typeof email !== 'string') {

        return true;
    }

    const normalizedEmail =
        email.toLowerCase();

    return (
        normalizedEmail.includes('company_admin') ||
        normalizedEmail.includes('placeholder') ||
        normalizedEmail.includes('example') ||
        normalizedEmail.includes('test_admin') ||
        normalizedEmail.includes('generated')
    );
}

function buildBaseMailOptions(to) {

    return {
        from:
            `"AI Collections System" <${process.env.AGENT_EMAIL}>`,

        to
    };
}

function logEmailSendAttempt(recipientEmail) {

    console.log(
        '📧 Sending email to:',
        recipientEmail
    );

    console.log(
        '📨 Sender email:',
        process.env.AGENT_EMAIL
    );
}

export async function sendCustomerDueEmail({

    customer,
    summary

}) {

    const recipientEmail =
        customer.Email;

    if (!isValidEmail(recipientEmail)) {

        console.log('❌ Invalid email');

        return;
    }

    try {

        logEmailSendAttempt(
            recipientEmail
        );

        const mailOptions = {

            ...buildBaseMailOptions(recipientEmail),

            subject:
`Payment Due Reminder - ${customer.Invoice}`,

            text:
`
Dear ${customer.Name},

This is a reminder that your payment is still due.

Invoice:
${customer.Invoice}

Due Amount:
₹${customer["Due Amount"]}

Due Date:
${customer["Due Date"]}

Please complete the payment at your earliest convenience. If you have already paid, please ignore this reminder or contact support with your payment details.

Latest Call Summary:
${summary || 'No call summary available.'}

- AI Collections System
`
        };

        const result =
            await transporter.sendMail(
                mailOptions
            );

        console.log(
            `Customer due email sent to ${recipientEmail}`
        );

        console.log(result.response);

        return result;

    } catch (error) {

        console.error(
            'Failed to send customer due email'
        );

        console.error(error);
    }
}

export async function sendEscalationEmail({

    adminEmail,
    customer,
    escalationReason,
    summary

}) {

    console.log(
        '📬 Admin email target:',
        adminEmail
    );

    if (!adminEmail) {

        console.warn(
            '⚠️ Admin email is missing from Excel'
        );
    }

    if (isPlaceholderEmail(adminEmail)) {

        console.warn(
            '⚠️ Admin email looks like a placeholder/generated value:',
            adminEmail
        );
    }

    if (!isValidEmail(adminEmail)) {

        console.log('❌ Invalid email');

        return;
    }

    try {

        logEmailSendAttempt(
            adminEmail
        );

        const mailOptions = {

            ...buildBaseMailOptions(adminEmail),

            subject:
`Escalated Payment Case - ${customer.Invoice}`,

            text:
`
Customer payment case has been escalated.

Customer Name:
${customer.Name}

Invoice:
${customer.Invoice}

Due Amount:
₹${customer["Due Amount"]}

Delayed Days:
${customer["Delayed Days"]}

Escalation Reason:
${escalationReason}

Latest Conversation Summary:
${summary}

Supervisor has already been notified.

- AI Collections System
`
        };

        const result =
            await transporter.sendMail(
                mailOptions
            );

        console.log(
            `Escalation email sent to ${adminEmail}`
        );

        console.log(result.response);

        return result;

    } catch (error) {

        console.error(
            'Failed to send escalation email'
        );

        console.error(error);
    }
}
