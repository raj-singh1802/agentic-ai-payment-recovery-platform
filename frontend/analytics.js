async function loadAnalytics() {

    try {

        let analytics;

        const analyticsRes =
            await fetch('/api/analytics');

        if (analyticsRes.ok) {

            analytics =
                await analyticsRes.json();
        } else {

            // Fallback: derive KPIs from /api/customers when /api/analytics is unavailable (404)
            const customersFallbackRes =
                await fetch('/api/customers');

            if (!customersFallbackRes.ok) {
                throw new Error(
                    `Analytics API failed: ${analyticsRes.status} and fallback /api/customers failed: ${customersFallbackRes.status}`
                );
            }

            const customersFallback =
                await customersFallbackRes.json();

            const totalCustomers =
                customersFallback.length;

            const pendingAmount =
                customersFallback
                    .filter(c => c["Payment Status"] === 'Pending')
                    .reduce((sum, c) => sum + Number(c["Due Amount"] || 0), 0);

            const escalatedCases =
                customersFallback.filter(c => c["Escalation Status"] === 'Yes').length;

            const avgDelayDays =
                totalCustomers
                    ? customersFallback.reduce((sum, c) => sum + Number(c["Delayed Days"] || 0), 0) / totalCustomers
                    : 0;

            analytics = {
                totalCustomers,
                pendingAmount,
                escalatedCases,
                avgDelayDays: Math.round(avgDelayDays),
                avgRecoveryScore: 0
            };

            // Also build charts from this fallback dataset.
            const customers = customersFallback;

            const totalCustomersEl =
                document.getElementById('totalCustomers');


            const pendingAmountEl =
                document.getElementById('pendingAmount');

            const escalatedCasesEl =
                document.getElementById('escalatedCases');

            const avgDelayDaysEl =
                document.getElementById('avgDelayDays');

            if (totalCustomersEl)
                totalCustomersEl.textContent = analytics.totalCustomers;

            if (pendingAmountEl)
                pendingAmountEl.textContent =
                    `₹${Number(analytics.pendingAmount || 0).toLocaleString('en-IN')}`;

            if (escalatedCasesEl)
                escalatedCasesEl.textContent = analytics.escalatedCases;

            if (avgDelayDaysEl)
                avgDelayDaysEl.textContent = analytics.avgDelayDays;

            buildStatusChart(customers);
            buildDelayChart(customers);
            buildRecoveryChart(customers);
            buildRecoveryTrendChart(customers);
            buildRiskTable(customers);
            buildInsights(customers, analytics);

            return;
        }

        const totalCustomersEl =
            document.getElementById('totalCustomers');


        const pendingAmountEl =
            document.getElementById('pendingAmount');

        const escalatedCasesEl =
            document.getElementById('escalatedCases');

        const avgDelayDaysEl =
            document.getElementById('avgDelayDays');

        if (totalCustomersEl)
            totalCustomersEl.textContent =
                analytics.totalCustomers;

        if (pendingAmountEl)
            pendingAmountEl.textContent =
                `₹${Number(analytics.pendingAmount || 0).toLocaleString('en-IN')}`;

        if (escalatedCasesEl)
            escalatedCasesEl.textContent =
                analytics.escalatedCases;

        if (avgDelayDaysEl)
            avgDelayDaysEl.textContent =
                analytics.avgDelayDays;

        const customersRes =
            await fetch('/api/customers');

        if (!customersRes.ok) {

            throw new Error(
                `Customers API failed: ${customersRes.status}`
            );
        }

        const customers =
            await customersRes.json();

        buildStatusChart(customers);
        buildDelayChart(customers);
        buildRecoveryChart(customers);
        buildRecoveryTrendChart(customers);
        buildRiskTable(customers);
        buildInsights(customers, analytics);


    } catch (error) {

        console.error('Failed loading analytics', error);
    }
}

function buildStatusChart(customers) {

    const canvas =
        document.getElementById('statusChart');

    if (!canvas || typeof Chart === 'undefined') return;

    const paid =
        customers.filter(c => c["Payment Status"] === 'Paid').length;

    const pending =
        customers.filter(c =>
            c["Payment Status"] === 'Pending' ||
            c["Payment Status"] === 'Delayed'
        ).length;

    const escalated =
        customers.filter(c =>
            c["Payment Status"] === 'Escalated' ||
            c["Escalation Status"] === 'Yes'
        ).length;

    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Paid', 'Pending', 'Escalated'],
            datasets: [{
                data: [paid, pending, escalated],
                backgroundColor: ['#22c55e', '#facc15', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            }
        }
    });
}

function buildDelayChart(customers) {

    const canvas =
        document.getElementById('delayChart');

    if (!canvas || typeof Chart === 'undefined') return;

    const buckets = {
        '0-7 Days': 0,
        '8-15 Days': 0,
        '16-30 Days': 0,
        '30+ Days': 0
    };

    customers.forEach(c => {
        const d = Number(c["Delayed Days"] || 0);
        if (d <= 7) buckets['0-7 Days']++;
        else if (d <= 15) buckets['8-15 Days']++;
        else if (d <= 30) buckets['16-30 Days']++;
        else buckets['30+ Days']++;
    });

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(buckets),
            datasets: [{
                label: 'Customers',
                data: Object.values(buckets),
                backgroundColor: ['#38bdf8', '#facc15', '#fb7185', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: {
                x: { ticks: { color: 'white' } },
                y: { ticks: { color: 'white' } }
            }
        }
    });
}

function buildRecoveryChart(customers) {

    const canvas =
        document.getElementById('recoveryChart');

    if (!canvas || typeof Chart === 'undefined') return;

    const buckets = {
        '0-20': 0,
        '20-40': 0,
        '40-60': 0,
        '60-80': 0,
        '80-100': 0
    };

    customers.forEach(c => {
        const r = Number(c.recoveryScore || 0);
        if (r <= 20) buckets['0-20']++;
        else if (r <= 40) buckets['20-40']++;
        else if (r <= 60) buckets['40-60']++;
        else if (r <= 80) buckets['60-80']++;
        else buckets['80-100']++;
    });

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(buckets),
            datasets: [{
                label: 'Customers',
                data: Object.values(buckets),
                backgroundColor: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: {
                x: { ticks: { color: 'white' } },
                y: { ticks: { color: 'white' } }
            }
        }
    });
}

function buildRecoveryTrendChart(customers) {

    const canvas =
        document.getElementById('recoveryTrendChart');

    if (!canvas || typeof Chart === 'undefined') return;

    // B: trend across another dimension (stage)
    // Stage buckets are approximated from available fields:
    // - Escalated: Escalation Status === 'Yes'
    // - Attempts inferred from No Response Count
    const attemptBuckets = {
        'Escalated': [],
        'Attempt 0 (no responses)': [],
        'Attempt 1-2': [],
        'Attempt 3+': []
    };

    customers.forEach(c => {
        const isEscalated = c['Escalation Status'] === 'Yes';
        const noResponse = Number(c['No Response Count'] || 0);
        const r = Number(c.recoveryScore || 0);

        if (isEscalated) {
            attemptBuckets['Escalated'].push(r);
        } else if (noResponse === 0) {
            attemptBuckets['Attempt 0 (no responses)'].push(r);
        } else if (noResponse <= 2) {
            attemptBuckets['Attempt 1-2'].push(r);
        } else {
            attemptBuckets['Attempt 3+'].push(r);
        }
    });

    const labels = Object.keys(attemptBuckets);
    const avgByBucket = labels.map(label => {
        const arr = attemptBuckets[label];
        if (!arr.length) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return Math.round(sum / arr.length);
    });

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Avg Recovery Score (%)',
                data: avgByBucket,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: {
                x: { ticks: { color: 'white' } },
                y: { ticks: { color: 'white' }, suggestedMin: 0, suggestedMax: 100 }
            }
        }
    });
}

function buildRiskTable(customers) {

    const tableBody =
        document.getElementById('riskTableBody');

    if (!tableBody) return;

    const sorted =
        [...customers]
            .sort((a, b) => Number(b.priorityScore || 0) - Number(a.priorityScore || 0))
            .slice(0, 10);

    tableBody.innerHTML = sorted.map(c => `

        <tr>

            <td>${c.Name || '-'}</td>

            <td>${c.Invoice || '-'}</td>

            <td>₹${Number(c["Due Amount"] || 0).toLocaleString('en-IN')}</td>

            <td>${Number(c.recoveryScore || 0)}%</td>

            <td>🔥 ${Number(c.priorityScore || 0)}</td>

            <td>${c.riskLevel || '-'}</td>

        </tr>

    `).join('');
}

function buildInsights(customers, analytics) {

    const lowRecoveryCount =
        customers.filter(c => Number(c.recoveryScore || 0) < 20).length;

    const delayedOver30Count =
        customers.filter(c => Number(c["Delayed Days"] || 0) > 30).length;

    const highestPriority =
        [...customers].sort((a, b) => Number(b.priorityScore || 0) - Number(a.priorityScore || 0))[0];

    const escalatedAmountTotal =
        customers
            .filter(c => c["Escalation Status"] === 'Yes')
            .reduce((sum, c) => sum + Number(c["Due Amount"] || 0), 0);

    const insightsEl =
        document.getElementById('aiInsights');

    if (!insightsEl) return;

    insightsEl.innerHTML = `

        <div class="activity-item">
            <strong>🧠 Customers with recovery score below 20%:</strong>
            ${lowRecoveryCount}
        </div>

        <div class="activity-item">
            <strong>⚠️ Customers delayed more than 30 days:</strong>
            ${delayedOver30Count}
        </div>

        <div class="activity-item">
            <strong>🔥 Highest priority customer:</strong>
            ${highestPriority ? `${highestPriority.Name} (${highestPriority.Invoice})` : '-'}
        </div>

        <div class="activity-item">
            <strong>💰 Total escalated amount:</strong>
            ₹${escalatedAmountTotal.toLocaleString('en-IN')}
        </div>

        <div class="activity-item">
            <strong>📌 Escalated cases:</strong>
            ${analytics.escalatedCases}
        </div>

    `;
}

window.sidebarNavClick = function sidebarNavClick(event, anchorEl) {
    // Fix for clicks not navigating when nested <li> elements are used.
    // Allow normal browser navigation unless a handler prevented it.
    if (event && typeof event.preventDefault === 'function') {
        // Only prevent default if the anchor has an href but JS routing is expected.
        // For this app we rely on normal href navigation.
        // So do nothing here.
    }
    return true;
};

loadAnalytics();



