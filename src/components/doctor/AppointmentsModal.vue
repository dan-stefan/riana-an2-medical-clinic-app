<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>📅 Programul Meu - Calendar</h2>
          <div class="header-actions">
            <button @click="goToToday" class="btn-secondary btn-small">Astăzi</button>
            <button @click="closeModal" class="close-btn">✕</button>
          </div>
        </div>
  
        <div class="modal-body">
          <!-- View Controls -->
          <div class="view-controls">
            <div class="view-tabs">
              <button 
                v-for="view in views"
                :key="view.id"
                @click="currentView = view.id"
                :class="['view-tab', { 'active': currentView === view.id }]"
              >
                {{ view.icon }} {{ view.label }}
              </button>
            </div>
            
            <div class="navigation-controls">
              <button @click="previousPeriod" class="nav-btn">
                ← Anterior
              </button>
              
              <div class="current-period">
                <h3>{{ currentPeriodLabel }}</h3>
              </div>
              
              <button @click="nextPeriod" class="nav-btn">
                Următor →
              </button>
            </div>
  
            <div class="legend">
              <div class="legend-item">
                <div class="legend-color occupied"></div>
                <span>Ocupat</span>
              </div>
              <div class="legend-item">
                <div class="legend-color available"></div>
                <span>Disponibil</span>
              </div>
              <div class="legend-item">
                <div class="legend-color break"></div>
                <span>Pauză</span>
              </div>
            </div>
          </div>
  
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă programul...</p>
          </div>
  
          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea programului</h3>
            <p>{{ error }}</p>
            <button @click="loadSchedule" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <!-- Calendar Views -->
          <div v-else class="calendar-content">
            <!-- Week View -->
            <div v-if="currentView === 'week'" class="week-view">
              <div class="week-header">
                <div class="time-column-header">Ora</div>
                <div 
                  v-for="day in weekDays"
                  :key="day.date"
                  class="day-header"
                  :class="{ 'today': isToday(day.date) }"
                >
                  <div class="day-name">{{ day.dayName }}</div>
                  <div class="day-date">{{ day.dayDate }}</div>
                  <div class="day-appointments">{{ getDayAppointmentCount(day.date) }} programări</div>
                </div>
              </div>
  
              <div class="week-grid">
                <div class="time-column">
                  <div 
                    v-for="hour in workingHours"
                    :key="hour"
                    class="time-slot"
                  >
                    {{ formatHour(hour) }}
                  </div>
                </div>
  
                <div 
                  v-for="day in weekDays"
                  :key="day.date"
                  class="day-column"
                  :class="{ 'today': isToday(day.date) }"
                >
                  <div 
                    v-for="hour in workingHours"
                    :key="`${day.date}-${hour}`"
                    class="hour-slot"
                    :class="getSlotClass(day.date, hour)"
                    @click="handleSlotClick(day.date, hour)"
                  >
                    <div 
                      v-for="appointment in getSlotAppointments(day.date, hour)"
                      :key="appointment.id"
                      class="appointment-block"
                      :class="['status-' + appointment.status]"
                      :style="getAppointmentBlockStyle(appointment, hour)"
                      @click.stop="viewAppointment(appointment)"
                    >
                      <div class="appointment-time">{{ appointment.appointment_time }}</div>
                      <div class="appointment-patient">{{ appointment.user_profiles?.nume_complet }}</div>
                      <div class="appointment-service">{{ appointment.servicii?.nume }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Day View -->
            <div v-if="currentView === 'day'" class="day-view">
              <div class="day-header-detailed">
                <h3>{{ formatDetailedDate(currentDate) }}</h3>
                <div class="day-stats">
                  <span class="stat">{{ getDayAppointmentCount(currentDate) }} programări</span>
                  <span class="stat">{{ getAvailableSlots(currentDate) }} ore libere</span>
                  <span class="stat">{{ formatPrice(getDayRevenue(currentDate)) }} venituri</span>
                </div>
              </div>
  
              <div class="day-timeline">
                <div 
                  v-for="hour in workingHours"
                  :key="hour"
                  class="timeline-hour"
                >
                  <div class="hour-label">{{ formatHour(hour) }}</div>
                  <div class="hour-content">
                    <div 
                      class="hour-block"
                      :class="getSlotClass(currentDate, hour)"
                      @click="handleSlotClick(currentDate, hour)"
                    >
                      <div 
                        v-for="appointment in getSlotAppointments(currentDate, hour)"
                        :key="appointment.id"
                        class="appointment-detail"
                        :class="['status-' + appointment.status]"
                        @click.stop="viewAppointment(appointment)"
                      >
                        <div class="appointment-header-detail">
                          <div class="appointment-time-detail">
                            {{ appointment.appointment_time }} - 
                            {{ getEndTime(appointment.appointment_time, appointment.duration_minutes) }}
                          </div>
                          <span :class="['status-badge', appointment.status]">
                            {{ getStatusLabel(appointment.status) }}
                          </span>
                        </div>
                        
                        <div class="appointment-info">
                          <div class="patient-info">
                            <strong>👤 {{ appointment.user_profiles?.nume_complet }}</strong>
                            <span>📧 {{ appointment.user_profiles?.email }}</span>
                          </div>
                          <div class="service-info">
                            <strong>💼 {{ appointment.servicii?.nume }}</strong>
                            <span>💰 {{ formatPrice(appointment.total_price) }}</span>
                          </div>
                        </div>
  
                        <div v-if="appointment.patient_notes || appointment.doctor_notes" class="appointment-notes-preview">
                          <div v-if="appointment.patient_notes" class="note-preview">
                            <strong>📝 Pacient:</strong> {{ truncateText(appointment.patient_notes, 50) }}
                          </div>
                          <div v-if="appointment.doctor_notes" class="note-preview">
                            <strong>🩺 Doctor:</strong> {{ truncateText(appointment.doctor_notes, 50) }}
                          </div>
                        </div>
  
                        <div class="appointment-actions-inline">
                          <button 
                            v-if="appointment.status === 'scheduled'"
                            @click.stop="updateStatus(appointment.id, 'confirmed')"
                            class="btn-tiny btn-success"
                            title="Confirmă"
                          >
                            ✅
                          </button>
                          
                          <button 
                            v-if="['scheduled', 'confirmed'].includes(appointment.status)"
                            @click.stop="updateStatus(appointment.id, 'completed')"
                            class="btn-tiny btn-primary"
                            title="Completează"
                          >
                            ✅
                          </button>
                          
                          <button 
                            @click.stop="editNotes(appointment)"
                            class="btn-tiny btn-secondary"
                            title="Editează notițe"
                          >
                            📝
                          </button>
                        </div>
                      </div>
  
                      <div v-if="!getSlotAppointments(currentDate, hour).length" class="empty-slot">
                        <span class="empty-text">Oră liberă</span>
                        <button @click="createAppointment(currentDate, hour)" class="btn-create-quick">
                          + Adaugă programare
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Month View -->
            <div v-if="currentView === 'month'" class="month-view">
              <div class="month-header">
                <div 
                  v-for="dayName in monthDayNames"
                  :key="dayName"
                  class="month-day-header"
                >
                  {{ dayName }}
                </div>
              </div>
  
              <div class="month-grid">
                <div 
                  v-for="date in monthDates"
                  :key="date.dateString"
                  class="month-date"
                  :class="{ 
                    'today': isToday(date.dateString),
                    'other-month': !date.currentMonth,
                    'has-appointments': getDayAppointmentCount(date.dateString) > 0
                  }"
                  @click="selectDate(date.dateString)"
                >
                  <div class="date-number">{{ date.day }}</div>
                  <div v-if="getDayAppointmentCount(date.dateString) > 0" class="date-appointments">
                    <div class="appointment-count">
                      {{ getDayAppointmentCount(date.dateString) }} programări
                    </div>
                    <div class="appointment-dots">
                      <div 
                        v-for="appointment in getDateAppointments(date.dateString).slice(0, 3)"
                        :key="appointment.id"
                        class="appointment-dot"
                        :class="['status-' + appointment.status]"
                        :title="`${appointment.appointment_time} - ${appointment.user_profiles?.nume_complet}`"
                      ></div>
                      <div 
                        v-if="getDateAppointments(date.dateString).length > 3"
                        class="appointment-dot more"
                        :title="`+${getDateAppointments(date.dateString).length - 3} programări`"
                      >
                        +{{ getDateAppointments(date.dateString).length - 3 }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="modal-footer">
          <div class="footer-stats">
            <span>Total programări: {{ totalAppointments }}</span>
            <span>Venituri estimat: {{ formatPrice(totalRevenue) }}</span>
          </div>
          <div class="footer-actions">
            <button @click="exportSchedule" class="btn-secondary">📊 Exportă</button>
            <button @click="closeModal" class="btn-primary">Închide</button>
          </div>
        </div>
      </div>
  
      <!-- Quick Create Appointment Modal -->
      <div v-if="showQuickCreate" class="quick-create-modal">
        <div class="modal-overlay-small" @click="showQuickCreate = false">
          <div class="modal-small" @click.stop>
            <div class="modal-header-small">
              <h3>➕ Programare Rapidă</h3>
              <button @click="showQuickCreate = false" class="close-btn">✕</button>
            </div>
            
            <div class="modal-body-small">
              <div class="quick-form">
                <div class="form-group">
                  <label>Data și ora:</label>
                  <div class="datetime-display">
                    {{ formatDateTime(quickCreateData.date, quickCreateData.hour) }}
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Pacient:</label>
                  <select v-model="quickCreateData.patientId">
                    <option value="">Selectează pacient...</option>
                    <option 
                      v-for="patient in patients"
                      :key="patient.id"
                      :value="patient.id"
                    >
                      {{ patient.nume_complet }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>Serviciu:</label>
                  <select v-model="quickCreateData.serviceId">
                    <option value="">Selectează serviciu...</option>
                    <option 
                      v-for="service in services"
                      :key="service.id"
                      :value="service.id"
                    >
                      {{ service.nume }} - {{ formatPrice(service.pret) }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="modal-footer-small">
              <button @click="showQuickCreate = false" class="btn-secondary">
                Anulează
              </button>
              <button 
                @click="saveQuickAppointment"
                :disabled="!canCreateQuickAppointment || creatingQuick"
                class="btn-primary"
              >
                <span v-if="creatingQuick">Se creează...</span>
                <span v-else>📅 Creează</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { supabase } from '@/lib/supabase.js'
  import { useAuthStore } from '@/stores/auth.js'
  
  export default {
    name: 'DoctorScheduleModal',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'appointment-selected'],
    data() {
      return {
        currentView: 'week', // week, day, month
        currentDate: new Date().toISOString().split('T')[0],
        appointments: [],
        patients: [],
        services: [],
        loading: false,
        error: null,
        
        // Working hours configuration
        workingHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        
        // Views configuration
        views: [
          { id: 'day', label: 'Zi', icon: '📅' },
          { id: 'week', label: 'Săptămână', icon: '📆' },
          { id: 'month', label: 'Lună', icon: '🗓️' }
        ],
        
        // Quick create
        showQuickCreate: false,
        creatingQuick: false,
        quickCreateData: {
          date: '',
          hour: 0,
          patientId: '',
          serviceId: ''
        }
      }
    },
  
    computed: {
      authStore() {
        return useAuthStore()
      },
  
      currentPeriodLabel() {
        const date = new Date(this.currentDate)
        
        switch (this.currentView) {
          case 'day':
            return date.toLocaleDateString('ro-RO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          case 'week':
            const weekStart = this.getWeekStart(date)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            return `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`
          case 'month':
            return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
          default:
            return ''
        }
      },
  
      weekDays() {
        const date = new Date(this.currentDate)
        const weekStart = this.getWeekStart(date)
        const days = []
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart)
          day.setDate(weekStart.getDate() + i)
          days.push({
            date: day.toISOString().split('T')[0],
            dayName: day.toLocaleDateString('ro-RO', { weekday: 'short' }),
            dayDate: day.getDate()
          })
        }
        
        return days
      },
  
      monthDayNames() {
        return ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']
      },
  
      monthDates() {
        const date = new Date(this.currentDate)
        const year = date.getFullYear()
        const month = date.getMonth()
        
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        // Start from Monday of the week containing the first day
        const startDate = new Date(firstDay)
        const dayOfWeek = firstDay.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
        startDate.setDate(firstDay.getDate() - diff)
        
        const dates = []
        const currentDate = new Date(startDate)
        
        // Generate 6 weeks (42 days) to fill the calendar
        for (let i = 0; i < 42; i++) {
          dates.push({
            dateString: currentDate.toISOString().split('T')[0],
            day: currentDate.getDate(),
            currentMonth: currentDate.getMonth() === month
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        return dates
      },
  
      totalAppointments() {
        return this.appointments.length
      },
  
      totalRevenue() {
        return this.appointments
          .filter(app => app.status === 'completed')
          .reduce((total, app) => total + (app.total_price || 0), 0)
      },
  
      canCreateQuickAppointment() {
        console.log('🔍 canCreateQuickAppointment check:', {
          patientId: this.quickCreateData.patientId,
          serviceId: this.quickCreateData.serviceId,
          result: this.quickCreateData.patientId && this.quickCreateData.serviceId
        })
        return this.quickCreateData.patientId && this.quickCreateData.serviceId
      }
    },
  
    watch: {
      show(newVal) {
        if (newVal) {
          this.loadSchedule()
          this.loadPatients()
          this.loadServices()
        }
      },
  
      currentView() {
        this.loadSchedule()
      },
  
      currentDate() {
        this.loadSchedule()
      }
    },
  
    methods: {
      async loadSchedule() {
        this.loading = true
        this.error = null

        try {
          console.log('🔍 Starting loadSchedule...')
          console.log('📅 Current view:', this.currentView)
          console.log('📅 Current date:', this.currentDate)
          
          let startDate, endDate

          switch (this.currentView) {
            case 'day':
              startDate = this.currentDate
              endDate = this.currentDate
              break
            case 'week':
              const weekStart = this.getWeekStart(new Date(this.currentDate))
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekStart.getDate() + 6)
              startDate = weekStart.toISOString().split('T')[0]
              endDate = weekEnd.toISOString().split('T')[0]
              break
            case 'month':
              const monthStart = new Date(this.currentDate)
              monthStart.setDate(1)
              const monthEnd = new Date(monthStart)
              monthEnd.setMonth(monthStart.getMonth() + 1)
              monthEnd.setDate(0)
              startDate = monthStart.toISOString().split('T')[0]
              endDate = monthEnd.toISOString().split('T')[0]
              break
          }
          
          console.log('📅 Date range:', { startDate, endDate })
          console.log('👨‍⚕️ Doctor ID:', this.authStore.user.id)

          const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
              *,
              user_profiles!appointments_patient_id_fkey (
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
            .eq('doctor_id', this.authStore.user.id)
            .gte('appointment_date', startDate)
            .lte('appointment_date', endDate)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })

          console.log('📊 LoadSchedule response - data:', appointments)
          console.log('📊 LoadSchedule response - error:', error)

          if (error) {
            console.error('❌ LoadSchedule error:', error)
            throw error
          }

          this.appointments = appointments || []
          console.log('✅ Appointments loaded:', this.appointments.length)

        } catch (error) {
          console.error('💥 Error in loadSchedule:', error)
          this.error = error.message
        } finally {
          this.loading = false
          console.log('🏁 loadSchedule finished')
        }
      },
  
      async loadPatients() {
        try {
          const { data: patients, error } = await supabase
            .from('user_profiles')
            .select('id, nume_complet, email, telefon, created_at')
            .eq('rol', 'patient')
            .order('nume_complet', { ascending: true })
  
          if (error) throw error
  
          this.patients = patients || []
  
        } catch (error) {
          console.error('Error loading patients:', error)
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
  
      // Navigation methods
      previousPeriod() {
        const date = new Date(this.currentDate)
        
        switch (this.currentView) {
          case 'day':
            date.setDate(date.getDate() - 1)
            break
          case 'week':
            date.setDate(date.getDate() - 7)
            break
          case 'month':
            date.setMonth(date.getMonth() - 1)
            break
        }
        
        this.currentDate = date.toISOString().split('T')[0]
      },
  
      nextPeriod() {
        const date = new Date(this.currentDate)
        
        switch (this.currentView) {
          case 'day':
            date.setDate(date.getDate() + 1)
            break
          case 'week':
            date.setDate(date.getDate() + 7)
            break
          case 'month':
            date.setMonth(date.getMonth() + 1)
            break
        }
        
        this.currentDate = date.toISOString().split('T')[0]
      },
  
      goToToday() {
        this.currentDate = new Date().toISOString().split('T')[0]
      },
  
      selectDate(dateString) {
        this.currentDate = dateString
        this.currentView = 'day'
      },
  
      // Appointment methods
      getDayAppointmentCount(date) {
        return this.appointments.filter(app => app.appointment_date === date).length
      },
  
      getDateAppointments(date) {
        return this.appointments.filter(app => app.appointment_date === date)
      },
  
      getSlotAppointments(date, hour) {
        return this.appointments.filter(app => {
          if (app.appointment_date !== date) return false
          const appointmentHour = parseInt(app.appointment_time.split(':')[0])
          const appointmentMinute = parseInt(app.appointment_time.split(':')[1])
          const startTimeMinutes = appointmentHour * 60 + appointmentMinute
          const endTimeMinutes = startTimeMinutes + (app.duration_minutes || 30)
          
          // Check if this hour slot overlaps with the appointment
          const slotStartMinutes = hour * 60
          const slotEndMinutes = (hour + 1) * 60
          
          return (startTimeMinutes < slotEndMinutes && endTimeMinutes > slotStartMinutes)
        })
      },
  
      getSlotClass(date, hour) {
        const appointments = this.getSlotAppointments(date, hour)
        if (appointments.length > 0) {
          return 'occupied'
        }
        
        // Check if it's a break time (example: 12-13 is lunch break)
        if (hour === 12) {
          return 'break'
        }
        
        return 'available'
      },
  
      getAvailableSlots(date) {
        // Create a timeline of occupied minutes for the day
        const occupiedMinutes = new Set()
        
        this.appointments
          .filter(app => app.appointment_date === date)
          .forEach(app => {
            const startHour = parseInt(app.appointment_time.split(':')[0])
            const startMinute = parseInt(app.appointment_time.split(':')[1])
            const startTimeMinutes = startHour * 60 + startMinute
            const duration = app.duration_minutes || 30
            
            // Mark all minutes of this appointment as occupied
            for (let i = 0; i < duration; i++) {
              occupiedMinutes.add(startTimeMinutes + i)
            }
          })
        
        // Count available 30-minute slots
        let availableSlots = 0
        for (let hour = 8; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotStartMinutes = hour * 60 + minute
            const slotEndMinutes = slotStartMinutes + 30
            
            // Check if this 30-minute slot is available
            let slotAvailable = true
            for (let i = slotStartMinutes; i < slotEndMinutes; i++) {
              if (occupiedMinutes.has(i) || i >= 12 * 60 && i < 13 * 60) { // Skip lunch break
                slotAvailable = false
                break
              }
            }
            
            if (slotAvailable) {
              availableSlots++
            }
          }
        }
        
        return availableSlots
      },
  
      getDayRevenue(date) {
        return this.appointments
          .filter(app => app.appointment_date === date && app.status === 'completed')
          .reduce((total, app) => total + (app.total_price || 0), 0)
      },
  
      // Time formatting
      formatHour(hour) {
        return `${hour.toString().padStart(2, '0')}:00`
      },
  
      getEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(totalMinutes / 60)
        const endMinutes = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      },
  
      formatDetailedDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('ro-RO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
  
      formatDateTime(date, hour) {
        const dateObj = new Date(date)
        return `${dateObj.toLocaleDateString('ro-RO')} la ${this.formatHour(hour)}`
      },
  
      // Utility methods
      isToday(dateString) {
        return dateString === new Date().toISOString().split('T')[0]
      },
  
      getWeekStart(date) {
        const weekStart = new Date(date)
        const dayOfWeek = date.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
        weekStart.setDate(date.getDate() - diff)
        return weekStart
      },
  
      truncateText(text, length) {
        if (!text) return ''
        return text.length > length ? text.substring(0, length) + '...' : text
      },
  
      // Appointment actions
      handleSlotClick(date, hour) {
        const appointments = this.getSlotAppointments(date, hour)
        if (appointments.length === 0) {
          this.createAppointment(date, hour)
        }
      },
  
      createAppointment(date, hour) {
        this.quickCreateData = {
          date: date,
          hour: hour,
          patientId: '',
          serviceId: ''
        }
        this.showQuickCreate = true
      },
  
      async saveQuickAppointment() {
        this.creatingQuick = true

        try {
          console.log('🔍 Starting saveQuickAppointment...')
          console.log('📋 Quick create data:', this.quickCreateData)
          
          const selectedService = this.services.find(s => s.id === this.quickCreateData.serviceId)
          console.log('💼 Selected service:', selectedService)
          
          const appointmentData = {
            doctor_id: this.authStore.user.id,
            patient_id: this.quickCreateData.patientId,
            service_id: this.quickCreateData.serviceId,
            appointment_date: this.quickCreateData.date,
            appointment_time: this.formatHour(this.quickCreateData.hour),
            duration_minutes: selectedService?.durata || 30,
            status: 'confirmed',
            total_price: selectedService?.pret || 0
          }
          
          console.log('📅 Appointment data to insert:', appointmentData)

          const { data: appointment, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()

          console.log('📊 Supabase response - data:', appointment)
          console.log('📊 Supabase response - error:', error)

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }

          console.log('✅ Appointment created successfully:', appointment)
          this.showQuickCreate = false
          this.loadSchedule()
          this.showNotification('Programarea a fost creată cu succes!', 'success')

        } catch (error) {
          console.error('💥 Error in saveQuickAppointment:', error)
          this.showNotification(`Eroare: ${error.message}`, 'error')
        } finally {
          this.creatingQuick = false
          console.log('🏁 saveQuickAppointment finished')
        }
      },
  
      viewAppointment(appointment) {
        this.$emit('appointment-selected', appointment)
      },
  
      async updateStatus(appointmentId, newStatus) {
        try {
          const { error } = await supabase
            .from('appointments')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
  
          if (error) throw error
  
          // Update local state
          const appointment = this.appointments.find(app => app.id === appointmentId)
          if (appointment) {
            appointment.status = newStatus
          }
  
          this.showNotification(`Status actualizat: ${this.getStatusLabel(newStatus)}`, 'success')
  
        } catch (error) {
          console.error('Error updating status:', error)
          this.showNotification(`Eroare: ${error.message}`, 'error')
        }
      },
  
      editNotes(appointment) {
        // Emit event to open notes editor
        this.$emit('edit-notes', appointment)
      },
  
      exportSchedule() {
        // Generate CSV export
        const csvContent = this.generateScheduleCSV()
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', `program_${this.currentDate}.csv`)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      },
  
      generateScheduleCSV() {
        const headers = ['Data', 'Ora', 'Pacient', 'Email', 'Serviciu', 'Durata', 'Pret', 'Status']
        const rows = this.appointments.map(app => [
          app.appointment_date,
          app.appointment_time,
          app.user_profiles?.nume_complet || '',
          app.user_profiles?.email || '',
          app.servicii?.nume || '',
          app.duration_minutes || 0,
          app.total_price || 0,
          this.getStatusLabel(app.status)
        ])
  
        return [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n')
      },
  
      formatPrice(price) {
        if (!price) return '0 RON'
        return `${price} RON`
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
  
      showNotification(message, type = 'info') {
        alert(message)
      },
  
      handleOverlayClick() {
        this.closeModal()
      },
  
      closeModal() {
        this.showQuickCreate = false
        this.$emit('close')
      },
  
      getAppointmentBlockStyle(appointment, hour) {
        const startTimeMinutes = parseInt(appointment.appointment_time.split(':')[0]) * 60 + parseInt(appointment.appointment_time.split(':')[1])
        const duration = appointment.duration_minutes || 30
        
        // Calculate position within the hour slot
        const slotStartMinutes = hour * 60
        const slotEndMinutes = (hour + 1) * 60
        
        // Calculate how much of the appointment falls within this hour slot
        const overlapStart = Math.max(startTimeMinutes, slotStartMinutes)
        const overlapEnd = Math.min(startTimeMinutes + duration, slotEndMinutes)
        const overlapDuration = overlapEnd - overlapStart
        
        // Calculate position and height as percentage of the hour slot
        const slotHeight = 60 // 60px per hour slot
        const topOffset = ((overlapStart - slotStartMinutes) / 60) * slotHeight
        const height = (overlapDuration / 60) * slotHeight
        
        return {
          position: 'absolute',
          top: `${topOffset}px`,
          left: '2px',
          right: '2px',
          height: `${height}px`,
          zIndex: 10
        }
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
    max-width: 1200px;
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
    gap: 12px;
    align-items: center;
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
  
  /* View Controls */
  .view-controls {
    margin-bottom: 30px;
  }
  
  .view-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
  }
  
  .view-tab {
    padding: 12px 24px;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .view-tab:hover {
    background: #e5e7eb;
    color: #374151;
  }
  
  .view-tab.active {
    background: #2196F3;
    color: white;
  }
  
  .navigation-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .nav-btn {
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #374151;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .nav-btn:hover {
    border-color: #2196F3;
    color: #2196F3;
  }
  
  .current-period h3 {
    margin: 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    min-width: 250px;
  }
  
  .legend {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #6b7280;
  }
  
  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
  
  .legend-color.occupied {
    background: #ef4444;
  }
  
  .legend-color.available {
    background: #10b981;
  }
  
  .legend-color.break {
    background: #f59e0b;
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
    border-top: 4px solid #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  /* Week View */
  .week-view {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .week-header {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .time-column-header {
    padding: 15px 10px;
    text-align: center;
    font-weight: 600;
    color: #6b7280;
    border-right: 1px solid #e5e7eb;
  }
  
  .day-header {
    padding: 15px 10px;
    text-align: center;
    border-right: 1px solid #e5e7eb;
  }
  
  .day-header.today {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .day-name {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .day-date {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .day-appointments {
    font-size: 12px;
    color: #6b7280;
  }
  
  .week-grid {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
  }
  
  .time-column {
    background: #f9fafb;
    border-right: 1px solid #e5e7eb;
  }
  
  .time-slot {
    padding: 12px 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .day-column {
    border-right: 1px solid #e5e7eb;
  }
  
  .day-column.today {
    background: #f0f9ff;
  }
  
  .hour-slot {
    height: 60px;
    border-bottom: 1px solid #e5e7eb;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .hour-slot.available:hover {
    background: #f0f9ff;
  }
  
  .hour-slot.occupied {
    background: #fef2f2;
  }
  
  .hour-slot.break {
    background: #fffbeb;
  }
  
  .appointment-block {
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: #2196F3;
    color: white;
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .appointment-block:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .appointment-block.status-scheduled {
    background: #f59e0b;
  }
  
  .appointment-block.status-confirmed {
    background: #2196F3;
  }
  
  .appointment-block.status-completed {
    background: #10b981;
  }
  
  .appointment-block.status-cancelled {
    background: #ef4444;
  }
  
  .appointment-time {
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .appointment-patient {
    font-size: 9px;
    opacity: 0.9;
    margin-bottom: 1px;
  }
  
  .appointment-service {
    font-size: 8px;
    opacity: 0.8;
  }
  
  /* Day View */
  .day-view {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .day-header-detailed {
    padding: 20px;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    text-align: center;
  }
  
  .day-header-detailed h3 {
    margin: 0 0 10px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
  }
  
  .day-stats {
    display: flex;
    gap: 20px;
    justify-content: center;
    font-size: 14px;
    color: #6b7280;
  }
  
  .stat {
    font-weight: 500;
  }
  
  .day-timeline {
    padding: 20px;
  }
  
  .timeline-hour {
    display: flex;
    margin-bottom: 2px;
    min-height: 80px;
  }
  
  .hour-label {
    width: 80px;
    padding: 10px;
    text-align: center;
    font-weight: 600;
    color: #6b7280;
    font-size: 14px;
    border-right: 2px solid #e5e7eb;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  
  .hour-content {
    flex: 1;
    padding: 0 10px;
  }
  
  .hour-block {
    min-height: 60px;
    border: 2px dashed transparent;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .hour-block.available {
    border-color: #d1d5db;
  }
  
  .hour-block.available:hover {
    border-color: #2196F3;
    background: #f0f9ff;
  }
  
  .hour-block.occupied {
    border: none;
    background: transparent;
  }
  
  .hour-block.break {
    background: #fffbeb;
    border-color: #f59e0b;
  }
  
  .appointment-detail {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .appointment-detail:hover {
    border-color: #2196F3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .appointment-detail.status-scheduled {
    border-color: #f59e0b;
    background: #fffbeb;
  }
  
  .appointment-detail.status-confirmed {
    border-color: #2196F3;
    background: #f0f9ff;
  }
  
  .appointment-detail.status-completed {
    border-color: #10b981;
    background: #f0fdf4;
  }
  
  .appointment-detail.status-cancelled {
    border-color: #ef4444;
    background: #fef2f2;
  }
  
  .appointment-header-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .appointment-time-detail {
    font-weight: 600;
    color: #1f2937;
  }
  
  .status-badge {
    padding: 4px 8px;
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
  
  .appointment-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 10px;
  }
  
  .patient-info,
  .service-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .patient-info strong,
  .service-info strong {
    color: #1f2937;
    font-size: 14px;
  }
  
  .patient-info span,
  .service-info span {
    color: #6b7280;
    font-size: 12px;
  }
  
  .appointment-notes-preview {
    margin: 10px 0;
    padding: 10px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  
  .note-preview {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .note-preview:last-child {
    margin-bottom: 0;
  }
  
  .appointment-actions-inline {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }
  
  .btn-tiny {
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .empty-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 60px;
    color: #9ca3af;
  }
  
  .empty-text {
    font-size: 14px;
    font-style: italic;
  }
  
  .btn-create-quick {
    padding: 6px 12px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-create-quick:hover {
    background: #1976D2;
  }
  
  /* Month View */
  .month-view {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .month-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .month-day-header {
    padding: 15px 10px;
    text-align: center;
    font-weight: 600;
    color: #6b7280;
    border-right: 1px solid #e5e7eb;
  }
  
  .month-day-header:last-child {
    border-right: none;
  }
  
  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
  }
  
  .month-date {
    min-height: 100px;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    padding: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    position: relative;
  }
  
  .month-date:hover {
    background: #f9fafb;
  }
  
  .month-date.today {
    background: #dbeafe;
  }
  
  .month-date.other-month {
    color: #d1d5db;
    background: #f9fafb;
  }
  
  .month-date.has-appointments {
    background: #f0f9ff;
  }
  
  .date-number {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .date-appointments {
    position: absolute;
    bottom: 4px;
    left: 4px;
    right: 4px;
  }
  
  .appointment-count {
    font-size: 10px;
    color: #6b7280;
    margin-bottom: 2px;
  }
  
  .appointment-dots {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }
  
  .appointment-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6b7280;
  }
  
  .appointment-dot.status-scheduled {
    background: #f59e0b;
  }
  
  .appointment-dot.status-confirmed {
    background: #2196F3;
  }
  
  .appointment-dot.status-completed {
    background: #10b981;
  }
  
  .appointment-dot.status-cancelled {
    background: #ef4444;
  }
  
  .appointment-dot.more {
    width: auto;
    height: auto;
    padding: 1px 3px;
    font-size: 8px;
    color: white;
    background: #6b7280;
    border-radius: 8px;
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
  .btn-small,
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
  
  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
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
  
  .btn-success {
    background: #10b981;
    color: white;
  }
  
  .btn-success:hover {
    background: #059669;
  }
  
  /* Quick Create Modal */
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
    z-index: 1100;
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
  
  .quick-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group select {
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    transition: border-color 0.2s ease;
  }
  
  .form-group select:focus {
    outline: none;
    border-color: #2196F3;
  }
  
  .datetime-display {
    padding: 10px 12px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-weight: 600;
    color: #1f2937;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 1024px) {
    .modal-container {
      margin: 10px;
      max-width: none;
    }
  
    .week-header,
    .week-grid {
      grid-template-columns: 60px repeat(7, 1fr);
    }
  
    .time-column-header,
    .time-slot {
      padding: 8px 4px;
      font-size: 10px;
    }
  
    .day-header {
      padding: 10px 5px;
    }
  
    .appointment-block {
      font-size: 8px;
      padding: 2px 4px;
    }
  
    .appointment-info {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .view-tabs {
      flex-direction: column;
    }
  
    .navigation-controls {
      flex-direction: column;
      gap: 10px;
    }
  
    .current-period h3 {
      min-width: auto;
      font-size: 16px;
    }
  
    .legend {
      flex-wrap: wrap;
      gap: 10px;
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
  </style>