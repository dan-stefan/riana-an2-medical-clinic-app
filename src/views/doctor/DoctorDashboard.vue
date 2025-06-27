<template>
  <div class="doctor-dashboard">
    <header class="dashboard-header">
      <img src="/img/logo/logoD.png" alt="Glowdent Logo" class="logo" />
      <h1>Dashboard Medic</h1>
      <div class="user-info">
        
        <span>Dr. {{ authStore.userProfile?.nume_complet }}</span>
        <button @click="logout" class="logout-btn">Deconectare</button>
      </div>
    </header>

    <div class="dashboard-content">
      <div class="welcome-card">
        <h2>Bine ai venit, Doctore!</h2>
        <p>Aici vei putea vizualiza și analiza datele medicale ale pacienților tăi.</p>
      </div>

      <div class="quick-actions">
        <div class="action-card">
          <h3>Pacienți</h3>
          <p>Vezi lista pacienților și datele lor medicale</p>
          <button @click="viewPatients" class="action-btn">Gestionează Pacienți</button>
        </div>
        
        <div class="action-card">
          <h3>Rapoarte</h3>
          <p>Generează rapoarte și statistici</p>
          <button @click="viewReports" class="action-btn">Generează Rapoarte</button>
        </div>

        <div class="action-card">
          <h3>Programările Mele</h3>
          <p>Vezi și gestionează programările tale</p>
          <button @click="viewAppointments" class="action-btn">Vezi Programările</button>
        </div>
      </div>
    </div>

    <!-- Modal pentru gestionarea pacienților -->
    <Pacienti 
      :show="showPatients"
      @close="showPatients = false"
      @patient-selected="onPatientSelected"
    />

    <!-- Modal pentru detaliile pacientului -->
    <PatientDetails 
      :show="showPatientDetails"
      :selected-patient="selectedPatient"
      @close="showPatientDetails = false"
    />

    <!-- Modal pentru rapoarte -->
    <Rapoarte 
      :show="showReports"
      @close="showReports = false"
    />

    <!-- Modal pentru programări -->
    <AppointmentsModal 
      :show="showAppointments"
      @close="showAppointments = false"
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
import Pacienti from '@/components/doctor/Pacienti.vue'
import PatientDetails from '@/components/doctor/PatientDetails.vue'
import Rapoarte from '@/components/doctor/Rapoarte.vue'
import AppointmentsModal from '@/components/doctor/AppointmentsModal.vue'

export default {
  name: 'DoctorDashboard',
  components: {
    Pacienti,
    PatientDetails,
    Rapoarte,
    AppointmentsModal
  },
  data() {
    return {
      showPatients: false,
      showPatientDetails: false,
      showReports: false,
      showAppointments: false,
      selectedPatient: null,
      notifications: [],
      notificationId: 0
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    }
  },
  methods: {
    async logout() {
      const success = await this.authStore.signOut()
      if (success) {
        this.$router.push('/')
      }
    },

    viewPatients() {
      this.showPatients = true
    },

    viewReports() {
      this.showReports = true
    },

    viewAppointments() {
      this.showAppointments = true
    },

    onPatientSelected(patient) {
      this.selectedPatient = patient
      this.showPatients = false
      this.showPatientDetails = true
      this.showNotification(`Afișare detalii pentru ${patient.nume_complet}`, 'info')
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
  }
}
</script>

<style scoped>
.doctor-dashboard {
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
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  padding: clamp(15px, 3vw, 25px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  /* Header rămâne fix în partea de sus */
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.dashboard-header h1 {
  margin: 0;
  font-size: clamp(20px, 4vw, 28px);
  color: white;
  
}

.user-info {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 20px);
  font-size: clamp(14px, 2.5vw, 16px);
}

.logout-btn {
  padding: clamp(8px, 1.5vw, 12px) clamp(12px, 2.5vw, 20px);
  background-color: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(12px, 2vw, 14px);
  transition: all 0.3s ease;
  font-weight: 500;
}

.logout-btn:hover {
  background-color: rgba(255,255,255,0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255,255,255,0.2);
}

.dashboard-content {
  flex: 1;
  padding: clamp(15px, 3vw, 30px);
  padding-bottom: clamp(40px, 8vw, 80px);
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
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: clamp(14px, 2.5vw, 16px);
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;
}

.action-btn:hover {
  background-color: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
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

.logo {
  display: none; /* Hide by default */
  width: 200px; /* Adjust width as needed */
  height: 80px; /* Set height to crop the image further */
  
}

@media (min-width: 768px) {
  .logo {
    display: block; /* Show on desktop */
  }
}
</style>