<template>
  <div v-if="show && selectedPatient" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="header-content">
          <h2>👤 {{ selectedPatient.nume_complet }}</h2>
          <div class="patient-meta">
            <span class="meta-item">ID: {{ selectedPatient.id }}</span>
            <span :class="['meta-badge', selectedPatient.hasQuestionnaire ? 'completed' : 'pending']">
              {{ selectedPatient.hasQuestionnaire ? 'Chestionar completat' : 'Chestionar lipsă' }}
            </span>
          </div>
        </div>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Navigation Tabs -->
        <div class="tabs-navigation">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-btn', { 'active': activeTab === tab.id }]"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Content Area -->
        <div class="tab-content">
          <!-- Informații Generale -->
          <div v-if="activeTab === 'general'" class="general-content">
            <div class="info-sections">
              <div class="info-section">
                <h4>📋 Informații Personale</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nume complet:</span>
                    <span class="info-value">{{ selectedPatient.nume_complet }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ selectedPatient.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">{{ selectedPatient.telefon || 'Nu este specificat' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Data nașterii:</span>
                    <span class="info-value">
                      {{ selectedPatient.data_nasterii ? formatDate(selectedPatient.data_nasterii) : 'Nu este specificată' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Vârstă:</span>
                    <span class="info-value">
                      {{ selectedPatient.data_nasterii ? calculateAge(selectedPatient.data_nasterii) + ' ani' : 'N/A' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Categoria vârstă:</span>
                    <span class="info-value">
                      {{ selectedPatient.varsta_categoria === 'minor' ? 'Minor (sub 18 ani)' : 'Adult (peste 18 ani)' }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="selectedPatient.varsta_categoria === 'minor'" class="info-section">
                <h4>👨‍👩‍👧‍👦 Reprezentant Legal</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nume reprezentant:</span>
                    <span class="info-value">{{ selectedPatient.reprezentant_legal_nume || 'Nu este specificat' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">CNP reprezentant:</span>
                    <span class="info-value">{{ selectedPatient.reprezentant_legal_cnp || 'Nu este specificat' }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>🕐 Informații Cont</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Data înregistrării:</span>
                    <span class="info-value">{{ formatDate(selectedPatient.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Ultima actualizare:</span>
                    <span class="info-value">{{ formatDate(selectedPatient.updated_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chestionar Medical -->
          <div v-if="activeTab === 'questionnaire'" class="questionnaire-content">
            <div v-if="loadingQuestionnaire" class="loading-state">
              <div class="loading-spinner"></div>
              <p>Se încarcă chestionarul...</p>
            </div>

            <div v-else-if="questionnaireError" class="error-state">
              <div class="error-icon">❌</div>
              <h3>Eroare la încărcarea chestionarului</h3>
              <p>{{ questionnaireError }}</p>
              <button @click="loadQuestionnaire" class="btn-primary">Încearcă din nou</button>
            </div>

            <div v-else-if="!questionnaire" class="empty-state">
              <div class="empty-icon">📝</div>
              <h3>Chestionar medical lipsă</h3>
              <p>Acest pacient nu a completat încă chestionarul medical.</p>
            </div>

            <div v-else class="questionnaire-details">
              <div class="questionnaire-header">
                <h4>📋 Chestionar Medical - {{ questionnaire.tip_chestionar === 'minor' ? 'Minor' : 'Adult' }}</h4>
                <div class="questionnaire-meta">
                  <span class="meta-item">Completat la: {{ formatDate(questionnaire.completat_la) }}</span>
                  <span v-if="questionnaire.semnat_la" class="meta-item">Semnat la: {{ formatDate(questionnaire.semnat_la) }}</span>
                  <span :class="['status-badge', questionnaire.status]">{{ getStatusLabel(questionnaire.status) }}</span>
                </div>
              </div>

              <div class="questionnaire-responses">
                <div 
                  v-for="(value, key) in questionnaire.data_chestionar"
                  :key="key"
                  class="response-item"
                >
                  <span class="response-label">{{ formatQuestionLabel(key) }}:</span>
                  <span class="response-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Programări -->
          <div v-if="activeTab === 'appointments'" class="appointments-content">
            <div class="appointments-header">
              <h4>🗓️ Programări Pacient</h4>
              <button @click="showCreateAppointment = true" class="btn-primary">
                ➕ Programare Nouă
              </button>
            </div>

            <div v-if="loadingAppointments" class="loading-state">
              <div class="loading-spinner"></div>
              <p>Se încarcă programările...</p>
            </div>

            <div v-else-if="appointmentsError" class="error-state">
              <div class="error-icon">❌</div>
              <h3>Eroare la încărcarea programărilor</h3>
              <p>{{ appointmentsError }}</p>
              <button @click="loadAppointments" class="btn-primary">Încearcă din nou</button>
            </div>

            <div v-else-if="appointments.length === 0" class="empty-state">
              <div class="empty-icon">📅</div>
              <h3>Nicio programare găsită</h3>
              <p>Acest pacient nu are programări înregistrate.</p>
              <button @click="showCreateAppointment = true" class="btn-primary">
                Creează prima programare
              </button>
            </div>

            <div v-else class="appointments-list">
              <div 
                v-for="appointment in appointments"
                :key="appointment.id"
                class="appointment-card"
              >
                <div class="appointment-header">
                  <div class="appointment-date">
                    <span class="date-main">{{ formatAppointmentDate(appointment.appointment_date) }}</span>
                    <span class="time-main">{{ appointment.appointment_time }}</span>
                  </div>
                  <span :class="['status-badge', appointment.status]">
                    {{ getAppointmentStatusLabel(appointment.status) }}
                  </span>
                </div>

                <div class="appointment-details">
                  <div v-if="appointment.servicii" class="service-info">
                    <span class="service-name">💼 {{ appointment.servicii.nume }}</span>
                    <span class="service-duration">⏱️ {{ appointment.duration_minutes }}min</span>
                    <span class="service-price">💰 {{ formatPrice(appointment.total_price) }}</span>
                  </div>

                  <div v-if="appointment.patient_notes" class="notes-section">
                    <h5>📝 Notițe pacient:</h5>
                    <p>{{ appointment.patient_notes }}</p>
                  </div>

                  <div v-if="appointment.doctor_notes" class="notes-section">
                    <h5>🩺 Notițe doctor:</h5>
                    <p>{{ appointment.doctor_notes }}</p>
                  </div>
                </div>

                <div class="appointment-actions">
                  <button 
                    v-if="appointment.status === 'scheduled'"
                    @click="updateAppointmentStatus(appointment.id, 'confirmed')"
                    class="btn-small btn-success"
                  >
                    ✅ Confirmă
                  </button>
                  
                  <button 
                    v-if="['scheduled', 'confirmed'].includes(appointment.status)"
                    @click="updateAppointmentStatus(appointment.id, 'completed')"
                    class="btn-small btn-primary"
                  >
                    ✅ Marchează Completată
                  </button>
                  
                  <button 
                    v-if="['scheduled', 'confirmed'].includes(appointment.status)"
                    @click="updateAppointmentStatus(appointment.id, 'cancelled')"
                    class="btn-small btn-danger"
                  >
                    ❌ Anulează
                  </button>

                  <button 
                    @click="editAppointmentNotes(appointment)"
                    class="btn-small btn-secondary"
                  >
                    📝 Editează Notițe
                  </button>
                </div>
              </div>
            </div>

            <!-- Create Appointment Modal -->
            <div v-if="showCreateAppointment" class="create-appointment-modal">
              <div class="modal-overlay-small" @click="showCreateAppointment = false">
                <div class="modal-small" @click.stop>
                  <div class="modal-header-small">
                    <h3>➕ Programare Nouă pentru {{ selectedPatient.nume_complet }}</h3>
                    <button @click="showCreateAppointment = false" class="close-btn">✕</button>
                  </div>
                  
                  <div class="modal-body-small">
                    <div class="form-grid">
                      <div class="form-group">
                        <label>Data:</label>
                        <input 
                          type="date" 
                          v-model="newAppointment.date"
                          :min="getTomorrowDate()"
                        />
                      </div>
                      
                      <div class="form-group">
                        <label>Ora:</label>
                        <input 
                          type="time" 
                          v-model="newAppointment.time"
                          step="1800"
                        />
                      </div>
                      
                      <div class="form-group">
                        <label>Serviciu:</label>
                        <select v-model="newAppointment.serviceId">
                          <option value="">Selectează serviciul...</option>
                          <option 
                            v-for="service in services"
                            :key="service.id"
                            :value="service.id"
                          >
                            {{ service.nume }} - {{ formatPrice(service.pret) }}
                          </option>
                        </select>
                      </div>
                      
                      <div class="form-group full-width">
                        <label>Notițe doctor (opțional):</label>
                        <textarea 
                          v-model="newAppointment.doctorNotes"
                          rows="3"
                          placeholder="Adaugă notițe sau observații..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="modal-footer-small">
                    <button @click="showCreateAppointment = false" class="btn-secondary">
                      Anulează
                    </button>
                    <button 
                      @click="createAppointment"
                      :disabled="!canCreateAppointment || creatingAppointment"
                      class="btn-primary"
                    >
                      <span v-if="creatingAppointment">Se creează...</span>
                      <span v-else>📅 Creează Programarea</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Notes Modal -->
            <div v-if="showEditNotes" class="edit-notes-modal">
              <div class="modal-overlay-small" @click="showEditNotes = false">
                <div class="modal-small" @click.stop>
                  <div class="modal-header-small">
                    <h3>📝 Editează Notițe Doctor</h3>
                    <button @click="showEditNotes = false" class="close-btn">✕</button>
                  </div>
                  
                  <div class="modal-body-small">
                    <div class="form-group">
                      <label>Notițe doctor:</label>
                      <textarea 
                        v-model="editingNotes"
                        rows="4"
                        placeholder="Adaugă notițe medicale, observații sau recomandări..."
                      ></textarea>
                    </div>
                  </div>
                  
                  <div class="modal-footer-small">
                    <button @click="showEditNotes = false" class="btn-secondary">
                      Anulează
                    </button>
                    <button 
                      @click="saveAppointmentNotes"
                      :disabled="savingNotes"
                      class="btn-primary"
                    >
                      <span v-if="savingNotes">Se salvează...</span>
                      <span v-else>💾 Salvează</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn-secondary">Închide</button>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'PatientDetails',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    selectedPatient: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  mounted() {
    console.log('PatientDetails component mounted')
    console.log('Initial selectedPatient:', this.selectedPatient)
    console.log('Initial activeTab:', this.activeTab)
    console.log('Modal show prop:', this.show)
  },
  data() {
    return {
      activeTab: 'general',
      tabs: [
        { id: 'general', label: 'Informații Generale', icon: '👤' },
        { id: 'questionnaire', label: 'Chestionar Medical', icon: '📋' },
        { id: 'appointments', label: 'Programări', icon: '🗓️' }
      ],
      questionnaire: null,
      loadingQuestionnaire: false,
      questionnaireError: null,
      
      // Appointments
      appointments: [],
      loadingAppointments: false,
      appointmentsError: null,
      
      // Services for appointment creation
      services: [],
      
      // Create appointment
      showCreateAppointment: false,
      creatingAppointment: false,
      newAppointment: {
        date: '',
        time: '',
        serviceId: '',
        doctorNotes: ''
      },
      
      // Edit notes
      showEditNotes: false,
      editingAppointment: null,
      editingNotes: '',
      savingNotes: false
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    
    canCreateAppointment() {
      return this.newAppointment.date && 
             this.newAppointment.time && 
             this.newAppointment.serviceId
    }
  },

  watch: {
    show(newVal) {
      console.log('PatientDetails modal show changed:', newVal)
      if (newVal && this.selectedPatient) {
        console.log('Loading data for patient:', this.selectedPatient)
        console.log('Patient user_id:', this.selectedPatient.user_id)
        console.log('Patient profile id:', this.selectedPatient.id)
        console.log('Has questionnaire:', this.selectedPatient.hasQuestionnaire)
        this.loadQuestionnaire()
        this.loadServices()
      }
    },

    activeTab(newTab) {
      console.log('Active tab changed to:', newTab)
      if (newTab === 'questionnaire') {
        console.log('Loading questionnaire tab...')
        console.log('Patient hasQuestionnaire:', this.selectedPatient?.hasQuestionnaire)
        if (!this.questionnaire) {
          console.log('No questionnaire loaded, attempting to load...')
          this.loadQuestionnaire()
        }
      } else if (newTab === 'appointments') {
        console.log('Loading appointments because tab changed to appointments')
        console.log('About to call loadAppointments()...')
        try {
          this.loadAppointments()
          console.log('loadAppointments() called successfully')
        } catch (error) {
          console.error('Error calling loadAppointments:', error)
        }
      }
    },

    selectedPatient(newPatient) {
      console.log('Selected patient changed:', newPatient)
      if (newPatient && this.activeTab === 'appointments') {
        console.log('Reloading appointments for new patient')
        this.loadAppointments()
      }
      if (newPatient && this.activeTab === 'questionnaire') {
        console.log('Reloading questionnaire for new patient')
        this.loadQuestionnaire()
      }
    }
  },

  methods: {
    async loadQuestionnaire() {
      if (!this.selectedPatient?.id) {
        console.log('❌ No patient profile id available')
        return
      }

      this.loadingQuestionnaire = true
      this.questionnaireError = null

      try {
        console.log('🔍 Loading questionnaire for patient:', this.selectedPatient.nume_complet)
        console.log('📋 Using patient profile id:', this.selectedPatient.id)  // Use profile ID for questionnaires
        
        // Try to load any questionnaire (not just signed ones) to see what's available
        const { data: questionnaires, error } = await supabase
          .from('medical_questionnaires')
          .select('*')
          .eq('patient_id', this.selectedPatient.id)  // FIXED: Use profile id for questionnaires
          .order('completat_la', { ascending: false })

        console.log('📊 All questionnaires for patient:', questionnaires)
        console.log('📊 Questionnaire query error:', error)

        if (error) throw error

        // Prefer signed questionnaires, but show completed ones too
        const signedQuestionnaire = questionnaires?.find(q => q.status === 'signed')
        const completedQuestionnaire = questionnaires?.find(q => q.status === 'completed')
        
        this.questionnaire = signedQuestionnaire || completedQuestionnaire || null
        console.log('✅ Selected questionnaire:', this.questionnaire)

      } catch (error) {
        console.error('❌ Error loading questionnaire:', error)
        this.questionnaireError = error.message
      } finally {
        this.loadingQuestionnaire = false
      }
    },

    async loadAppointments() {
      console.log('🔍 Starting loadAppointments...')
      console.log('📋 Selected patient:', this.selectedPatient)
      console.log('👨‍⚕️ Auth store user:', this.authStore.user)
      
      this.loadingAppointments = true
      this.appointmentsError = null

      try {
        // Log the query parameters
        const queryParams = {
          patient_id: this.selectedPatient.user_id,  // FIXED: Use user_id instead of id
          doctor_id: this.authStore.user.id
        }
        console.log('🔎 Query parameters:', queryParams)

        const { data: appointments, error } = await supabase
          .from('appointments')
          .select(`
            *,
            servicii (
              nume,
              pret,
              durata
            )
          `)
          .eq('patient_id', this.selectedPatient.user_id)  // FIXED: Use user_id instead of id
          .eq('doctor_id', this.authStore.user.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })

        console.log('📊 Supabase response - data:', appointments)
        console.log('📊 Supabase response - error:', error)

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }

        this.appointments = appointments || []
        console.log('✅ Final appointments array:', this.appointments)
        console.log('📊 Appointments count:', this.appointments.length)

      } catch (error) {
        console.error('💥 Error in loadAppointments:', error)
        this.appointmentsError = error.message
      } finally {
        this.loadingAppointments = false
        console.log('🏁 loadAppointments finished')
      }
    },

    async loadServices() {
      try {
        const { data: services, error } = await supabase
          .from('servicii')
          .select('*')
          .eq('is_active', true)
          .order('ordine', { ascending: true })

        if (error) throw error
        this.services = services || []

      } catch (error) {
        console.error('Error loading services:', error)
      }
    },

    async createAppointment() {
      this.creatingAppointment = true

      try {
        const selectedService = this.services.find(s => s.id === this.newAppointment.serviceId)
        
        const appointmentData = {
          doctor_id: this.authStore.user.id,
          patient_id: this.selectedPatient.user_id,  // FIXED: Use user_id instead of id
          service_id: this.newAppointment.serviceId,
          appointment_date: this.newAppointment.date,
          appointment_time: this.newAppointment.time,
          duration_minutes: selectedService?.durata || 30,
          status: 'confirmed', // Doctor creates as confirmed
          doctor_notes: this.newAppointment.doctorNotes.trim() || null,
          total_price: selectedService?.pret || 0
        }

        const { data: appointment, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()

        if (error) throw error

        this.showCreateAppointment = false
        this.resetNewAppointment()
        this.loadAppointments()
        this.showNotification('Programarea a fost creată cu succes!', 'success')

      } catch (error) {
        console.error('Error creating appointment:', error)
        this.showNotification(`Eroare la crearea programării: ${error.message}`, 'error')
      } finally {
        this.creatingAppointment = false
      }
    },

    async updateAppointmentStatus(appointmentId, newStatus) {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)

        if (error) throw error

        this.loadAppointments()
        this.showNotification(`Status programare actualizat: ${this.getAppointmentStatusLabel(newStatus)}`, 'success')

      } catch (error) {
        console.error('Error updating appointment status:', error)
        this.showNotification(`Eroare la actualizare: ${error.message}`, 'error')
      }
    },

    editAppointmentNotes(appointment) {
      this.editingAppointment = appointment
      this.editingNotes = appointment.doctor_notes || ''
      this.showEditNotes = true
    },

    async saveAppointmentNotes() {
      this.savingNotes = true

      try {
        const { error } = await supabase
          .from('appointments')
          .update({ 
            doctor_notes: this.editingNotes.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editingAppointment.id)

        if (error) throw error

        this.showEditNotes = false
        this.loadAppointments()
        this.showNotification('Notițele au fost salvate cu succes!', 'success')

      } catch (error) {
        console.error('Error saving notes:', error)
        this.showNotification(`Eroare la salvare: ${error.message}`, 'error')
      } finally {
        this.savingNotes = false
      }
    },

    getTomorrowDate() {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    },

    resetNewAppointment() {
      this.newAppointment = {
        date: '',
        time: '',
        serviceId: '',
        doctorNotes: ''
      }
    },

    calculateAge(birthDate) {
      if (!birthDate) return 'N/A'
      
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatAppointmentDate(dateString) {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatPrice(price) {
      if (!price) return '0 RON'
      return `${price} RON`
    },

    getStatusLabel(status) {
      const labels = {
        'draft': 'Draft',
        'completed': 'Completat',
        'signed': 'Semnat'
      }
      return labels[status] || status
    },

    getAppointmentStatusLabel(status) {
      const labels = {
        'scheduled': 'Programată',
        'confirmed': 'Confirmată',
        'completed': 'Completată',
        'cancelled': 'Anulată',
        'no_show': 'Nu s-a prezentat'
      }
      return labels[status] || status
    },

    formatQuestionLabel(key) {
      const labels = {
        'stare_sanatate': 'Starea generală de sănătate',
        'alergii': 'Alergii cunoscute',
        'medicamente_curente': 'Medicamente curente',
        'boli_inima': 'Boli cardiovasculare',
        'diabet': 'Diabet',
        'fumat': 'Fumător',
        'alcool': 'Consumă alcool',
        'interventii_chirurgicale': 'Intervenții chirurgicale anterioare',
        'boli_familie': 'Boli în familie',
        'observatii': 'Observații suplimentare'
      }
      return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },

    showNotification(message, type = 'info') {
      // Simple alert for now - can be replaced with toast notifications
      alert(message)
    },

    handleOverlayClick() {
      this.closeModal()
    },

    closeModal() {
      this.activeTab = 'general'
      this.questionnaire = null
      this.appointments = []
      this.showCreateAppointment = false
      this.showEditNotes = false
      this.resetNewAppointment()
      this.$emit('close')
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
  z-index: 1100;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  max-width: 900px;
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
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-content h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
}

.patient-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: #6b7280;
}

.meta-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.meta-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.meta-badge.pending {
  background: #fef3c7;
  color: #92400e;
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
  padding: 0;
}

/* Navigation Tabs */
.tabs-navigation {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  color: #2196F3;
  background: white;
  border-bottom-color: #2196F3;
}

/* Content Area */
.tab-content {
  padding: 30px;
}

/* General Info Styles */
.info-sections {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.info-section {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.info-section h4 {
  margin: 0 0 15px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

/* Questionnaire Styles */
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

.questionnaire-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.questionnaire-header {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.questionnaire-header h4 {
  margin: 0 0 10px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.questionnaire-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.questionnaire-responses {
  display: grid;
  gap: 12px;
}

.response-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.response-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  flex: 1;
}

.response-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  max-width: 60%;
  text-align: right;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.signed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.draft {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* Appointments Styles */
.appointments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.appointments-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.appointment-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.appointment-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.appointment-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-main {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.time-main {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.appointment-details {
  margin-bottom: 15px;
}

.service-info {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.service-name {
  font-weight: 600;
  color: #1f2937;
}

.service-duration,
.service-price {
  font-size: 14px;
  color: #6b7280;
}

.notes-section {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.notes-section h5 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.notes-section p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.appointment-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-small {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Modal Styles */
.modal-overlay-small {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.modal-small {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header-small {
  padding: 20px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-small h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.modal-body-small {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-footer-small {
  padding: 20px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196F3;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-secondary,
.btn-primary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 120px;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-container {
    margin: 10px;
    max-width: none;
  }

  .tab-content {
    padding: 20px;
  }

  .tabs-navigation {
    flex-direction: column;
  }

  .tab-btn {
    border-bottom: none;
    border-right: 3px solid transparent;
  }

  .tab-btn.active {
    border-bottom: none;
    border-right-color: #2196F3;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .patient-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .response-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .response-value {
    max-width: 100%;
    text-align: left;
  }

  .appointments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .appointment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .service-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .appointment-actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn-small {
    width: 100%;
    text-align: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer-small {
    flex-direction: column;
    gap: 10px;
  }
}
</style>