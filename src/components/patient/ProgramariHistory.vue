<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>📋 Istoric Programări</h2>
        <div class="header-actions">
          <div class="filter-controls">
            <select v-model="statusFilter" class="filter-select">
              <option value="">Toate statusurile</option>
              <option value="scheduled">Programată</option>
              <option value="confirmed">Confirmată</option>
              <option value="completed">Completată</option>
              <option value="cancelled">Anulată</option>
              <option value="no_show">Nu s-a prezentat</option>
            </select>
            <select v-model="timeFilter" class="filter-select">
              <option value="">Toate programările</option>
              <option value="past">Programări trecute</option>
              <option value="future">Programări viitoare</option>
              <option value="today">Astăzi</option>
            </select>
          </div>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Se încarcă istoricul programărilor...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h3>Eroare la încărcarea istoricului</h3>
          <p>{{ error }}</p>
          <button @click="loadAppointments" class="btn-primary">Încearcă din nou</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredAppointments.length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Nu există programări</h3>
          <p v-if="statusFilter || timeFilter">
            Nu s-au găsit programări cu filtrele selectate.
          </p>
          <p v-else>
            Nu aveți încă nicio programare în sistem.
          </p>
          <button @click="clearFilters" class="btn-primary">Resetează filtrele</button>
        </div>

        <!-- Appointments List -->
        <div v-else class="appointments-content">
          <div class="appointments-header">
            <div class="appointments-count">
              {{ filteredAppointments.length }} programări găsite
            </div>
            <div class="appointments-stats">
              <span class="stat">
                <span class="stat-icon">💰</span>
                Total cheltuieli: {{ formatPrice(totalSpent) }}
              </span>
              <span class="stat">
                <span class="stat-icon">✅</span>
                Complete: {{ completedCount }}
              </span>
              <span class="stat">
                <span class="stat-icon">📅</span>
                Viitoare: {{ futureCount }}
              </span>
            </div>
          </div>

          <div class="appointments-list">
            <div 
              v-for="appointment in filteredAppointments"
              :key="appointment.id"
              class="appointment-card"
              :class="['status-' + appointment.status]"
            >
              <div class="appointment-header">
                <div class="appointment-date-time">
                  <div class="appointment-date">
                    {{ formatAppointmentDate(appointment.appointment_date) }}
                  </div>
                  <div class="appointment-time">
                    {{ appointment.appointment_time }} - 
                    {{ getEndTime(appointment.appointment_time, appointment.duration_minutes) }}
                  </div>
                </div>
                
                <div class="appointment-status">
                  <span :class="['status-badge', appointment.status]">
                    {{ getStatusLabel(appointment.status) }}
                  </span>
                </div>
              </div>

              <div class="appointment-details">
                <div class="detail-section">
                  <div class="detail-item">
                    <span class="detail-label">👨‍⚕️ Doctor:</span>
                    <span class="detail-value">{{ appointment.user_profiles?.nume_complet }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">💼 Serviciu:</span>
                    <span class="detail-value">{{ appointment.servicii?.nume }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">⏱️ Durată:</span>
                    <span class="detail-value">{{ appointment.duration_minutes }} minute</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">💰 Preț:</span>
                    <span class="detail-value price">{{ formatPrice(appointment.total_price) }}</span>
                  </div>
                </div>

                <div v-if="appointment.patient_notes || appointment.doctor_notes" class="notes-section">
                  <div v-if="appointment.patient_notes" class="note-item">
                    <div class="note-label">📝 Observațiile mele:</div>
                    <div class="note-content">{{ appointment.patient_notes }}</div>
                  </div>
                  
                  <div v-if="appointment.doctor_notes" class="note-item">
                    <div class="note-label">🩺 Notițe doctor:</div>
                    <div class="note-content">{{ appointment.doctor_notes }}</div>
                  </div>
                </div>

                <div class="appointment-actions">
                  <button 
                    v-if="appointment.status === 'scheduled'"
                    @click="cancelAppointment(appointment.id)"
                    class="btn-action btn-danger"
                    :disabled="cancellingAppointment === appointment.id"
                  >
                    <span v-if="cancellingAppointment === appointment.id">Se anulează...</span>
                    <span v-else>❌ Anulează</span>
                  </button>
                  
                  <button 
                    v-if="appointment.status === 'confirmed'"
                    @click="rescheduleAppointment(appointment)"
                    class="btn-action btn-secondary"
                  >
                    📅 Reprogramează
                  </button>
                  
                  <button 
                    @click="viewAppointmentDetails(appointment)"
                    class="btn-action btn-primary"
                  >
                    👁️ Vezi detalii
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-stats">
          <span>Total programări: {{ appointments.length }}</span>
          <span>Total cheltuieli: {{ formatPrice(totalSpent) }}</span>
        </div>
        <div class="footer-actions">
          <button @click="exportHistory" class="btn-secondary">📊 Exportă</button>
          <button @click="closeModal" class="btn-primary">Închide</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Appointment Details Modal -->
  <div v-if="showDetailsModal && selectedAppointment" class="details-modal-overlay" @click="closeDetailsModal">
    <div class="details-modal-container" @click.stop>
      <div class="details-modal-header">
        <h3>📋 Detalii Programare</h3>
        <button @click="closeDetailsModal" class="close-btn">✕</button>
      </div>

      <div class="details-modal-body">
        <div class="details-section">
          <h4>📅 Informații Programare</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Data:</span>
              <span class="detail-value">{{ formatAppointmentDate(selectedAppointment.appointment_date) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ora:</span>
              <span class="detail-value">{{ selectedAppointment.appointment_time }} - {{ getEndTime(selectedAppointment.appointment_time, selectedAppointment.duration_minutes) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Durată:</span>
              <span class="detail-value">{{ selectedAppointment.duration_minutes }} minute</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span :class="['status-badge', selectedAppointment.status]">
                {{ getStatusLabel(selectedAppointment.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="details-section">
          <h4>👨‍⚕️ Informații Doctor</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Nume:</span>
              <span class="detail-value">{{ selectedAppointment.user_profiles?.nume_complet }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ selectedAppointment.user_profiles?.email }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value">{{ selectedAppointment.user_profiles?.telefon || 'Nu disponibil' }}</span>
            </div>
          </div>
        </div>

        <div class="details-section">
          <h4>💼 Informații Serviciu</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Serviciu:</span>
              <span class="detail-value">{{ selectedAppointment.servicii?.nume }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Preț:</span>
              <span class="detail-value price">{{ formatPrice(selectedAppointment.total_price) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Durată serviciu:</span>
              <span class="detail-value">{{ selectedAppointment.servicii?.durata }} minute</span>
            </div>
          </div>
        </div>

        <div v-if="selectedAppointment.patient_notes || selectedAppointment.doctor_notes" class="details-section">
          <h4>📝 Observații</h4>
          <div class="notes-container">
            <div v-if="selectedAppointment.patient_notes" class="note-item">
              <div class="note-label">📝 Observațiile mele:</div>
              <div class="note-content">{{ selectedAppointment.patient_notes }}</div>
            </div>
            <div v-if="selectedAppointment.doctor_notes" class="note-item">
              <div class="note-label">🩺 Notițe doctor:</div>
              <div class="note-content">{{ selectedAppointment.doctor_notes }}</div>
            </div>
          </div>
        </div>

        <div class="details-section">
          <h4>📊 Informații Sistem</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">ID Programare:</span>
              <span class="detail-value">{{ selectedAppointment.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Creat la:</span>
              <span class="detail-value">{{ formatDateTime(selectedAppointment.created_at) }}</span>
            </div>
            <div v-if="selectedAppointment.updated_at" class="detail-item">
              <span class="detail-label">Actualizat la:</span>
              <span class="detail-value">{{ formatDateTime(selectedAppointment.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="details-modal-footer">
        <div class="footer-actions">
          <button 
            v-if="selectedAppointment.status === 'scheduled'"
            @click="cancelFromDetails"
            class="btn-danger"
            :disabled="cancellingAppointment === selectedAppointment.id"
          >
            <span v-if="cancellingAppointment === selectedAppointment.id">Se anulează...</span>
            <span v-else>❌ Anulează Programarea</span>
          </button>
          
          <button 
            v-if="selectedAppointment.status === 'confirmed'"
            @click="rescheduleFromDetails"
            class="btn-secondary"
          >
            📅 Reprogramează
          </button>
          
          <button @click="closeDetailsModal" class="btn-primary">
            Închide
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'ProgramariHistory',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'appointment-selected', 'reschedule'],
  data() {
    return {
      appointments: [],
      loading: false,
      error: null,
      statusFilter: '',
      timeFilter: '',
      cancellingAppointment: null,
      showDetailsModal: false,
      selectedAppointment: null
    }
  },
  
  computed: {
    authStore() {
      return useAuthStore()
    },
    
    filteredAppointments() {
      let filtered = [...this.appointments]
      
      // Filter by status
      if (this.statusFilter) {
        filtered = filtered.filter(app => app.status === this.statusFilter)
      }
      
      // Filter by time
      if (this.timeFilter) {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        
        switch (this.timeFilter) {
          case 'past':
            filtered = filtered.filter(app => {
              const appDate = new Date(app.appointment_date + ' ' + app.appointment_time)
              return appDate < now
            })
            break
          case 'future':
            filtered = filtered.filter(app => {
              const appDate = new Date(app.appointment_date + ' ' + app.appointment_time)
              return appDate > now
            })
            break
          case 'today':
            filtered = filtered.filter(app => app.appointment_date === today)
            break
        }
      }
      
      // Sort by date and time (most recent first)
      return filtered.sort((a, b) => {
        const dateA = new Date(a.appointment_date + ' ' + a.appointment_time)
        const dateB = new Date(b.appointment_date + ' ' + b.appointment_time)
        return dateB - dateA
      })
    },
    
    totalSpent() {
      return this.appointments
        .filter(app => app.status === 'completed')
        .reduce((total, app) => total + (app.total_price || 0), 0)
    },
    
    completedCount() {
      return this.appointments.filter(app => app.status === 'completed').length
    },
    
    futureCount() {
      const now = new Date()
      return this.appointments.filter(app => {
        const appDate = new Date(app.appointment_date + ' ' + app.appointment_time)
        return appDate > now
      }).length
    }
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadAppointments()
      }
    }
  },
  
  methods: {
    async loadAppointments() {
      this.loading = true
      this.error = null
      
      try {
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select(`
            *,
            user_profiles!appointments_doctor_id_fkey (
              nume_complet,
              email,
              telefon
            ),
            servicii (
              nume,
              pret,
              durata
            )
          `)
          .eq('patient_id', this.authStore.user.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })

        if (error) throw error
        
        this.appointments = appointments || []
        
      } catch (error) {
        console.error('Error loading appointments:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    formatAppointmentDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    getEndTime(startTime, duration) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(totalMinutes / 60)
      const endMinutes = totalMinutes % 60
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    },
    
    formatPrice(price) {
      if (!price) return '0 RON'
      return `${price} RON`
    },
    
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return 'Nu disponibil'
      const date = new Date(dateTimeString)
      return date.toLocaleString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getStatusLabel(status) {
      const labels = {
        'scheduled': 'Programată',
        'confirmed': 'Confirmată',
        'completed': 'Completată',
        'cancelled': 'Anulată',
        'no_show': 'Nu s-a prezentat'
      }
      return labels[status] || status
    },
    
    async cancelAppointment(appointmentId) {
      this.cancellingAppointment = appointmentId
      
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)
          .eq('patient_id', this.authStore.user.id) // Security: only patient can cancel their own appointments

        if (error) throw error
        
        // Update local state
        const appointment = this.appointments.find(app => app.id === appointmentId)
        if (appointment) {
          appointment.status = 'cancelled'
        }
        
        this.showNotification('Programarea a fost anulată cu succes!', 'success')
        
      } catch (error) {
        console.error('Error cancelling appointment:', error)
        this.showNotification(`Eroare: ${error.message}`, 'error')
      } finally {
        this.cancellingAppointment = null
      }
    },
    
    rescheduleAppointment(appointment) {
      this.$emit('reschedule', appointment)
    },
    
    viewAppointmentDetails(appointment) {
      this.selectedAppointment = appointment
      this.showDetailsModal = true
    },
    
    clearFilters() {
      this.statusFilter = ''
      this.timeFilter = ''
    },
    
    exportHistory() {
      const csvContent = this.generateHistoryCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `istoric_programari_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    
    generateHistoryCSV() {
      const headers = ['Data', 'Ora', 'Doctor', 'Serviciu', 'Durata', 'Pret', 'Status', 'Observatii']
      const rows = this.filteredAppointments.map(app => [
        app.appointment_date,
        app.appointment_time,
        app.user_profiles?.nume_complet || '',
        app.servicii?.nume || '',
        app.duration_minutes || 0,
        app.total_price || 0,
        this.getStatusLabel(app.status),
        app.patient_notes || ''
      ])

      return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')
    },
    
    showNotification(message, type = 'info') {
      alert(message)
    },
    
    handleOverlayClick() {
      this.closeModal()
    },
    
    closeModal() {
      this.$emit('close')
    },
    
    closeDetailsModal() {
      this.showDetailsModal = false
    },
    
    cancelFromDetails() {
      this.cancellingAppointment = this.selectedAppointment.id
      this.cancelAppointment(this.selectedAppointment.id)
    },
    
    rescheduleFromDetails() {
      this.$emit('reschedule', this.selectedAppointment)
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #2196F3;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

/* Loading and Error States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-state h3,
.empty-state h3 {
  color: #1f2937;
  margin: 0 0 10px 0;
  font-size: 18px;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin: 0 0 20px 0;
}

/* Appointments Content */
.appointments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.appointments-count {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.appointments-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-icon {
  font-size: 16px;
}

/* Appointments List */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.appointment-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.appointment-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.appointment-card.status-scheduled {
  border-color: #f59e0b;
  background: #fffbeb;
}

.appointment-card.status-confirmed {
  border-color: #2196F3;
  background: #f0f9ff;
}

.appointment-card.status-completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.appointment-card.status-cancelled {
  border-color: #ef4444;
  background: #fef2f2;
}

.appointment-card.status-no_show {
  border-color: #6b7280;
  background: #f9fafb;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.appointment-date-time {
  flex: 1;
}

.appointment-date {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.appointment-time {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.no_show {
  background: #f3f4f6;
  color: #374151;
}

.appointment-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
}

.detail-value {
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
}

.detail-value.price {
  color: #10b981;
  font-size: 16px;
}

.notes-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.note-item {
  margin-bottom: 12px;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 4px;
}

.note-content {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.appointment-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.btn-action {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 100px;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.footer-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover {
  background: #1976D2;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    margin: 10px;
    max-width: none;
  }
  
  .modal-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .appointments-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .appointments-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .detail-section {
    grid-template-columns: 1fr;
  }
  
  .appointment-actions {
    flex-direction: column;
  }
  
  .btn-action {
    width: 100%;
  }
  
  .footer-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .modal-header h2 {
    font-size: 20px;
  }
  
  .appointment-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .appointment-actions {
    flex-direction: column;
  }
}

/* Details Modal Styles */
.details-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.details-modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s ease-out;
}

.details-modal-header {
  padding: 25px 30px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.details-modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.details-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.details-section {
  margin-bottom: 30px;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-section h4 {
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.notes-container {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
}

.details-modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
}

/* Responsive adjustments for details modal */
@media (max-width: 768px) {
  .details-modal-container {
    margin: 10px;
    max-width: none;
  }
  
  .details-modal-header,
  .details-modal-body,
  .details-modal-footer {
    padding: 20px;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .footer-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .details-modal-header h3 {
    font-size: 18px;
  }
  
  .details-section h4 {
    font-size: 15px;
  }
}
</style>
