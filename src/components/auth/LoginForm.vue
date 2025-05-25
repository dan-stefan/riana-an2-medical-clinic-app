<template>
  <div class="login-form">
    <h2>Conectare</h2>
    
    <form @submit.prevent="handleLogin" class="form">
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          id="email"
          v-model="formData.email"
          type="email" 
          required
          placeholder="Adresa ta de email"
        />
      </div>

      <div class="form-group">
        <label for="password">Parolă:</label>
        <input 
          id="password"
          v-model="formData.password"
          type="password" 
          required
          placeholder="Parola ta"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <button 
        type="submit" 
        :disabled="loading || !isFormValid"
        class="submit-button"
      >
        {{ loading ? 'Se conectează...' : 'Conectează-te' }}
      </button>
    </form>

    <div class="switch-form">
      <p>Nu ai cont? <a href="#" @click="$emit('switch-to-register')">Înregistrează-te</a></p>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'LoginForm',
  emits: ['switch-to-register'],
  data() {
    return {
      formData: {
        email: '',
        password: ''
      },
      errorMessage: ''
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
      return this.formData.email.includes('@') && this.formData.password.length > 0
    }
  },
  methods: {
    async handleLogin() {
      this.errorMessage = ''

      try {
        console.log('LOGIN START:', this.formData.email)
        
        // Autentificare uniformă prin Supabase pentru TOȚI utilizatorii
        const result = await this.authStore.signIn(
          this.formData.email,
          this.formData.password
        )

        console.log('Login result:', result)

        if (result.success) {
          // Așteaptă ca profilul să fie încărcat
          await new Promise(resolve => setTimeout(resolve, 100))
          
          console.log('Login successful, user profile:', this.authStore.userProfile)
          
          // Verifică mai întâi status-ul contului
          const userStatus = this.authStore.userProfile?.status
          const userRole = this.authStore.userProfile?.rol
          
          console.log('User status:', userStatus)
          console.log('User role:', userRole)
          
          // Verifică dacă contul este activ (status null)
          if (userStatus !== null) {
            // Deconectează utilizatorul automat
            await this.authStore.signOut()
            
            // Afișează mesajul corespunzător în funcție de status
            if (userStatus === 'waiting') {
              this.errorMessage = 'Contul dvs. este în așteptarea aprobării de către administrator. Veți fi notificat când contul va fi aprobat.'
            } else if (userStatus === 'rejected') {
              this.errorMessage = 'Contul dvs. a fost respins de către administrator. Pentru mai multe informații, contactați echipa de suport.'
            } else {
              this.errorMessage = 'Contul dvs. nu este activ în acest moment. Contactați administratorul pentru mai multe informații.'
            }
            return // STOP - nu continuă cu redirecționarea
          }
          
          // DOAR dacă status-ul este null, verifică rolul și redirecționează
          if (userRole === 'admin') {
            console.log('Admin detected, redirecting to admin dashboard')
            this.$router.push('/admin/dashboard')
          } else if (userRole === 'patient') {
            console.log('Patient detected, redirecting to patient dashboard')
            this.$router.push('/patient/dashboard')
          } else if (userRole === 'doctor') {
            console.log('Doctor detected, redirecting to doctor dashboard')
            this.$router.push('/doctor/dashboard')
          } else {
            console.log('Unknown or missing role:', userRole)
            this.errorMessage = 'Rol de utilizator necunoscut sau lipsă. Contactați administratorul.'
          }
        } else {
          console.log('Login failed:', result.error)
          this.errorMessage = result.error
        }
      } catch (error) {
        console.error('Login error:', error)
        this.errorMessage = 'Eroare la conectare. Încercați din nou.'
      }
    }
  }
}
</script>

<style scoped>
.login-form {
  width: 100%;
  margin: 0;
  padding: clamp(20px, 4vw, 40px);
  background-color: #fff;
  box-sizing: border-box;
}

.form {
  display: flex;
  flex-direction: column;
  gap: clamp(15px, 3vw, 25px);
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: clamp(5px, 1vw, 10px);
  font-weight: bold;
  color: #333;
  font-size: clamp(14px, 2.5vw, 18px);
}

input {
  padding: clamp(10px, 2vw, 18px);
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: clamp(14px, 2.5vw, 16px);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

input:focus {
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
  font-size: clamp(16px, 3vw, 20px);
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

.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: clamp(10px, 2vw, 15px);
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
  font-size: clamp(13px, 2.2vw, 16px);
  margin: clamp(5px, 1vw, 10px) 0;
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
</style>