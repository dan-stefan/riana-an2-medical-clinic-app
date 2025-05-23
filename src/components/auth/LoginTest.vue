<template>
    <div class="login-test">
      <h2>Test Conexiune Supabase</h2>
      <button @click="testConnection" :disabled="loading">
        {{ loading ? 'Se testează...' : 'Testează Conexiunea' }}
      </button>
      <div v-if="message" :class="messageClass">
        {{ message }}
      </div>
    </div>
  </template>
  
  <script>
  import { supabase } from '@/lib/supabase.js'
  
  export default {
    name: 'LoginTest',
    data() {
      return {
        loading: false,
        message: '',
        messageClass: ''
      }
    },
    methods: {
      async testConnection() {
        this.loading = true
        this.message = ''
        
        try {
          // Test simplu - încercăm să obținem datele utilizatorului curent
          const { data, error } = await supabase.auth.getUser()
          
          if (error && error.message !== 'Auth session missing!') {
            throw error
          }
          
          this.message = 'Conexiunea cu Supabase funcționează! ✅'
          this.messageClass = 'success'
        } catch (error) {
          this.message = `Eroare conexiune: ${error.message} ❌`
          this.messageClass = 'error'
        } finally {
          this.loading = false
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .login-test {
    padding: 20px;
    text-align: center;
  }
  
  button {
    padding: 10px 20px;
    margin: 10px;
    border: none;
    border-radius: 5px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .success {
    color: green;
    margin-top: 10px;
  }
  
  .error {
    color: red;
    margin-top: 10px;
  }
  </style>