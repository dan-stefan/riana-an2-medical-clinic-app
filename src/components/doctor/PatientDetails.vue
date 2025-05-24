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
              <div class="development-notice">
                <div class="notice-icon">🚧</div>
                <h4>Secțiune în dezvoltare</h4>
                <p>
                  Funcționalitatea de gestionare a programărilor este în curs de dezvoltare. 
                  Aici vor fi afișate toate programările pacientului, inclusiv:
                </p>
                <ul>
                  <li>Programări viitoare</li>
                  <li>Istoricul consultațiilor</li>
                  <li>Observații medicale</li>
                  <li>Tratamente recomandate</li>
                </ul>
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
        questionnaireError: null
      }
    },

    watch: {
      show(newVal) {
        if (newVal && this.selectedPatient) {
          this.loadQuestionnaire()
        }
      },

      activeTab(newTab) {
        if (newTab === 'questionnaire' && !this.questionnaire && this.selectedPatient?.hasQuestionnaire) {
          this.loadQuestionnaire()
        }
      }
    },

    methods: {
      async loadQuestionnaire() {
        if (!this.selectedPatient?.hasQuestionnaire) return

        this.loadingQuestionnaire = true
        this.questionnaireError = null

        try {
          const { data: questionnaires, error } = await supabase
            .from('medical_questionnaires')
            .select('*')
            .eq('patient_id', this.selectedPatient.id)
            .eq('status', 'signed')
            .order('completat_la', { ascending: false })
            .limit(1)

          if (error) throw error

          this.questionnaire = questionnaires && questionnaires.length > 0 ? questionnaires[0] : null

        } catch (error) {
          console.error('Error loading questionnaire:', error)
          this.questionnaireError = error.message
        } finally {
          this.loadingQuestionnaire = false
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

      getStatusLabel(status) {
        const labels = {
          'draft': 'Draft',
          'completed': 'Completat',
          'signed': 'Semnat'
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

      handleOverlayClick() {
        this.closeModal()
      },

      closeModal() {
        this.activeTab = 'general'
        this.questionnaire = null
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

  /* Appointments Styles */
  .development-notice {
    background: #fffbeb;
    border: 2px solid #fbbf24;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
  }

  .notice-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  .development-notice h4 {
    margin: 0 0 15px 0;
    color: #92400e;
    font-size: 20px;
    font-weight: 600;
  }

  .development-notice p {
    color: #78350f;
    line-height: 1.6;
    margin-bottom: 15px;
  }

  .development-notice ul {
    text-align: left;
    color: #78350f;
    max-width: 400px;
    margin: 0 auto;
  }

  .development-notice li {
    margin-bottom: 8px;
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
  }
  </style>