const activities = [];

export function logActivity(message) {

    const activity = {

        message,

        timestamp:
            new Date().toLocaleString()
    };

    activities.unshift(activity);

    if (activities.length > 50) {

        activities.pop();
    }

    console.log(
        '📡 Activity:',
        message
    );

    if (global.io) {

        global.io.emit(
            'newActivity',
            activity
        );
    }
}

export function getActivities() {

    return activities;
}