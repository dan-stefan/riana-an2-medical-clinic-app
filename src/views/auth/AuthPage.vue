<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Back to Landing Button -->
      <button @click="goToLanding" class="back-to-landing">
        ← Înapoi
      </button>
      
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
  },
  
  mounted() {
    // Check for query parameter to determine initial form
    const mode = this.$route.query.mode
    if (mode === 'register') {
      this.currentForm = 'register'
    } else {
      this.currentForm = 'login'
    }
  },
  
  watch: {
    // Watch for route changes to update form
    '$route.query.mode'(newMode) {
      if (newMode === 'register') {
        this.currentForm = 'register'
      } else {
        this.currentForm = 'login'
      }
    }
  },
  
  methods: {
    goToLanding() {
      this.$router.push('/landing')
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
  overflow: auto;
}

.back-to-landing {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 16px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.back-to-landing:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.auth-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 100%;
  max-width: 450px;
  min-width: 300px;
  position: relative;
  margin: auto;
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 25px 20px;
  text-align: center;
}

.auth-header h1 {
  margin: 0 0 10px 0;
  font-size: clamp(17px, 3.5vw, 21px);
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

@media (max-width: 480px) {
  .back-to-landing {
    top: 15px;
    left: 15px;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .auth-header {
    padding: 20px 15px;
  }
  
  .auth-header h1 {
    font-size: 20px;
  }
  
  .auth-header p {
    font-size: 12px;
  }
}
</style>