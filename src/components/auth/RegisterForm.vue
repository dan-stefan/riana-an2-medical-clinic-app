<template>
    <div class="register-form">
      <h2>Înregistrare Cont Nou</h2>
      
      <form @submit.prevent="handleRegister" class="form">
        <div class="form-group">
          <label for="nume">Nume Complet:</label>
          <input 
            id="nume"
            v-model="formData.numeComplet"
            type="text" 
            required
            placeholder="ex: Ion Popescu"
          />
        </div>
  
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email"
            v-model="formData.email"
            type="email" 
            required
            placeholder="ex: ion.popescu@email.com"
          />
        </div>
  
        <div class="form-group">
          <label for="password">Parolă:</label>
          <input 
            id="password"
            v-model="formData.password"
            type="password" 
            required
            minlength="6"
            placeholder="Minim 6 caractere"
          />
        </div>
  
        <div class="form-group">
          <label for="confirmPassword">Confirmă Parola:</label>
          <input 
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password" 
            required
            placeholder="Rescrie parola"
          />
        </div>
  
        <div class="form-group">
          <label for="rol">Tipul contului:</label>
          <select id="rol" v-model="formData.rol" required>
            <option value="patient">Pacient</option>
            <option value="doctor">Medic Stomatolog</option>
          </select>
        </div>
  
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
  
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
          <div v-if="showLoginRedirect" class="redirect-info">
            Redirecționare către login în {{ countdown }} secunde...
          </div>
        </div>
  
        <button 
          type="submit" 
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          {{ loading ? 'Se înregistrează...' : 'Creează Cont' }}
        </button>
      </form>
  
      <div class="switch-form">
        <p>Ai deja cont? <a href="#" @click="$emit('switch-to-login')">Conectează-te</a></p>
      </div>
  
      <!-- Debug info (doar în dezvoltare) -->
      <div v-if="showDebugInfo" class="debug-info">
        <h4>Debug Info:</h4>
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>
  </template>
  
  <script>
  import { useAuthStore } from '@/stores/auth.js'
  
  export default {
    name: 'RegisterForm',
    emits: ['switch-to-login'],
    data() {
      return {
        formData: {
          numeComplet: '',
          email: '',
          password: '',
          confirmPassword: '',
          rol: 'patient'
        },
        errorMessage: '',
        successMessage: '',
        showLoginRedirect: false,
        countdown: 3,
        showDebugInfo: false,
        debugInfo: {}
      }
    },
    computed: {
      authStore() {
        return useAuthStore()
      },
      loading() {
        return this.authStore.loading
      },
      isFormValid() {
        return (
          this.formData.numeComplet.length > 2 &&
          this.formData.email.includes('@') &&
          this.formData.password.length >= 6 &&
          this.formData.password === this.formData.confirmPassword
        )
      }
    },
    methods: {
      async handleRegister() {
        this.errorMessage = ''
        this.successMessage = ''
        this.showLoginRedirect = false
        this.showDebugInfo = false
  
        if (this.formData.password !== this.formData.confirmPassword) {
          this.errorMessage = 'Parolele nu se potrivesc!'
          return
        }
  
        console.log('🎯 FORM SUBMIT:', this.formData)
  
        const result = await this.authStore.signUp(
          this.formData.email,
          this.formData.password,
          this.formData.numeComplet,
          this.formData.rol
        )
  
        console.log('📝 FORM RESULT:', result)
  
        // Actualizează debug info
        this.debugInfo = {
          formData: this.formData,
          result: result,
          authState: {
            isLoggedIn: this.authStore.isLoggedIn,
            user: this.authStore.user?.id,
            userProfile: this.authStore.userProfile?.id
          }
        }
  
        if (result.success) {
          this.successMessage = 'Cont creat cu succes! 🎉'
          
          // Verifică dacă utilizatorul este logat automat
          if (this.authStore.isLoggedIn) {
            console.log('🔄 User is logged in automatically, redirecting to dashboard...')
            this.successMessage = 'Cont creat cu succes! Redirecționare către dashboard...'
            
            setTimeout(() => {
              if (this.authStore.isPatient) {
                this.$router.push('/patient/dashboard')
              } else if (this.authStore.isDoctor) {
                this.$router.push('/doctor/dashboard')
              }
            }, 1500)
          } else {
            console.log('🔄 User needs to login manually, redirecting to login form...')
            this.successMessage = 'Cont creat cu succes! Te poți loga acum.'
            this.showLoginRedirect = true
            this.startCountdown()
          }
          
          // Resetează formularul
          this.formData = {
            numeComplet: '',
            email: '',
            password: '',
            confirmPassword: '',
            rol: 'patient'
          }
        } else {
          this.errorMessage = result.error
          this.showDebugInfo = true // Arată debug info la erori
          console.error('💥 FORM ERROR:', result.error)
        }
      },
  
      startCountdown() {
        const timer = setInterval(() => {
          this.countdown--
          if (this.countdown <= 0) {
            clearInterval(timer)
            this.$emit('switch-to-login')
          }
        }, 1000)
      },
  
      // Metodă pentru debug manual
      toggleDebug() {
        this.showDebugInfo = !this.showDebugInfo
      }
    }
  }
  </script>
  
  <style scoped>
  .register-form {
    width: 100%;
    margin: 0;
    padding: clamp(20px, 4vw, 40px); /* Padding responsiv */
    background-color: #fff;
    box-sizing: border-box;
  }
  
  .form {
    display: flex;
    flex-direction: column;
    gap: clamp(15px, 3vw, 25px); /* Gap responsiv */
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  label {
    margin-bottom: clamp(5px, 1vw, 10px);
    font-weight: bold;
    color: #333;
    font-size: clamp(14px, 2.5vw, 18px); /* Font responsiv */
  }
  
  input, select {
    padding: clamp(10px, 2vw, 18px); /* Padding responsiv */
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: clamp(14px, 2.5vw, 16px); /* Font responsiv */
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.3s ease;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
  
  .submit-button {
    padding: clamp(12px, 2.5vw, 20px) clamp(15px, 3vw, 25px);
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: clamp(16px, 3vw, 20px); /* Font responsiv */
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
  }
  
  .submit-button:hover:not(:disabled) {
    background-color: #45a049;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  .submit-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .error-message, .success-message {
    padding: clamp(10px, 2vw, 15px);
    border-radius: 4px;
    font-size: clamp(13px, 2.2vw, 16px);
    margin: clamp(5px, 1vw, 10px) 0;
  }
  
  .error-message {
    color: #d32f2f;
    background-color: #ffebee;
    border-left: 4px solid #d32f2f;
  }
  
  .success-message {
    color: #2e7d32;
    background-color: #e8f5e8;
    border-left: 4px solid #2e7d32;
  }
  
  .redirect-info {
    margin-top: clamp(5px, 1vw, 10px);
    font-size: clamp(12px, 2vw, 14px);
    font-style: italic;
    opacity: 0.8;
  }
  
  .switch-form {
    text-align: center;
    margin-top: clamp(20px, 3vw, 30px);
    font-size: clamp(14px, 2.5vw, 16px);
  }
  
  .switch-form a {
    color: #4CAF50;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  
  .switch-form a:hover {
    text-decoration: underline;
    color: #45a049;
  }
  
  .debug-info {
    margin-top: clamp(15px, 2.5vw, 25px);
    padding: clamp(10px, 2vw, 15px);
    background-color: #f5f5f5;
    border-radius: 4px;
    border-left: 4px solid #ff9800;
  }
  
  .debug-info h4 {
    margin: 0 0 clamp(8px, 1.5vw, 12px) 0;
    color: #ff9800;
    font-size: clamp(14px, 2.5vw, 16px);
  }
  
  .debug-info pre {
    margin: 0;
    font-size: clamp(10px, 1.8vw, 12px);
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.4;
  }
  
  /* Responsive pentru ecrane foarte mari */
  @media (min-width: 1920px) {
    .register-form {
      max-width: 600px;
      margin: 0 auto;
    }
  }
  </style>