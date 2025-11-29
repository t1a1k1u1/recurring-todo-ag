import type { GoogleTask, GoogleTaskList, ExtendedTask } from '~/types/google-tasks'

export const useGoogleTasks = () => {
    const { data: session } = useAuth()

    const getHeaders = () => {
        if (!session.value?.accessToken) {
            throw new Error('User not authenticated')
        }
        return {
            Authorization: `Bearer ${session.value.accessToken}`,
            'Content-Type': 'application/json',
        }
    }

    const fetchTaskLists = async (): Promise<GoogleTaskList[]> => {
        const response = await $fetch<{ items: GoogleTaskList[] }>('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
            headers: getHeaders(),
        })
        return response.items || []
    }

    const fetchTasks = async (taskListId: string): Promise<ExtendedTask[]> => {
        const response = await $fetch<{ items: GoogleTask[] }>(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
            headers: getHeaders(),
            params: {
                showCompleted: false,
                showHidden: false,
            }
        })

        return (response.items || []).map(parseTask)
    }

    const createTask = async (taskListId: string, task: Partial<ExtendedTask>): Promise<ExtendedTask> => {
        const payload = prepareTaskPayload(task)
        const response = await $fetch<GoogleTask>(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        })
        return parseTask(response)
    }

    const updateTask = async (taskListId: string, taskId: string, task: Partial<ExtendedTask>): Promise<ExtendedTask> => {
        const payload = prepareTaskPayload(task)
        const response = await $fetch<GoogleTask>(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        })
        return parseTask(response)
    }

    // Helper to parse interval from notes
    const parseTask = (task: GoogleTask): ExtendedTask => {
        let interval: number | undefined
        if (task.notes) {
            try {
                // Attempt to find JSON pattern in notes. 
                // We assume the metadata is stored as a JSON string, possibly surrounded by other text?
                // For simplicity, let's assume if it starts with { "interval": ... } it's our metadata, 
                // or we can look for a specific marker.
                // Let's try to parse the whole notes if it looks like JSON, or look for a specific line.
                // Strategy: Look for a line starting with `METADATA:`

                // Simple approach for now: Try to parse the whole note as JSON first.
                const data = JSON.parse(task.notes)
                if (typeof data.interval === 'number') {
                    interval = data.interval
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }
        return { ...task, interval }
    }

    // Helper to serialize interval into notes
    const prepareTaskPayload = (task: Partial<ExtendedTask>): Partial<GoogleTask> => {
        const { interval, ...googleTask } = task

        if (interval !== undefined) {
            // We overwrite notes with JSON for now. 
            // TODO: Preserve existing notes if needed.
            googleTask.notes = JSON.stringify({ interval, originalNotes: task.notes })
        }

        return googleTask
    }

    return {
        fetchTaskLists,
        fetchTasks,
        createTask,
        updateTask,
    }
}
