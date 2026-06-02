let socket = null;

if (typeof io !== 'undefined') {

    socket = io();
}

let allCustomers = [];

let paymentStatusChart;

let delayChart;

function getStatusClass(status) {

    if (status === 'Paid') {

        return 'status-paid';
    }

    if (status === 'Escalated') {

        return 'status-escalated';
    }

    return 'status-pending';
}

function formatAmount(amount) {

    if (
        amount === undefined ||
        amount === null ||
        amount === ''
    ) {

        return '-';
    }

    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function renderCustomers(customers) {

    customers.sort(

        (a, b) =>

            (b.priorityScore || 0)

            -

            (a.priorityScore || 0)
    );

    const tableBody =
        document.getElementById(
            'customerTableBody'
        );

    if (tableBody) {

        tableBody.innerHTML = '';

        customers.forEach(customer => {



            const status =
                customer["Payment Status"] || 'Pending';

            const row =
                document.createElement('tr');

            row.innerHTML = `
                        <td>

                            <span

                                class="customer-link"

                                onclick="openEscalationCustomer('${customer.Invoice}')"

                            >

                                ${customer.Name || '-'}

                            </span>

                        </td>
                        <td>${customer.Invoice || '-'}</td>
            <td>${formatAmount(customer["Due Amount"])}</td>
            <td class="${getStatusClass(status)}">${status}</td>
            <td>${customer["Delayed Days"] || 0}</td>
            <td>${customer["Last Commitment Date"] || '-'}</td>
            <td>${customer["Escalation Status"] || 'No'}</td>
            <td>${customer.recoveryScore || 0}%</td>
            <td>🔥 ${customer.priorityScore || 0}</td>
        `;

            row.style.cursor = 'pointer';



            tableBody.appendChild(row);
        });
    }

    const totalCustomers =
        document.getElementById(
            'totalCustomers'
        );

    if (totalCustomers) {

        totalCustomers.innerText =
            customers.length;
    }

    const pendingPayments =
        document.getElementById(
            'pendingPayments'
        );

    if (pendingPayments) {

        pendingPayments.innerText =
            customers.filter(
                customer =>
                    customer["Payment Status"] === 'Pending' ||
                    customer["Payment Status"] === 'Delayed'
            ).length;
    }

    const escalatedCases =
        document.getElementById(
            'escalatedCases'
        );

    if (escalatedCases) {

        escalatedCases.innerText =
            customers.filter(
                customer =>
                    customer["Escalation Status"] === 'Yes' ||
                    customer["Payment Status"] === 'Escalated'
            ).length;
    }

    const callsToday =
        document.getElementById(
            'callsToday'
        );

    if (callsToday) {

        callsToday.innerText =
            customers.filter(
                customer =>
                    customer["Last Commitment Date"]
            ).length;
    }
}

function applyFilters() {

    const searchInput =
        document.getElementById(
            'searchInput'
        );

    const statusFilter =
        document.getElementById(
            'statusFilter'
        );

    const searchValue =
        searchInput
            ? searchInput.value.toLowerCase()
            : '';

    const statusValue =
        statusFilter
            ? statusFilter.value
            : 'All';

    const filteredCustomers =
        allCustomers.filter(customer => {

            const name =
                (customer.Name || '')
                .toLowerCase();

            const invoice =
                (customer.Invoice || '')
                .toLowerCase();

            const email =
                (customer.Email || '')
                .toLowerCase();

            const status =
                customer["Payment Status"] || '';

            const matchesSearch =
                name.includes(searchValue) ||
                invoice.includes(searchValue) ||
                email.includes(searchValue);

            const matchesStatus =
                statusValue === 'All' ||
                status === statusValue;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    renderCustomers(filteredCustomers);

    if (
        dashboardHasCharts &&
        typeof dashboardHasCharts !== 'undefined'
    ) {
        renderCharts(
            filteredCustomers
        );
    }

}

function renderCharts(customers) {

    if (typeof Chart === 'undefined') {

        console.error(
            'Chart.js failed to load'
        );

        return;
    }

    // PAYMENT STATUS

    const paidCount =
        customers.filter(
            customer =>
                customer["Payment Status"] === 'Paid'
        ).length;

    const pendingCount =
        customers.filter(
            customer =>

                customer["Payment Status"] === 'Pending'

                ||

                customer["Payment Status"] === 'Delayed'
        ).length;

    const escalatedCount =
        customers.filter(
            customer =>

                customer["Payment Status"] === 'Escalated'

                ||

                customer["Escalation Status"] === 'Yes'
        ).length;


    // DELAY DISTRIBUTION

    let lowDelay = 0;
    let mediumDelay = 0;
    let highDelay = 0;

    customers.forEach(customer => {

        const delay =
            Number(
                customer["Delayed Days"] || 0
            );

        if (delay <= 3) {

            lowDelay++;

        } else if (delay <= 7) {

            mediumDelay++;

        } else {

            highDelay++;
        }
    });


    // DESTROY OLD CHARTS

    if (paymentStatusChart) {

        paymentStatusChart.destroy();
    }

    if (delayChart) {

        delayChart.destroy();
    }


    // PAYMENT PIE CHART

    const paymentCanvas =
        document.getElementById(
            'paymentStatusChart'
        );

    if (!paymentCanvas) return;

    const paymentCtx = paymentCanvas.getContext('2d');

    paymentStatusChart = new Chart(paymentCtx, {

            type: 'pie',

            data: {

                labels: [
                    'Paid',
                    'Pending',
                    'Escalated'
                ],

                datasets: [{

                    data: [
                        paidCount,
                        pendingCount,
                        escalatedCount
                    ],

                    backgroundColor: [
                        '#22c55e',
                        '#facc15',
                        '#ef4444'
                    ]
                }]
            }
        });


    // DELAY BAR CHART

    const delayCanvas =
        document.getElementById(
            'delayChart'
        );

    if (delayCanvas) {

        const delayCtx = delayCanvas.getContext('2d');

        delayChart = new Chart(delayCtx, {

            type: 'bar',

            data: {

                labels: [
                    '0-3 Days',
                    '4-7 Days',
                    '7+ Days'
                ],

                datasets: [{

                    label:
                        'Customers',

                    data: [
                        lowDelay,
                        mediumDelay,
                        highDelay
                    ],

                    backgroundColor: [
                        '#38bdf8',
                        '#facc15',
                        '#ef4444'
                    ]
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        labels: {

                            color: 'white'
                            }
                    }
                },

                scales: {

                    x: {

                        ticks: {

                            color: 'white'
                        }
                    },

                    y: {

                        ticks: {

                            color: 'white'
                        }
                    }
                }
            }
        });
    }
}

async function openCustomerModal(customer) {



    const response =
        await fetch(

            `/api/workflow/${customer.Invoice}`
        );

    const workflowHistory =
        await response.json();

    const modal =
        document.getElementById(
            'customerModal'
        );

    const modalBody =
        document.getElementById(
            'modalBody'
        );

    if (!modal || !modalBody) return;

    const timelineHtml =
        workflowHistory.length
            ? workflowHistory.map(item => `

                <div class="timeline-item">

                    <strong>
                        ${item.timestamp}
                    </strong>

                    <br/>

                    ${item.event}

                </div>

            `).join('')
            : '<p>No workflow history yet.</p>';

    modalBody.innerHTML = `

        <div class="customer-grid">


            <div class="modal-card customer-card">

                <h3>
                    Customer Information
                </h3>

                <p>

                <strong>Name:</strong>
                ${customer.Name || '-'}
            </p>

            <p>
                <strong>Email:</strong>
                ${customer.Email || '-'}
            </p>

            <p>
                <strong>Phone:</strong>
                ${customer["Contact Number"] || '-'}
            </p>

        </div>


            <div class="modal-card customer-card">

                <h3>
                    Invoice Details
                </h3>


            <p>
                <strong>Invoice:</strong>
                ${customer.Invoice || '-'}
            </p>

            <p>
                <strong>Due Amount:</strong>
                ${formatAmount(customer["Due Amount"])}
            </p>

            <p>
                <strong>Due Date:</strong>
                ${customer["Due Date"] || '-'}
            </p>

        </div>


        <div class="modal-card">

            <h3>
                AI Workflow State
            </h3>

            <p>
                <strong>Status:</strong>
                ${customer["Payment Status"] || '-'}
            </p>

            <p>
                <strong>Delayed Days:</strong>
                ${customer["Delayed Days"] || 0}
            </p>

            <p>
                <strong>Escalated:</strong>
                ${customer["Escalation Status"] || 'No'}
            </p>

        </div>


            <div class="modal-card customer-card">

                <h3>
                    Recovery Intelligence
                </h3>


            <p>
                <strong>Commitment Date:</strong>
                ${
                    customer[
                        "Last Commitment Date"
                    ] || '-'
                }
            </p>

            <p>
                <strong>No Response Count:</strong>
                ${
                    customer[
                        "No Response Count"
                    ] || 0
                }
            </p>

            <p>
                <strong>Admin Email:</strong>
                ${
                    customer[
                        "Admin Email"
                    ] || '-'
                }
            </p>

        </div>


            <div class="modal-card">

                <h3>
                    AI Recovery Intelligence
                </h3>

            <p>
                <strong>
                    Recovery Probability:
                </strong>

                ${customer.recoveryScore || 0}%
            </p>

            <p>

                <strong>
                    Risk:
                </strong>

                <span

                    class="risk-badge"

                    data-risk="${customer.riskLevel || 'Low'}"

                >

                    ${customer.riskLevel || 'Low'}

                </span>

            </p>


        </div>


        <div class="modal-card">

            <h3>
                AI Priority Intelligence
            </h3>

            <p>
                <strong>
                    Priority Score:
                </strong>

                🔥 ${customer.priorityScore || 0}
            </p>

            <p>
                Higher score means
                higher recovery urgency.
            </p>

        </div>


        <div class="modal-card">

            <h3>
                Workflow Timeline
            </h3>

            <div class="timeline">

                ${
                    workflowHistory.length

                    ?

                    workflowHistory.map(item => `

                        <div class="timeline-item">

                            <strong>
                                ${item.timestamp}
                            </strong>

                            <br/>

                            ${item.event}

                        </div>

                    `).join('')

                    :

                    '<p>No workflow history yet.</p>'
                }

            </div>

        </div>

    `;

    modal.style.display = 'block';
}

async function loadCustomers() {

    try {

        const response =
            await fetch('/api/customers');

        if (!response.ok) {

            throw new Error(
                `Customer API failed: ${response.status}`
            );
        }

        const customers =
            await response.json();

        allCustomers = customers;

        applyFilters();

    } catch (error) {

        console.error(
            'Failed to load customers',
            error
        );
    }
}

window.openEscalationCustomer = function openEscalationCustomer(invoiceNumber) {

    const customer =
        allCustomers.find(
            customer =>
                customer.Invoice ===
                invoiceNumber
        );

    if (!customer) {

        console.error(
            'Customer not found'
        );

        return;
    }

    openCustomerModal(customer);
}

async function loadActivities() {

    try {

        if (!document.getElementById('activityFeed')) return;

        const response =
            await fetch('/api/activity');

        if (!response.ok) {

            throw new Error(
                `Activity API failed: ${response.status}`
            );
        }

        const activities =
            await response.json();

        const activityFeed =
            document.getElementById(
                'activityFeed'
            );

        activityFeed.innerHTML = '';

        if (!activities.length) {

            activityFeed.innerHTML = `
                <div class="activity-item">
                    No workflow activity yet.
                </div>
            `;

            return;
        }

        activities.forEach(activity => {

            const div =
                document.createElement('div');

            div.className =
                'activity-item';

            div.innerHTML = `
                <strong>${activity.timestamp}</strong>
                <br/>
                ${activity.message}
            `;

            activityFeed.appendChild(div);
        });

    } catch (error) {

        console.error(
            'Failed to load activities',
            error
        );
    }
}

async function loadRecommendations() {

    try {

        if (!document.getElementById('recommendationFeed')) return;

        const response =
            await fetch('/api/recommendations');

        if (!response.ok) {

            throw new Error(
                `Recommendations API failed: ${response.status}`
            );
        }

        const recommendations =
            await response.json();

        const recommendationFeed =

            document.getElementById(
                'recommendationFeed'
            );


        recommendationFeed.innerHTML = '';

        recommendations
            .slice(0, 10)
            .forEach(item => {

                const div =
                    document.createElement('div');

                div.className =
                    'activity-item';

                div.innerHTML = `

                    <strong>
                        ${item.priority} Priority
                    </strong>

                    <br/>

                    ${item.action}

                    <br/>

                    <small>
                        ${item.customer}
                        (${item.invoice})
                    </small>
                `;

                recommendationFeed.appendChild(div);
            });

    } catch (error) {

        console.error(
            'Failed to load recommendations'
        );
    }
}

async function loadEscalations() {

    const tableBody =
        document.getElementById(
            'escalationTableBody'
        );

    if (!tableBody) return;

    try {

        const response =
            await fetch(
                '/api/escalations'
            );

        const escalations =
            await response.json();

        tableBody.innerHTML = '';

        let totalRecovery = 0;

        escalations.forEach(
            customer => {

                totalRecovery +=
                    Number(
                        customer.recoveryScore || 0
                    );

                tableBody.innerHTML += `
                    <tr>

                        <td>

                            <span

                                class="customer-link"

                                onclick="openEscalationCustomer('${customer.Invoice}')"

                            >

                                ${customer.Name || '-'}

                            </span>

                        </td>

                        <td>${customer.Invoice || '-'}</td>

                        <td>₹${Number(
                            customer["Due Amount"]
                        ).toLocaleString('en-IN')}</td>

                        <td>${customer["Delayed Days"] || 0}</td>

                        <td>${Number(
                            customer.recoveryScore || 0
                        )}%</td>

                        <td>🔥 ${customer.priorityScore || 0}</td>

                        <td>Escalated</td>

                    </tr>
                `;
            }
        );

        const escalatedCountEl =
            document.getElementById(
                'escalatedCount'
            );

        if (escalatedCountEl) {
            escalatedCountEl.innerText = escalations.length;
        }

        const highRiskCountEl =
            document.getElementById(
                'highRiskCount'
            );

        if (highRiskCountEl) {
            highRiskCountEl.innerText = escalations.filter(
                customer =>
                    Number(customer.recoveryScore || 0) < 40
            ).length;
        }

        const avgRecoveryEl =
            document.getElementById(
                'avgRecoveryScore'
            );

        if (avgRecoveryEl) {
            avgRecoveryEl.innerText = escalations.length
                ? Math.round(
                    totalRecovery / escalations.length
                ) + '%'
                : '0%';
        }

        const supervisorCallsEl =
            document.getElementById(
                'supervisorCalls'
            );

        if (supervisorCallsEl) {
            supervisorCallsEl.innerText = escalations.length;
        }

        const feed =
            document.getElementById(
                'escalationActivityFeed'
            );

        if (feed) {

            const activityResponse =
                await fetch('/api/activity');

            const activities =
                await activityResponse.json();

            feed.innerHTML = activities
                .slice(0, 10)
                .map(activity => `
                    <div class="activity-item">

                        <strong>
                            ${activity.timestamp}
                        </strong>

                        <br>

                        ${activity.message}

                    </div>
                `)
                .join('');
        }

    } catch (error) {

        console.error(
            'Failed loading escalations',
            error
        );
    }
}

const dashboardHasCharts =
    document.getElementById(
        'paymentStatusChart'
    ) &&
    document.getElementById(
        'delayChart'
    );

const dashboardHasRecommendations =
    document.getElementById(
        'recommendationFeed'
    );

if (dashboardHasRecommendations) {

    loadActivities();

    loadRecommendations();
}




const closeModalBtn =
    document.getElementById(
        'closeModal'
    );

if (closeModalBtn) {

    closeModalBtn.addEventListener(
        'click',
        () => {

            document
                .getElementById(
                    'customerModal'
                )
                .style.display = 'none';
        }
    );
}

window.addEventListener('click', event => {

    const modal =
        document.getElementById(
            'customerModal'
        );

    if (event.target === modal) {

        modal.style.display = 'none';
    }
});

const searchInput =
    document.getElementById(
        'searchInput'
    );

if (searchInput) {

    searchInput.addEventListener(
        'input',
        applyFilters
    );
}

const statusFilter =
    document.getElementById(
        'statusFilter'
    );

if (statusFilter) {

    statusFilter.addEventListener(
        'change',
        applyFilters
    );
}

if (socket) {

    socket.on(
        'newActivity',
        activity => {

            console.log(
                '⚡ Live Activity:',
                activity
            );

            loadActivities();

            loadCustomers();

            loadRecommendations();

            loadEscalations();



        }
    );
}


loadCustomers();

if (
    document.getElementById(
        'escalationTableBody'
    )
) {

    loadEscalations();

}

async function loadActivityCenter() {

    const timeline =
        document.getElementById(
            'activityTimeline'
        );

    if (!timeline) return;

    try {

        const response =
            await fetch(
                '/api/activity'
            );

        if (!response.ok) {

            throw new Error(
                `Activity API failed: ${response.status}`
            );
        }

        const activities =
            await response.json();

        // KPI COUNTS

        const callsTodayCountEl =
            document.getElementById(
                'callsTodayCount'
            );

        const responsesCountEl =
            document.getElementById(
                'responsesCount'
            );

        const escalationCountEl =
            document.getElementById(
                'escalationCount'
            );

        const workflowEventsCountEl =
            document.getElementById(
                'workflowEventsCount'
            );

        if (workflowEventsCountEl) {

            workflowEventsCountEl.textContent =
                activities.length;
        }

        // Heuristic counts from the existing activity feed messages
        // (Improves immediately without requiring new backend endpoints)
        const callsToday =
            activities.filter(a =>
                (a.message || '').toLowerCase().includes('call attempted')
                || (a.message || '').toLowerCase().includes('ai initiated customer reminder call')
                || (a.message || '').toLowerCase().includes('ai call')
                || (a.message || '').toLowerCase().includes('call')
            ).length;

        const responsesCount =
            activities.filter(a =>
                (a.message || '').toLowerCase().includes('promised payment')
                || (a.message || '').toLowerCase().includes('payment')
                || (a.message || '').toLowerCase().includes('response')
                || (a.message || '').toLowerCase().includes('customer')
            ).length;

        const escalationCount =
            activities.filter(a =>
                (a.message || '').toLowerCase().includes('escalation triggered')
                || (a.message || '').toLowerCase().includes('escalated')
                || (a.message || '').toLowerCase().includes('supervisor')
                || (a.message || '').toLowerCase().includes('escalation')
            ).length;

        if (callsTodayCountEl) {
            callsTodayCountEl.textContent = callsToday;
        }

        if (responsesCountEl) {
            responsesCountEl.textContent = responsesCount;
        }

        if (escalationCountEl) {
            escalationCountEl.textContent = escalationCount;
        }

        timeline.innerHTML = '';

        if (!activities.length) {

            timeline.innerHTML = `
                <div class="activity-item">
                    No workflow activity yet.
                </div>
            `;

            return;
        }

        activities.forEach(activity => {


            timeline.innerHTML += `

                <div class="activity-card">

                    <div class="activity-time">
                        ${activity.timestamp}
                    </div>

                    <div class="activity-message">
                        ${activity.message}
                    </div>

                </div>

            `;
        });

    } catch (error) {

        console.error(
            'Failed to load activity timeline',
            error
        );
    }
}

if (
    document.getElementById(
        'activityTimeline'
    )
) {

    loadActivityCenter();

}
