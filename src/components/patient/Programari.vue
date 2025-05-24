<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>🗓️ Programări Medicale</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
  
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă doctorii...</p>
          </div>
  
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea doctorilor</h3>
            <p>{{ error }}</p>
            <button @click="loadDoctors" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <div v-else class="doctors-content">
            <div class="doctors-section">
              <h3 class="section-title">👩‍⚕️ Doctorii Disponibili</h3>
              
              <div v-if="doctors.length === 0" class="empty-state">
                <div class="empty-icon">👨‍⚕️</div>
                <p>Nu sunt doctori disponibili în acest moment.</p>
              </div>
  
              <div v-else class="doctors-list">
                <div 
                  v-for="doctor in doctors"
                  :key="doctor.id"
                  class="doctor-card"
                >
                  <div class="doctor-info">
                    <h4>{{ doctor.nume_complet }}</h4>
                    <p class="specialization">{{ doctor.specializare }}</p>
                    <p v-if="doctor.email" class="contact">✉️ {{ doctor.email }}</p>
                  </div>
                  
                  <div class="doctor-actions">
                    <button 
                      @click="selectDoctor(doctor)"
                      class="btn-primary"
                    >
                      Selectează
                    </button>
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
  
  export default {
    name: 'Programari',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'doctor-selected'],
    data() {
      return {
        loading: false,
        error: null,
        doctors: []
      }
    },
    
    watch: {
      show(newVal) {
        if (newVal) {
          this.loadDoctors()
        }
      }
    },
    
    methods: {
      async loadDoctors() {
        this.loading = true
        this.error = null
        
        try {
          const { data: doctors, error } = await supabase
            .from('doctor_profiles')
            .select(`
              id,
              nume_complet,
              specializare,
              email
            `)
            .eq('is_active', true)
            .order('nume_complet')

          if (error) throw error

          this.doctors = doctors || []
          
        } catch (error) {
          console.error('Error loading doctors:', error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },

      selectDoctor(doctor) {
        // Funcționalitate placeholder pentru selectarea doctorului
        this.$emit('doctor-selected', doctor)
        console.log('Doctor selectat:', doctor)
      },
  
      handleOverlayClick() {
        this.closeModal()
      },
  
      closeModal() {
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
    max-width: 700px;
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
    padding: 0;
  }
  
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
  
  .doctors-content {
    padding: 0;
  }
  
  .doctors-section {
    padding: 30px;
  }
  
  .section-title {
    margin: 0 0 25px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
    padding-bottom: 10px;
    border-bottom: 2px solid #f3f4f6;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .doctors-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .doctor-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .doctor-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .doctor-info {
    flex: 1;
  }
  
  .doctor-info h4 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }
  
  .specialization {
    margin: 0 0 8px 0;
    color: #4f46e5;
    font-size: 16px;
    font-weight: 500;
  }
  
  .contact {
    margin: 4px 0;
    color: #6b7280;
    font-size: 14px;
  }
  
  .doctor-actions {
    display: flex;
    align-items: center;
    margin-left: 20px;
  }
  
  .modal-footer {
    padding: 20px 30px;
    border-top: 2px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    gap: 12px;
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
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .modal-container {
      margin: 10px;
      max-width: none;
    }
    
    .doctors-section,
    .modal-footer {
      padding: 20px;
    }
    
    .doctor-card {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }
    
    .doctor-actions {
      margin-left: 0;
      justify-content: center;
    }
  }
  </style>