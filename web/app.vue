<script setup lang="ts">
const { status, data, signIn, signOut } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 class="text-2xl font-bold text-blue-600 mb-4">Recurring Todo AG</h1>
      
      <div v-if="status === 'authenticated'" class="mb-4">
        <div class="flex items-center justify-between mb-6 px-4">
          <div class="flex items-center gap-3">
            <img :src="data?.user?.image!" alt="User Image" class="w-10 h-10 rounded-full">
            <span class="font-medium text-gray-700">{{ data?.user?.name }}</span>
          </div>
          <button @click="signOut()" class="text-sm text-red-600 hover:text-red-800">
            Sign Out
          </button>
        </div>
        
        <TaskList />
      </div>
      
      <div v-else>
        <p class="text-gray-600 mb-4">Please sign in to manage your tasks.</p>
        <button @click="signIn('google')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Sign In with Google
        </button>
      </div>
    </div>
  </div>
</template>
