/**
 * Google Tasks Recurring Task Processor
 * 
 * This script checks for completed tasks with a specific metadata in their notes
 * and creates a new task with a future due date based on the interval.
 */

// Configuration
const CONFIG = {
    // Metadata key to look for in notes. We assume JSON format: {"interval": 7}
    INTERVAL_KEY: 'interval',
    // Tag to add to notes to mark as processed (optional, to avoid double processing if not using time-based check)
    PROCESSED_TAG: 'RECURRING_PROCESSED',
    // How far back to check for completed tasks (in minutes). 
    // Should be slightly larger than the trigger frequency.
    LOOKBACK_MINUTES: 15
};

function main() {
    processCompletedTasks();
}

function processCompletedTasks() {
    const taskLists = Tasks.Tasklists?.list()?.items;
    if (!taskLists) {
        console.log('No task lists found.');
        return;
    }

    // Calculate the time window for completed tasks
    // Note: Tasks API 'completedMin' filters by the time the task was completed.
    // We use a lookback window to process recently completed tasks.
    // Adjust this logic if you want to run once a day and check the whole day.
    // For now, let's assume this runs periodically (e.g. every 10 mins or daily).
    // If running daily, set lookback to 24h + buffer.

    // Let's assume daily execution for now.
    const now = new Date();
    const lookbackTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const completedMin = lookbackTime.toISOString();

    taskLists.forEach(list => {
        if (!list.id) return;

        try {
            const tasks = Tasks.Tasks?.list(list.id, {
                showCompleted: true,
                showHidden: true,
                completedMin: completedMin
            })?.items;

            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    if (task.status === 'completed' && task.notes) {
                        checkAndRecurTask(list.id!, task);
                    }
                });
            }
        } catch (e) {
            console.error(`Error processing list ${list.title}: ${e}`);
        }
    });
}

function checkAndRecurTask(taskListId: string, task: GoogleAppsScript.Tasks.Schema.Task) {
    try {
        // Parse notes to find interval
        const notes = task.notes || '';

        // Skip if already processed
        if (notes.includes(CONFIG.PROCESSED_TAG)) {
            return;
        }

        let interval = 0;
        try {
            // Attempt to parse JSON
            const data = JSON.parse(notes);
            if (data && typeof data[CONFIG.INTERVAL_KEY] === 'number') {
                interval = data[CONFIG.INTERVAL_KEY];
            }
        } catch (e) {
            // Not JSON or invalid format, ignore
            return;
        }

        if (interval > 0) {
            console.log(`Found recurring task: "${task.title}" with interval ${interval} days`);
            createNextTask(taskListId, task, interval);
            markAsProcessed(taskListId, task);
        }

    } catch (e) {
        console.error(`Error checking task ${task.title}: ${e}`);
    }
}

function createNextTask(taskListId: string, originalTask: GoogleAppsScript.Tasks.Schema.Task, interval: number) {
    const completedDate = new Date(originalTask.completed!); // RFC 3339 timestamp
    const nextDueDate = new Date(completedDate.getTime() + interval * 24 * 60 * 60 * 1000);

    // Create new task
    const newTask: GoogleAppsScript.Tasks.Schema.Task = {
        title: originalTask.title,
        notes: originalTask.notes, // Keep the metadata for the next recurrence
        due: nextDueDate.toISOString()
    };

    try {
        const created = Tasks.Tasks?.insert(newTask, taskListId);
        console.log(`Created next task: "${created?.title}" due on ${created?.due}`);
    } catch (e) {
        console.error(`Failed to create next task: ${e}`);
    }
}

function markAsProcessed(taskListId: string, task: GoogleAppsScript.Tasks.Schema.Task) {
    // We can append a tag to notes or just rely on the completedMin filter + execution frequency.
    // To be safe, let's append a hidden marker in the JSON if possible, or just leave it.
    // If we modify the completed task, it might change its 'updated' time but not 'completed' time.
    // However, modifying a completed task might be confusing.
    // A better approach for "daily run" is to trust the completedMin filter.
    // If we run this script exactly once a day, we process tasks completed in the last 24h.

    // If we want to be idempotent, we should mark it.
    // Let's update the notes to include a processed flag in the JSON.

    try {
        const notes = task.notes || '{}';
        let data: any = {};
        try {
            data = JSON.parse(notes);
        } catch (e) {
            // Should not happen as we parsed it before
        }

        // Add processed timestamp or flag
        // We only add it to the COMPLETED task, not the NEW task (which was copied before this)
        data.lastRecurred = new Date().toISOString();

        const updatedTask = {
            notes: JSON.stringify(data)
        };

        Tasks.Tasks?.patch(updatedTask, taskListId, task.id!);
        console.log(`Marked task "${task.title}" as processed.`);

    } catch (e) {
        console.error(`Failed to mark task as processed: ${e}`);
    }
}
