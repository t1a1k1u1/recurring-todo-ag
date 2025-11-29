<script setup lang="ts">
import type { GoogleTaskList, ExtendedTask } from '~/types/google-tasks'

const { fetchTaskLists, fetchTasks, createTask, updateTask } = useGoogleTasks()

const taskLists = ref<GoogleTaskList[]>([])
const currentTaskListId = ref<string>('')
const tasks = ref<ExtendedTask[]>([])
const loading = ref(false)
const editingTask = ref<ExtendedTask | null>(null)
const isEditorOpen = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    taskLists.value = await fetchTaskLists()
    if (taskLists.value.length > 0) {
      currentTaskListId.value = taskLists.value[0].id
      await loadTasks()
    }
  } catch (e) {
    console.error('Failed to load task lists', e)
  } finally {
    loading.value = false
  }
})

const loadTasks = async () => {
  if (!currentTaskListId.value) return
  loading.value = true
  try {
    tasks.value = await fetchTasks(currentTaskListId.value)
  } catch (e) {
    console.error('Failed to load tasks', e)
  } finally {
    loading.value = false
  }
}

const openEditor = (task: ExtendedTask | null) => {
  editingTask.value = task
  isEditorOpen.value = true
}

const handleSave = async (taskData: Partial<ExtendedTask>) => {
  if (!currentTaskListId.value) return
  
  try {
    if (editingTask.value) {
      await updateTask(currentTaskListId.value, editingTask.value.id, taskData)
    } else {
      await createTask(currentTaskListId.value, taskData)
    }
    await loadTasks()
  } catch (e) {
    console.error('Failed to save task', e)
  }
}

watch(currentTaskListId, loadTasks)
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="mb-6 flex items-center gap-4">
      <label class="font-medium text-gray-700">Task List:</label>
      <select v-model="currentTaskListId" class="border rounded px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
        <option v-for="list in taskLists" :key="list.id" :value="list.id">
          {{ list.title }}
        </option>
      </select>
      <button @click="loadTasks" class="text-blue-600 hover:text-blue-800 mr-4">
        <span v-if="loading">Loading...</span>
        <span v-else>Refresh</span>
      </button>
      <button @click="openEditor(null)" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
        New Task
      </button>
    </div>

    <div v-if="tasks.length === 0 && !loading" class="text-center text-gray-500 py-8">
      No tasks found.
    </div>

    <div class="space-y-3">
      <div v-for="task in tasks" :key="task.id" class="bg-white p-4 rounded-lg shadow border-l-4 group hover:shadow-md transition-shadow" :class="task.interval ? 'border-purple-500' : 'border-gray-300'">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-medium text-lg text-gray-900">{{ task.title }}</h3>
            <p v-if="task.notes" class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ task.notes }}</p>
            <div v-if="task.due" class="text-xs text-gray-500 mt-2">
              Due: {{ new Date(task.due).toLocaleDateString() }}
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div v-if="task.interval" class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              Every {{ task.interval }} days
            </div>
            <button @click="openEditor(task)" class="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>

    <TaskEditor 
      :is-open="isEditorOpen" 
      :task="editingTask" 
      @close="isEditorOpen = false" 
      @save="handleSave" 
    />
  </div>
</template>
