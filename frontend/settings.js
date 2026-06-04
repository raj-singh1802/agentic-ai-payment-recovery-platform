const SETTINGS_KEY = 'aiCollectionsSettingsV1';

const DEFAULT_SETTINGS = {

    autoEscalationEnabled: true,

    priorityScoringEnabled: true,

    workflowTrackingEnabled: true,

    escalationDays: 10,

    highPriorityThreshold: 70,

    supervisorAlertThreshold: 90,

    callRetryAttempts: 3,

    emailReminderFrequency: 2

};

const KEYS = Object.keys(DEFAULT_SETTINGS);

function safeParseJSON(value, fallback) {

    try {

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}

function getSettings() {

    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = safeParseJSON(raw, null);

    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };

    return {

        ...DEFAULT_SETTINGS,

        ...parsed

    };

}

function setSettings(next) {

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

}

function coerceValue(key, value, inputEl) {

    if (typeof DEFAULT_SETTINGS[key] === 'boolean') {

        if (inputEl && inputEl.type === 'checkbox') {

            return Boolean(inputEl.checked);

        }

        if (value === 'true') return true;

        if (value === 'false') return false;

        return Boolean(value);

    }

    // number

    const n = Number(value);

    if (Number.isNaN(n)) return DEFAULT_SETTINGS[key];

    return n;

}

function bindControl(key) {

    const el = document.getElementById(key);

    if (!el) return null;

    const handler = () => {

        const current = getSettings();

        current[key] = coerceValue(key, el.value);

        setSettings(current);

    };

    el.addEventListener('change', handler);

    el.addEventListener('input', handler);

    return el;

}

function populateControls(settings) {

    KEYS.forEach(key => {

        const el = document.getElementById(key);

        if (!el) return;

        el.value = String(settings[key]);

    });

}

async function loadConfigurationActivity() {

    const feed = document.getElementById('configActivityFeed');

    if (!feed) return;

    try {

        const res = await fetch('/api/activity');

        if (!res.ok) throw new Error(`Activity API failed: ${res.status}`);

        const activities = await res.json();

        const filtered = activities

            .slice(0, 60)

            .filter(a => {

                const m = (a.message || '').toLowerCase();

                // Lightweight heuristic: treat config-related messages as configuration activity
                return (

                    m.includes('config') ||

                    m.includes('setting') ||

                    m.includes('rule') ||

                    m.includes('workflow') ||

                    m.includes('recovery') ||

                    m.includes('priority') ||

                    m.includes('escalation') ||

                    m.includes('engine')

                );

            })

            .slice(0, 20);

        feed.innerHTML = '';

        if (!filtered.length) {

            feed.innerHTML = `

                <div class="activity-item">No configuration activity yet.</div>

            `;

            return;

        }

        filtered.forEach(item => {

            const div = document.createElement('div');

            div.className = 'activity-item';

            div.innerHTML = `

                <strong>${item.timestamp || ''}</strong>

                <br/>

                ${item.message || ''}

            `;

            feed.appendChild(div);

        });

    } catch (err) {

        console.error('Failed to load configuration activity', err);

        const feed = document.getElementById('configActivityFeed');

        if (feed) feed.innerHTML = `

            <div class="activity-item">Failed to load configuration activity.</div>

        `;

    }

}

function setupDataExportButtons() {

    const hint = document.getElementById('exportHint');

    const notify = (text) => {

        if (hint) hint.textContent = text;

    };

    // V1: UI-only exports (no backend changes). Download locally from current settings.

    const exportCustomersBtn = document.getElementById('exportCustomers');

    if (exportCustomersBtn) {

        exportCustomersBtn.addEventListener('click', () => {

            const blob = new Blob([JSON.stringify({ note: 'V1 UI-only export. Customers export requires backend changes.' }, null, 2)], {

                type: 'application/json'

            });

            const a = document.createElement('a');

            a.href = URL.createObjectURL(blob);

            a.download = `customers_export_${Date.now()}.json`;

            a.click();

            notify('Customers export is UI-only for V1.');

        });

    }

    const exportAnalyticsBtn = document.getElementById('exportAnalytics');

    if (exportAnalyticsBtn) {

        exportAnalyticsBtn.addEventListener('click', () => {

            const blob = new Blob([JSON.stringify({ note: 'V1 UI-only export. Analytics export requires backend changes.' }, null, 2)], {

                type: 'application/json'

            });

            const a = document.createElement('a');

            a.href = URL.createObjectURL(blob);

            a.download = `analytics_export_${Date.now()}.json`;

            a.click();

            notify('Analytics export is UI-only for V1.');

        });

    }

    const exportActivityBtn = document.getElementById('exportActivityLogs');

    if (exportActivityBtn) {

        exportActivityBtn.addEventListener('click', async () => {

            try {

                const res = await fetch('/api/activity');

                if (!res.ok) throw new Error(`Activity API failed: ${res.status}`);

                const activities = await res.json();

                const blob = new Blob([JSON.stringify(activities, null, 2)], {

                    type: 'application/json'

                });

                const a = document.createElement('a');

                a.href = URL.createObjectURL(blob);

                a.download = `activity_logs_${Date.now()}.json`;

                a.click();

                notify('Exported activity logs from /api/activity.');

            } catch (e) {

                console.error('Export activity logs failed', e);

                notify('Failed to export activity logs.');

            }

        });

    }

}

function ensureSidebarActive() {

    // Keep consistent with other pages that use class="active" on the LI.

    const path = window.location.pathname || '';

    const setActive = (id) => {

        const el = document.getElementById(id);

        if (el) {

            document.querySelectorAll('.sidebar li.active').forEach(x => x.classList.remove('active'));

            el.classList.add('active');

        }

    };

    if (path.endsWith('/settings.html') || path.endsWith('settings.html')) {

        setActive('navSettings');

    } else {

        // no-op; this page sets Settings as active

    }

}

window.addEventListener('DOMContentLoaded', () => {

    if (typeof localStorage === 'undefined') return;

    const settings = getSettings();

    populateControls(settings);

    KEYS.forEach(bindControl);

    // Initial save normalization (ensures stored values have the right types)

    setSettings(settings);

    loadConfigurationActivity();

    setupDataExportButtons();

    ensureSidebarActive();

});

