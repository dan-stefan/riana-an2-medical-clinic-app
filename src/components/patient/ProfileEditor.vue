<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>👤 Profilul Meu</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
  
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă profilul...</p>
          </div>
  
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea profilului</h3>
            <p>{{ error }}</p>
            <button @click="loadProfile" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <form v-else @submit.prevent="saveProfile" class="profile-form">
            <!-- Informații de autentificare -->
            <div class="section">
              <h3 class="section-title">🔐 Informații Cont</h3>
              
              <div class="form-group">
                <label for="email">Email:</label>
                <input
                  id="email"
                  v-model="profileData.email"
                  type="email"
                  required
                  class="form-input"
                  :disabled="true"
                />
                <small class="help-text">Email-ul nu poate fi modificat.</small>
              </div>
  
              <div class="form-group">
                <label for="role">Tip utilizator:</label>
                <input
                  id="role"
                  :value="profileData.rol"
                  type="text"
                  class="form-input"
                  :disabled="true"
                />
              </div>
            </div>
  
            <!-- Informații personale -->
            <div class="section">
              <h3 class="section-title">👤 Informații Personale</h3>
              
              <div class="form-group">
                <label for="nume_complet">Nume complet: *</label>
                <input
                  id="nume_complet"
                  v-model="profileData.nume_complet"
                  type="text"
                  required
                  class="form-input"
                  placeholder="Nume și prenume"
                />
              </div>
  
              <div class="form-group">
                <label for="telefon">Telefon:</label>
                <input
                  id="telefon"
                  v-model="profileData.telefon"
                  type="tel"
                  class="form-input"
                  placeholder="0712345678"
                />
              </div>
  
              <div class="form-group">
                <label for="data_nasterii">Data nașterii:</label>
                <input
                  id="data_nasterii"
                  v-model="profileData.data_nasterii"
                  type="date"
                  class="form-input"
                  :max="maxDate"
                  :min="minDate"
                />
                <small class="help-text">
                  {{ ageInfo }}
                </small>
              </div>
            </div>
  
            <!-- Informații specifice pacientului -->
            <div v-if="profileData.rol === 'patient'" class="section">
              <h3 class="section-title">🏥 Informații Medicale</h3>
              
              <div class="info-card">
                <div class="info-item">
                  <span class="info-label">Categoria vârstă:</span>
                  <span class="info-value">
                    {{ profileData.varsta_categoria === 'minor' ? 'Minor (sub 18 ani)' : 'Adult (peste 18 ani)' }}
                  </span>
                </div>
                
                <div v-if="profileData.varsta_categoria === 'minor'" class="minor-info">
                  <div class="form-group">
                    <label for="reprezentant_legal_nume">Reprezentant legal:</label>
                    <input
                      id="reprezentant_legal_nume"
                      v-model="profileData.reprezentant_legal_nume"
                      type="text"
                      class="form-input"
                      placeholder="Numele reprezentantului legal"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="reprezentant_legal_cnp">CNP reprezentant legal:</label>
                    <input
                      id="reprezentant_legal_cnp"
                      v-model="profileData.reprezentant_legal_cnp"
                      type="text"
                      class="form-input"
                      placeholder="CNP-ul reprezentantului legal"
                      maxlength="13"
                    />
                  </div>
                </div>
  
                <div class="info-item">
                  <span class="info-label">Cont creat la:</span>
                  <span class="info-value">{{ formatDate(profileData.created_at) }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Ultima actualizare:</span>
                  <span class="info-value">{{ formatDate(profileData.updated_at) }}</span>
                </div>
              </div>
            </div>
  
            <!-- Securitate -->
            <div class="section">
              <h3 class="section-title">🔒 Securitate</h3>
              
              <div class="security-actions">
                <button 
                  type="button" 
                  @click="showChangePassword = !showChangePassword"
                  class="btn-outline"
                >
                  🔑 Schimbă parola
                </button>
                
                <div v-if="showChangePassword" class="password-section">
                  <div class="form-group">
                    <label for="new_password">Parola nouă:</label>
                    <input
                      id="new_password"
                      v-model="newPassword"
                      type="password"
                      class="form-input"
                      minlength="6"
                      placeholder="Minim 6 caractere"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="confirm_password">Confirmă parola:</label>
                    <input
                      id="confirm_password"
                      v-model="confirmPassword"
                      type="password"
                      class="form-input"
                      placeholder="Rescrie parola nouă"
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    @click="changePassword"
                    class="btn-secondary"
                    :disabled="!canChangePassword || changingPassword"
                  >
                    {{ changingPassword ? 'Se schimbă...' : 'Actualizează parola' }}
                  </button>
                </div>
              </div>
            </div>
  
            <div v-if="saveError" class="error-message">
              {{ saveError }}
            </div>
  
            <div v-if="saveSuccess" class="success-message">
              ✅ Profilul a fost actualizat cu succes!
            </div>
          </form>
        </div>
  
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="btn-secondary">
            Anulează
          </button>
          <button 
            @click="saveProfile" 
            class="btn-primary"
            :disabled="saving || !hasChanges"
          >
            {{ saving ? 'Se salvează...' : 'Salvează modificările' }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { supabase } from '@/lib/supabase.js'
  import { useAuthStore } from '@/stores/auth.js'
  
  export default {
    name: 'ProfileEditor',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'updated'],
    data() {
      return {
        profileData: {},
        originalData: {},
        loading: false,
        saving: false,
        error: null,
        saveError: '',
        saveSuccess: false,
        showChangePassword: false,
        newPassword: '',
        confirmPassword: '',
        changingPassword: false
      }
    },
    computed: {
      authStore() {
        return useAuthStore()
      },
      
      hasChanges() {
        return JSON.stringify(this.profileData) !== JSON.stringify(this.originalData)
      },
      
      ageInfo() {
        if (!this.profileData.data_nasterii) return ''
        
        const today = new Date()
        const birth = new Date(this.profileData.data_nasterii)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        
        return `Vârstă: ${age} ani`
      },
      
      maxDate() {
        return new Date().toISOString().split('T')[0]
      },
      
      minDate() {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 120)
        return date.toISOString().split('T')[0]
      },
      
      canChangePassword() {
        return this.newPassword.length >= 6 && 
               this.newPassword === this.confirmPassword
      }
    },
    
    watch: {
      show(newVal) {
        if (newVal) {
          this.loadProfile()
          this.resetPasswordFields()
        }
      },
      
      'profileData.data_nasterii'(newDate) {
        if (newDate) {
          this.updateAgeCategory()
        }
      }
    },
    
    methods: {
      async loadProfile() {
        this.loading = true
        this.error = null
  
        try {
          // Obține datele utilizatorului
          const userProfile = this.authStore.userProfile
          
          if (userProfile.rol === 'patient') {
            // Pentru pacienți, obține și datele din patient_profiles
            const { data: patientData, error: patientError } = await supabase
              .from('patient_profiles')
              .select('*')
              .eq('user_id', this.authStore.user.id)
              .single()
  
            if (patientError) throw patientError
  
            this.profileData = {
              ...userProfile,
              ...patientData
            }
          } else {
            this.profileData = { ...userProfile }
          }
  
          this.originalData = { ...this.profileData }
          this.saveSuccess = false
  
        } catch (error) {
          console.error('Error loading profile:', error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },
  
      updateAgeCategory() {
        if (!this.profileData.data_nasterii) return
        
        const today = new Date()
        const birth = new Date(this.profileData.data_nasterii)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        
        this.profileData.varsta_categoria = age < 18 ? 'minor' : 'adult'
      },
  
      async saveProfile() {
        this.saving = true
        this.saveError = ''
        this.saveSuccess = false
  
        try {
          // Actualizează user_profiles
          const { error: userError } = await supabase
            .from('user_profiles')
            .update({
              nume_complet: this.profileData.nume_complet,
              telefon: this.profileData.telefon,
              updated_at: new Date().toISOString()
            })
            .eq('id', this.authStore.user.id)
  
          if (userError) throw userError
  
          // Pentru pacienți, actualizează și patient_profiles
          if (this.profileData.rol === 'patient') {
            // Actualizează categoria de vârstă dacă data nașterii s-a schimbat
            this.updateAgeCategory()
            
            const { error: patientError } = await supabase
              .from('patient_profiles')
              .update({
                data_nasterii: this.profileData.data_nasterii,
                varsta_categoria: this.profileData.varsta_categoria,
                reprezentant_legal_nume: this.profileData.reprezentant_legal_nume,
                reprezentant_legal_cnp: this.profileData.reprezentant_legal_cnp,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', this.authStore.user.id)
  
            if (patientError) throw patientError
          }
  
          // Actualizează store-ul local
          await this.authStore.fetchUserProfile()
          
          this.originalData = { ...this.profileData }
          this.saveSuccess = true
          
          setTimeout(() => {
            this.saveSuccess = false
          }, 3000)
          
          this.$emit('updated', this.profileData)
  
        } catch (error) {
          console.error('Error saving profile:', error)
          this.saveError = error.message
        } finally {
          this.saving = false
        }
      },
  
      async changePassword() {
        this.changingPassword = true
        this.saveError = ''
  
        try {
          const { error } = await supabase.auth.updateUser({
            password: this.newPassword
          })
  
          if (error) throw error
  
          this.resetPasswordFields()
          this.showChangePassword = false
          this.saveSuccess = true
          
          setTimeout(() => {
            this.saveSuccess = false
          }, 3000)
  
        } catch (error) {
          console.error('Error changing password:', error)
          this.saveError = 'Eroare la schimbarea parolei: ' + error.message
        } finally {
          this.changingPassword = false
        }
      },
  
      resetPasswordFields() {
        this.newPassword = ''
        this.confirmPassword = ''
        this.showChangePassword = false
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
  
      handleOverlayClick() {
        if (!this.saving && !this.changingPassword) {
          this.closeModal()
        }
      },
  
      closeModal() {
        if (this.hasChanges) {
          const confirmClose = confirm('Aveți modificări nesalvate. Sunteți sigur că doriți să închideți?')
          if (!confirmClose) return
        }
        
        this.resetPasswordFields()
        this.saveError = ''
        this.saveSuccess = false
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
  
  .profile-form {
    padding: 0;
  }
  
  .section {
    border-bottom: 1px solid #e5e7eb;
    padding: 30px;
  }
  
  .section:last-child {
    border-bottom: none;
  }
  
  .section-title {
    margin: 0 0 25px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
    padding-bottom: 10px;
    border-bottom: 2px solid #f3f4f6;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .form-group:last-child {
    margin-bottom: 0;
  }
  
  label {
    font-weight: 600;
    color: #374151;
    font-size: 15px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: white;
    box-sizing: border-box;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  .form-input:disabled {
    background: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  .help-text {
    color: #6b7280;
    font-size: 13px;
    margin-top: 4px;
  }
  
  .info-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .info-label {
    font-weight: 500;
    color: #475569;
  }
  
  .info-value {
    font-weight: 600;
    color: #334155;
  }
  
  .minor-info {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e2e8f0;
  }
  
  .security-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .password-section {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-top: 15px;
  }
  
  .error-message,
  .success-message {
    margin: 20px 30px;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
  }
  
  .error-message {
    color: #dc2626;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }
  
  .success-message {
    color: #059669;
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
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
  .btn-outline,
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
  
  .btn-outline {
    background: white;
    color: #374151;
    border: 2px solid #d1d5db;
  }
  
  .btn-primary {
    background: #4f46e5;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }
  
  .btn-outline:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  .btn-secondary:disabled,
  .btn-outline:disabled,
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
    
    .modal-header,
    .section,
    .modal-footer {
      padding: 20px;
    }
    
    .error-message,
    .success-message {
      margin: 20px;
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .btn-secondary,
    .btn-outline,
    .btn-primary {
      width: 100%;
    }
    
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
  </style>