<script setup lang="ts">
import type { ExtendedTask } from '~/types/google-tasks'

const props = defineProps<{
  task: ExtendedTask | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', task: Partial<ExtendedTask>): void
}>()

const form = ref<Partial<ExtendedTask>>({
  title: '',
  notes: '',
  interval: undefined
})

watch(() => props.task, (newTask) => {
  if (newTask) {
    form.value = {
      title: newTask.title,
      notes: newTask.notes,
      interval: newTask.interval
    }
  } else {
    form.value = {
      title: '',
      notes: '',
      interval: undefined
    }
  }
})

const save = () => {
  emit('save', form.value)
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
      <h2 class="text-xl font-bold mb-4">{{ task ? 'Edit Task' : 'New Task' }}</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Title</label>
          <input v-model="form.title" type="text" class="mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Notes</label>
          <textarea v-model="form.notes" rows="3" class="mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Recurring Interval (Days)</label>
          <input v-model.number="form.interval" type="number" min="1" placeholder="e.g. 7" class="mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-500 mt-1">Set a value to make this task recur after completion.</p>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
        <button @click="save" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </div>
  </div>
</template>
