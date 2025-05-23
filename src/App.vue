<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

export default {
  components: {
    RouterView
  },
  async mounted() {
    const authStore = useAuthStore()
    await authStore.initialize()
  }
}
</script>

<style>
/* Reset complet */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  overflow-x: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  position: relative;
}
</style>