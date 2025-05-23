<template>
    <div class="patient-dashboard">
      <header class="dashboard-header">
        <h1>Dashboard Pacient</h1>
        <div class="user-info">
          <span>Bună, {{ authStore.userProfile?.nume_complet }}!</span>
          <button @click="logout" class="logout-btn">Deconectare</button>
        </div>
      </header>
  
      <div class="dashboard-content">
        <div class="welcome-card">
          <h2>Bine ai venit în sistemul nostru medical!</h2>
          <p>Aici vei putea completa chestionarele medicale și să-ți gestionezi informațiile de sănătate.</p>
        </div>
  
        <div class="quick-actions">
          <div class="action-card">
            <h3>Chestionar Medical</h3>
            <p>Completează informațiile despre starea ta de sănătate</p>
            <button 
              @click="startQuestionnaire" 
              class="action-btn" 
              :disabled="questionnaireLoading"
            >
              {{ questionnaireLoading ? 'Se verifică...' : 'Completează Chestionarul' }}
            </button>
          </div>
          
          <div class="action-card">
            <h3>Istoric Completări</h3>
            <p>Vezi chestionarele completate anterior</p>
            <button @click="viewHistory" class="action-btn">
              Vezi Istoricul
            </button>
          </div>
  
          <div class="action-card">
            <h3>Profilul Meu</h3>
            <p>Actualizează informațiile personale</p>
            <button @click="editProfile" class="action-btn">
              Editează Profilul
            </button>
          </div>
        </div>
      </div>
  
      <!-- Modal pentru data nașterii -->
      <DateOfBirthModal 
        :show="questionnaireStore.showDateModal"
        @close="questionnaireStore.closeModals"
        @continue="onDateOfBirthContinue"
      />
  
      <!-- Modal pentru chestionar -->
      <QuestionnaireModal 
        :show="questionnaireStore.showQuestionnaireModal"
        @close="questionnaireStore.closeModals"
        @completed="onQuestionnaireCompleted"
      />

      <!-- Modal pentru editarea profilului -->
      <ProfileEditor 
        :show="showProfileEditor"
        @close="showProfileEditor = false"
        @updated="onProfileUpdated"
      />

      <!-- Modal pentru istoricul chestionarelor -->
      <QuestionnaireHistory 
        :show="showQuestionnaireHistory"
        @close="showQuestionnaireHistory = false"
        @start-new="onStartNewFromHistory"
      />

      <!-- Notificări Toast -->
      <div v-if="notifications.length > 0" class="notifications-container">
        <div 
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          @click="removeNotification(notification.id)"
        >
          <span class="notification-icon">{{ getNotificationIcon(notification.type) }}</span>
          <span class="notification-message">{{ notification.message }}</span>
          <button class="notification-close">✕</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useAuthStore } from '@/stores/auth.js'
  import { useQuestionnaireStore } from '@/stores/questionnaire.js'
  import DateOfBirthModal from '@/components/patient/DateOfBirthModal.vue'
  import QuestionnaireModal from '@/components/patient/QuestionnaireModal.vue'
  import ProfileEditor from '@/components/patient/ProfileEditor.vue'
  import QuestionnaireHistory from '@/components/patient/QuestionnaireHistory.vue'
  
  export default {
    name: 'PatientDashboard',
    components: {
      DateOfBirthModal,
      QuestionnaireModal,
      ProfileEditor,
      QuestionnaireHistory
    },
    data() {
      return {
        questionnaireLoading: false,
        showProfileEditor: false,
        showQuestionnaireHistory: false,
        notifications: [],
        notificationId: 0
      }
    },
    computed: {
      authStore() {
        return useAuthStore()
      },
      questionnaireStore() {
        return useQuestionnaireStore()
      }
    },
    methods: {
      async logout() {
        const success = await this.authStore.signOut()
        if (success) {
          this.$router.push('/auth')
        }
      },
  
      async startQuestionnaire() {
        this.questionnaireLoading = true
        
        try {
          const result = await this.questionnaireStore.checkQuestionnaireStatus()
          
          if (result.hasRecent) {
            // Are chestionar recent - arată informația
            const completedDate = new Date(result.questionnaire.completat_la).toLocaleDateString('ro-RO')
            this.showNotification(
              `Aveți un chestionar completat recent la data ${completedDate}. Chestionarele se actualizează la 6 luni.`,
              'info'
            )
          } else if (result.error) {
            this.showNotification('A apărut o eroare. Vă rugăm să încercați din nou.', 'error')
          }
          // Modalurile se vor deschide automat în funcție de status
          
        } catch (error) {
          console.error('Error starting questionnaire:', error)
          this.showNotification('A apărut o eroare. Vă rugăm să încercați din nou.', 'error')
        } finally {
          this.questionnaireLoading = false
        }
      },
  
      onDateOfBirthContinue(data) {
        console.log('Date of birth set:', data)
        this.showNotification(
          `Data nașterii setată. Se va afișa chestionarul pentru ${data.type === 'minor' ? 'minori' : 'adulți'}.`,
          'success'
        )
      },
  
      onQuestionnaireCompleted(data) {
        console.log('Questionnaire completed:', data)
        this.showNotification('Chestionarul a fost completat cu succes! 🎉', 'success')
      },
  
      viewHistory() {
        this.showQuestionnaireHistory = true
      },
  
      editProfile() {
        this.showProfileEditor = true
      },

      onProfileUpdated(profileData) {
        this.showNotification('Profilul a fost actualizat cu succes! ✅', 'success')
        console.log('Profile updated:', profileData)
      },

      onStartNewFromHistory() {
        // Închide istoricul și începe un chestionar nou
        this.showQuestionnaireHistory = false
        setTimeout(() => {
          this.startQuestionnaire()
        }, 300) // Mică întârziere pentru animație
      },
  
      showNotification(message, type = 'info', duration = 5000) {
        const id = ++this.notificationId
        const notification = {
          id,
          message,
          type,
          timestamp: Date.now()
        }
        
        this.notifications.push(notification)
        
        // Auto-remove după duration
        setTimeout(() => {
          this.removeNotification(id)
        }, duration)
      },

      removeNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id)
        if (index > -1) {
          this.notifications.splice(index, 1)
        }
      },

      getNotificationIcon(type) {
        const icons = {
          'success': '✅',
          'error': '❌',
          'warning': '⚠️',
          'info': 'ℹ️'
        }
        return icons[type] || 'ℹ️'
      }
    },
  
    beforeUnmount() {
      // Curăță store-ul când componenta se distruge
      this.questionnaireStore.resetQuestionnaire()
      // Curăță notificările
      this.notifications = []
    }
  }
  </script>
  
  <style scoped>
  .patient-dashboard {
    /* Full screen layout ca AuthPage */
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-sizing: border-box;
  }
  
  .dashboard-header {
    background: white;
    padding: clamp(15px, 3vw, 25px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    /* Header rămâne fix în partea de sus */
    position: sticky;
    top: 0;
    z-index: 100;
    flex-shrink: 0;
  }
  
  .dashboard-header h1 {
    margin: 0;
    font-size: clamp(20px, 4vw, 28px);
    color: #333;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: clamp(10px, 2vw, 20px);
    font-size: clamp(14px, 2.5vw, 16px);
  }
  
  .logout-btn {
    padding: clamp(8px, 1.5vw, 12px) clamp(12px, 2.5vw, 20px);
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: clamp(12px, 2vw, 14px);
    transition: all 0.3s ease;
    font-weight: 500;
  }
  
  .logout-btn:hover {
    background-color: #d32f2f;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  }
  
  .dashboard-content {
    flex: 1;
    padding: clamp(15px, 3vw, 30px);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    /* Permite scroll dacă conținutul e prea mare */
    overflow-y: auto;
  }
  
  .welcome-card {
    background: white;
    padding: clamp(20px, 4vw, 40px);
    border-radius: 12px;
    margin-bottom: clamp(20px, 4vw, 40px);
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border: 1px solid rgba(0,0,0,0.05);
  }
  
  .welcome-card h2 {
    margin: 0 0 clamp(10px, 2vw, 20px) 0;
    font-size: clamp(18px, 3.5vw, 24px);
    color: #333;
  }
  
  .welcome-card p {
    margin: 0;
    font-size: clamp(14px, 2.5vw, 16px);
    color: #666;
    line-height: 1.6;
  }
  
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: clamp(15px, 3vw, 25px);
  }
  
  .action-card {
    background: white;
    padding: clamp(20px, 3vw, 30px);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border: 1px solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
  }
  
  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }
  
  .action-card h3 {
    margin: 0 0 clamp(8px, 1.5vw, 15px) 0;
    font-size: clamp(16px, 3vw, 20px);
    color: #333;
  }
  
  .action-card p {
    margin: 0 0 clamp(15px, 2.5vw, 20px) 0;
    font-size: clamp(13px, 2.2vw, 15px);
    color: #666;
    line-height: 1.5;
  }
  
  .action-btn {
    padding: clamp(10px, 2vw, 15px) clamp(15px, 3vw, 25px);
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: clamp(14px, 2.5vw, 16px);
    font-weight: 500;
    transition: all 0.3s ease;
    width: 100%;
  }
  
  .action-btn:hover:not(:disabled) {
    background-color: #45a049;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  .action-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Notificări Toast */
  .notifications-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  }

  .notification {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: slideInRight 0.3s ease-out;
    border-left: 4px solid;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .notification:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  }

  .notification-success {
    background: #ecfdf5;
    border-left-color: #10b981;
    color: #065f46;
  }

  .notification-error {
    background: #fef2f2;
    border-left-color: #ef4444;
    color: #991b1b;
  }

  .notification-warning {
    background: #fffbeb;
    border-left-color: #f59e0b;
    color: #92400e;
  }

  .notification-info {
    background: #eff6ff;
    border-left-color: #3b82f6;
    color: #1e40af;
  }

  .notification-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .notification-message {
    flex: 1;
    font-weight: 500;
    line-height: 1.4;
  }

  .notification-close {
    background: none;
    border: none;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    font-size: 14px;
  }

  .notification-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }
  
  /* Responsive adjustments */
  @media (min-width: 768px) {
    .quick-actions {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    .quick-actions {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (max-width: 480px) {
    .dashboard-header {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }
    
    .user-info {
      flex-direction: column;
      gap: 10px;
    }

    .notifications-container {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .notification {
      padding: 12px 16px;
    }
  }
  </style>