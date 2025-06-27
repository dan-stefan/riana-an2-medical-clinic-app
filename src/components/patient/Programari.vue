<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>🗓️ Programare Medicală</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Step 1: Select Doctor -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="step-header">
            <h3>👩‍⚕️ Selectează Doctorul</h3>
            <div class="step-indicator">Pasul 1 din 4</div>
          </div>

          <div v-if="loadingDoctors" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă doctorii...</p>
          </div>

          <div v-else-if="doctorsError" class="error-state">
            <div class="error-icon">❌</div>
            <h4>Eroare la încărcarea doctorilor</h4>
            <p>{{ doctorsError }}</p>
            <button @click="loadDoctors" class="btn-primary">Încearcă din nou</button>
          </div>

          <div v-else class="doctors-grid">
            <div 
              v-for="doctor in doctors"
              :key="doctor.id"
              :class="['doctor-card', { 'selected': selectedDoctor?.id === doctor.id }]"
              @click="selectDoctor(doctor)"
            >
              <div class="doctor-avatar">👨‍⚕️</div>
              <div class="doctor-info">
                <h4>{{ doctor.nume_complet }}</h4>
                <p class="doctor-email">{{ doctor.email }}</p>
                <p class="doctor-status">✅ Disponibil</p>
              </div>
              <div v-if="selectedDoctor?.id === doctor.id" class="selected-indicator">✓</div>
            </div>
          </div>
        </div>

        <!-- Step 2: Select Service -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="step-header">
            <h3>💼 Selectează Serviciul</h3>
            <div class="step-indicator">Pasul 2 din 4</div>
          </div>

          <div v-if="loadingServices" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă serviciile...</p>
          </div>

          <div v-else-if="servicesError" class="error-state">
            <div class="error-icon">❌</div>
            <h4>Eroare la încărcarea serviciilor</h4>
            <p>{{ servicesError }}</p>
            <button @click="loadServices" class="btn-primary">Încearcă din nou</button>
          </div>

          <div v-else class="services-grid">
            <div 
              v-for="service in services"
              :key="service.id"
              :class="['service-card', { 'selected': selectedService?.id === service.id }]"
              @click="selectService(service)"
            >
              <div class="service-header">
                <h4>{{ service.nume }}</h4>
                <span class="service-price">{{ formatPrice(service.pret) }}</span>
              </div>
              <p class="service-description">{{ service.descriere }}</p>
              <div class="service-duration">🕐 {{ service.durata }} minute</div>
              <div v-if="selectedService?.id === service.id" class="selected-indicator">✓</div>
            </div>
          </div>
        </div>

        <!-- Step 3: Select Date & Time -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="step-header">
            <h3>📅 Selectează Data și Ora</h3>
            <div class="step-indicator">Pasul 3 din 4</div>
          </div>

          <div class="datetime-selection">
            <div class="date-section">
              <h4>Selectează Data</h4>
              <div class="date-grid">
                <div 
                  v-for="date in availableDates"
                  :key="date.value"
                  :class="['date-card', { 'selected': selectedDate === date.value, 'disabled': !date.available }]"
                  @click="date.available && selectDate(date.value)"
                >
                  <div class="date-day">{{ date.dayName }}</div>
                  <div class="date-number">{{ date.day }}</div>
                  <div class="date-month">{{ date.month }}</div>
                </div>
              </div>
            </div>

            <div v-if="selectedDate" class="time-section">
              <h4>Selectează Ora</h4>
              <div v-if="loadingTimeSlots" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Se încarcă orele disponibile...</p>
              </div>
              <div v-else class="time-grid">
                <div 
                  v-for="time in availableTimeSlots"
                  :key="time"
                  :class="['time-card', { 'selected': selectedTime === time }]"
                  @click="selectTime(time)"
                >
                  {{ time }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Confirmation -->
        <div v-if="currentStep === 4" class="step-content">
          <div class="step-header">
            <h3>✅ Confirmă Programarea</h3>
            <div class="step-indicator">Pasul 4 din 4</div>
          </div>

          <div class="confirmation-details">
            <div class="confirmation-card">
              <h4>📋 Detalii Programare</h4>
              
              <div class="detail-item">
                <span class="detail-label">👨‍⚕️ Doctor:</span>
                <span class="detail-value">{{ selectedDoctor?.nume_complet }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">💼 Serviciu:</span>
                <span class="detail-value">{{ selectedService?.nume }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">📅 Data:</span>
                <span class="detail-value">{{ formatSelectedDate() }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">🕐 Ora:</span>
                <span class="detail-value">{{ selectedTime }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">⏱️ Durată:</span>
                <span class="detail-value">{{ selectedService?.durata }} minute</span>
              </div>
              
              <div class="detail-item total">
                <span class="detail-label">💰 Total:</span>
                <span class="detail-value">{{ formatPrice(selectedService?.pret) }}</span>
              </div>
            </div>

            <div class="notes-section">
              <h4>📝 Observații (opțional)</h4>
              <textarea 
                v-model="patientNotes"
                placeholder="Adaugă observații sau întrebări pentru doctor..."
                rows="4"
                maxlength="500"
              ></textarea>
              <div class="char-count">{{ patientNotes.length }}/500</div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-buttons">
          <button 
            v-if="currentStep > 1" 
            @click="previousStep" 
            class="btn-secondary"
          >
            ← Înapoi
          </button>
          
          <button @click="closeModal" class="btn-secondary">
            Anulează
          </button>
          
          <button 
            v-if="currentStep < 4"
            @click="nextStep" 
            :disabled="!canProceedToNextStep"
            class="btn-primary"
          >
            Continuă →
          </button>
          
          <button 
            v-if="currentStep === 4"
            @click="confirmAppointment" 
            :disabled="submittingAppointment"
            class="btn-primary"
          >
            <span v-if="submittingAppointment">Se programează...</span>
            <span v-else>📅 Confirmă Programarea</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase.js'

export default {
  name: 'Programari',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'appointment-created'],
  data() {
    return {
      currentStep: 1,
      
      // Doctors
      doctors: [],
      loadingDoctors: false,
      doctorsError: null,
      selectedDoctor: null,
      
      // Services
      services: [],
      loadingServices: false,
      servicesError: null,
      selectedService: null,
      
      // Date & Time
      selectedDate: null,
      selectedTime: null,
      availableDates: [],
      availableTimeSlots: [],
      loadingTimeSlots: false,
      workingHours: null,
      
      // Notes
      patientNotes: '',
      
      // Submission
      submittingAppointment: false
    }
  },
  
  computed: {
    canProceedToNextStep() {
      switch (this.currentStep) {
        case 1: return this.selectedDoctor !== null
        case 2: return this.selectedService !== null
        case 3: return this.selectedDate !== null && this.selectedTime !== null
        case 4: return true
        default: return false
      }
    }
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        this.resetModal()
        this.loadDoctors()
        this.loadWorkingHours()
      }
    },
    
    selectedDate(newDate) {
      if (newDate) {
        this.loadAvailableTimeSlots()
      }
    }
  },
  
  methods: {
    async loadDoctors() {
      this.loadingDoctors = true
      this.doctorsError = null
      
      try {
        const { data: doctors, error } = await supabase
          .from('user_profiles')
          .select('id, nume_complet, email, telefon, created_at')
          .eq('rol', 'doctor')
          .is('status', null)
          .order('nume_complet')

        if (error) throw error
        this.doctors = doctors || []
        
      } catch (error) {
        console.error('Error loading doctors:', error)
        this.doctorsError = error.message
      } finally {
        this.loadingDoctors = false
      }
    },

    async loadServices() {
      this.loadingServices = true
      this.servicesError = null
      
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
        this.servicesError = error.message
      } finally {
        this.loadingServices = false
      }
    },

    async loadWorkingHours() {
      try {
        const { data: workingHoursData, error } = await supabase
          .from('contact')
          .select('valoare, eticheta')
          .eq('tip', 'program')
          .eq('is_active', true)
          .order('ordine', { ascending: true })

        if (error) throw error
        
        // Parse working hours for each day
        this.workingHours = {}
        const dayMapping = {
          'luni': 1,
          'marți': 2, 'marti': 2,
          'miercuri': 3,
          'joi': 4,
          'vineri': 5,
          'sâmbătă': 6, 'sambata': 6,
          'duminică': 0, 'duminica': 0
        }

        if (workingHoursData && workingHoursData.length > 0) {
          workingHoursData.forEach(item => {
            const value = item.valoare.toLowerCase().trim()
            const eticheta = item.eticheta.toLowerCase().trim()
            
            // Parse format like "Marți: 08:00 - 20:00" or check if closed
            if (value.includes('închis') || value.includes('inchis')) {
              // Handle closed days like "Duminică: Închis"
              const dayNumber = dayMapping[eticheta]
              if (dayNumber !== undefined) {
                this.workingHours[dayNumber] = {
                  start: null,
                  end: null,
                  isOpen: false
                }
              }
            } else {
              // Parse working hours like "Marți: 08:00 - 20:00"
              const timeMatch = value.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
              if (timeMatch) {
                const [, startTime, endTime] = timeMatch
                const dayNumber = dayMapping[eticheta]
                
                if (dayNumber !== undefined) {
                  this.workingHours[dayNumber] = {
                    start: startTime,
                    end: endTime,
                    isOpen: true
                  }
                }
              }
            }
          })
        }

        // Set default working hours if none found
        if (Object.keys(this.workingHours).length === 0) {
          // Default: Monday to Friday 8:00-18:00
          for (let day = 1; day <= 5; day++) {
            this.workingHours[day] = {
              start: '08:00',
              end: '18:00',
              isOpen: true
            }
          }
          // Weekend closed
          this.workingHours[0] = { start: null, end: null, isOpen: false } // Sunday
          this.workingHours[6] = { start: null, end: null, isOpen: false } // Saturday
        }

        console.log('Parsed working hours:', this.workingHours)
        this.generateAvailableDates()
        
      } catch (error) {
        console.error('Error loading working hours:', error)
        this.generateAvailableDates() // Fallback to default
      }
    },

    generateAvailableDates() {
      const dates = []
      const today = new Date()
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        
        const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
        const workingDay = this.workingHours[dayOfWeek]
        const isAvailable = workingDay ? workingDay.isOpen : false
        
        dates.push({
          value: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleDateString('ro-RO', { month: 'short' }),
          dayName: date.toLocaleDateString('ro-RO', { weekday: 'short' }),
          available: isAvailable,
          workingHours: workingDay
        })
      }
      
      this.availableDates = dates
    },

    async loadAvailableTimeSlots() {
      this.loadingTimeSlots = true
      this.availableTimeSlots = []
      this.selectedTime = null

      try {
        // Get working hours for selected date
        const selectedDateObj = new Date(this.selectedDate)
        const dayOfWeek = selectedDateObj.getDay()
        const workingDay = this.workingHours[dayOfWeek]

        if (!workingDay || !workingDay.isOpen) {
          this.availableTimeSlots = []
          this.loadingTimeSlots = false
          return
        }

        // Load existing appointments for selected date and doctor
        const { data: existingAppointments, error } = await supabase
          .from('appointments')
          .select('appointment_time, duration_minutes')
          .eq('doctor_id', this.selectedDoctor.id)
          .eq('appointment_date', this.selectedDate)
          .in('status', ['scheduled', 'confirmed'])

        if (error) throw error

        // Generate time slots based on working hours
        const startTime = workingDay.start.split(':')
        const endTime = workingDay.end.split(':')
        const startHour = parseInt(startTime[0])
        const startMinute = parseInt(startTime[1])
        const endHour = parseInt(endTime[0])
        const endMinute = parseInt(endTime[1])

        const allSlots = []
        let currentHour = startHour
        let currentMinute = startMinute

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
          allSlots.push(timeString)
          
          // Increment by 30 minutes
          currentMinute += 30
          if (currentMinute >= 60) {
            currentMinute = 0
            currentHour += 1
          }
        }

        // Filter out occupied slots
        const occupiedSlots = new Set()
        existingAppointments?.forEach(appointment => {
          const startTime = appointment.appointment_time
          const duration = appointment.duration_minutes || 30
          
          // Mark all slots within the appointment duration as occupied
          const startHour = parseInt(startTime.split(':')[0])
          const startMinute = parseInt(startTime.split(':')[1])
          const totalMinutes = startHour * 60 + startMinute
          
          for (let i = 0; i < duration; i += 30) {
            const slotMinutes = totalMinutes + i
            const slotHour = Math.floor(slotMinutes / 60)
            const slotMin = slotMinutes % 60
            const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`
            occupiedSlots.add(slotTime)
          }
        })

        this.availableTimeSlots = allSlots.filter(slot => !occupiedSlots.has(slot))

      } catch (error) {
        console.error('Error loading time slots:', error)
        // Fallback to default slots (9:00-17:00)
        this.availableTimeSlots = []
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            this.availableTimeSlots.push(timeString)
          }
        }
      } finally {
        this.loadingTimeSlots = false
      }
    },

    async confirmAppointment() {
      this.submittingAppointment = true

      try {
        // Get current user (patient)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) throw new Error('Nu sunteți autentificat')

        // Create appointment
        const appointmentData = {
          doctor_id: this.selectedDoctor.id,
          patient_id: user.id,
          service_id: this.selectedService.id,
          appointment_date: this.selectedDate,
          appointment_time: this.selectedTime,
          duration_minutes: this.selectedService.durata,
          status: 'scheduled',
          patient_notes: this.patientNotes.trim() || null,
          total_price: this.selectedService.pret
        }

        const { data: appointment, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single()

        if (error) throw error

        this.$emit('appointment-created', appointment)
        this.showSuccessMessage()
        this.closeModal()

      } catch (error) {
        console.error('Error creating appointment:', error)
        alert(`Eroare la programare: ${error.message}`)
      } finally {
        this.submittingAppointment = false
      }
    },

    showSuccessMessage() {
      alert(`Programarea a fost confirmată!\n\nDoctor: ${this.selectedDoctor.nume_complet}\nData: ${this.formatSelectedDate()}\nOra: ${this.selectedTime}\n\nVeți primi un email de confirmare în curând.`)
    },

    selectDoctor(doctor) {
      this.selectedDoctor = doctor
    },

    selectService(service) {
      this.selectedService = service
    },

    selectDate(date) {
      this.selectedDate = date
      this.selectedTime = null
    },

    selectTime(time) {
      this.selectedTime = time
    },

    nextStep() {
      if (this.canProceedToNextStep) {
        this.currentStep++
        if (this.currentStep === 2) {
          this.loadServices()
        }
      }
    },

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    formatPrice(price) {
      return `${price} RON`
    },

    formatSelectedDate() {
      if (!this.selectedDate) return ''
      const date = new Date(this.selectedDate)
      return date.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    resetModal() {
      this.currentStep = 1
      this.selectedDoctor = null
      this.selectedService = null
      this.selectedDate = null
      this.selectedTime = null
      this.patientNotes = ''
      this.submittingAppointment = false
    },

    handleOverlayClick() {
      this.closeModal()
    },

    closeModal() {
      this.resetModal()
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
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  max-width: 800px;
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

.step-content {
  min-height: 400px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.step-header h3 {
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.step-indicator {
  background: #f3f4f6;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Loading and Error States */
.loading-state,
.error-state {
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
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-state h4 {
  color: #1f2937;
  margin: 0 0 10px 0;
  font-size: 18px;
}

.error-state p {
  color: #6b7280;
  margin: 0 0 20px 0;
}

/* Doctors Grid */
.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.doctor-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.doctor-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.doctor-card.selected {
  border-color: #4f46e5;
  background: #eff6ff;
}

.doctor-avatar {
  font-size: 48px;
  margin-bottom: 15px;
}

.doctor-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.doctor-email {
  margin: 4px 0;
  color: #6b7280;
  font-size: 14px;
}

.doctor-status {
  margin: 4px 0;
  color: #059669;
  font-size: 14px;
  font-weight: 500;
}

.selected-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #4f46e5;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

/* Services Grid */
.services-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  position: relative;
}

.service-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.service-card.selected {
  border-color: #4f46e5;
  background: #eff6ff;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 15px;
}

.service-card h4 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.service-price {
  background: #4f46e5;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}

.service-description {
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.service-duration {
  color: #4f46e5;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}

/* Date & Time Selection */
.datetime-selection {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.date-section h4,
.time-section h4 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.date-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.date-card:hover:not(.disabled) {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-card.selected {
  border-color: #4f46e5;
  background: #eff6ff;
}

.date-card.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-day {
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 5px;
}

.date-number {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 2px;
}

.date-month {
  color: #6b7280;
  font-size: 12px;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.time-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1f2937;
  font-weight: 600;
  background: white;
}

.time-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.time-card.selected {
  border-color: #4f46e5;
  background: #eff6ff;
  color: #4f46e5;
}

/* Confirmation */
.confirmation-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.confirmation-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 25px;
}

.confirmation-card h4 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
}

.detail-item.total {
  border-top: 2px solid #e5e7eb;
  padding-top: 15px;
  margin-top: 10px;
  font-size: 16px;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  color: #1f2937;
  font-weight: 600;
}

.detail-item.total .detail-value {
  color: #4f46e5;
  font-size: 18px;
}

.notes-section h4 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.notes-section textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  color: #1f2937;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.notes-section textarea::placeholder {
  color: #9ca3af;
}

.notes-section textarea:focus {
  outline: none;
  border-color: #4f46e5;
}

.char-count {
  text-align: right;
  color: #6b7280;
  font-size: 12px;
  margin-top: 5px;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
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
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Animations */
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
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .modal-header h2 {
    font-size: 20px;
  }
  
  .doctors-grid {
    grid-template-columns: 1fr;
  }
  
  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .footer-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .btn-primary,
  .btn-secondary {
    min-width: 140px;
  }
  
  .date-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
  
  .time-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .confirmation-card {
    padding: 20px;
  }
  
  .datetime-selection {
    gap: 25px;
  }
}

@media (max-width: 480px) {
  .step-content {
    min-height: 300px;
  }
  
  .modal-header h2 {
    font-size: 18px;
  }
  
  .step-header h3 {
    font-size: 18px;
  }
  
  .date-grid,
  .time-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
  
  .footer-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>