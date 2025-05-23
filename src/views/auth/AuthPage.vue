<template>
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>Sistem Medical Dental</h1>
          <p>Platforma digitală pentru gestionarea datelor medicale în stomatologie</p>
        </div>
  
        <div class="auth-forms">
          <LoginForm 
            v-if="currentForm === 'login'" 
            @switch-to-register="currentForm = 'register'" 
          />
          <RegisterForm 
            v-else 
            @switch-to-login="currentForm = 'login'" 
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import LoginForm from '@/components/auth/LoginForm.vue'
  import RegisterForm from '@/components/auth/RegisterForm.vue'
  
  export default {
    name: 'AuthPage',
    components: {
      LoginForm,
      RegisterForm
    },
    data() {
      return {
        currentForm: 'login' // poate fi 'login' sau 'register'
      }
    }
  }
  </script>
  
  <style scoped>
  .auth-page {
    /* Background pe tot ecranul */
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
  }
  
  .auth-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    /* Scalare în funcție de mărimea ecranului */
    width: 90%;
    max-width: 450px;
    min-width: 320px;
    position: relative;
    z-index: 1;
  }
  
  .auth-header {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    padding: 25px 20px;
    text-align: center;
  }
  
  .auth-header h1 {
    margin: 0 0 10px 0;
    font-size: clamp(20px, 4vw, 28px);
  }
  
  .auth-header p {
    margin: 0;
    opacity: 0.9;
    font-size: clamp(12px, 2.5vw, 16px);
  }
  
  .auth-forms {
    padding: 0;
  }
  
  /* Responsive pentru diferite mărimi */
  @media (min-width: 480px) {
    .auth-container {
      width: 80%;
      max-width: 500px;
    }
    
    .auth-header {
      padding: 30px 25px;
    }
  }
  
  @media (min-width: 768px) {
    .auth-container {
      width: 60%;
      max-width: 550px;
    }
    
    .auth-header {
      padding: 35px 30px;
    }
  }
  
  @media (min-width: 1024px) {
    .auth-container {
      width: 40%;
      max-width: 600px;
    }
    
    .auth-header {
      padding: 40px 35px;
    }
  }
  
  @media (min-width: 1440px) {
    .auth-container {
      width: 30%;
      max-width: 650px;
    }
  }
  </style>