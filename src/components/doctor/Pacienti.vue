<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>👥 Gestionare Pacienți</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- Filtru și căutare -->
          <div class="filters-section">
            <div class="search-group">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Caută pacient după nume..."
                class="search-input"
              />
              <div class="filter-buttons">
                <button 
                  @click="setFilter('all')"
                  :class="['filter-btn', { active: activeFilter === 'all' }]"
                >
                  Toți ({{ totalCount }})
                </button>
                <button 
                  @click="setFilter('with_questionnaire')"
                  :class="['filter-btn', { active: activeFilter === 'with_questionnaire' }]"
                >
                  Cu chestionar ({{ withQuestionnaireCount }})
                </button>
                <button 
                  @click="setFilter('without_questionnaire')"
                  :class="['filter-btn', { active: activeFilter === 'without_questionnaire' }]"
                >
                  Fără chestionar ({{ withoutQuestionnaireCount }})
                </button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă pacienții...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea pacienților</h3>
            <p>{{ error }}</p>
            <button @click="loadPatients" class="btn-primary">Încearcă din nou</button>
          </div>

          <div v-else-if="filteredPatients.length === 0" class="empty-state">
            <div class="empty-icon">👤</div>
            <h3>Nu s-au găsit pacienți</h3>
            <p v-if="searchTerm">
              Nu există pacienți care să corespundă criteriilor de căutare "{{ searchTerm }}".
            </p>
            <p v-else>
              Nu există pacienți înregistrați în sistem.
            </p>
          </div>

          <div v-else class="patients-list">
            <div 
              v-for="patient in filteredPatients"
              :key="patient.id"
              class="patient-card"
              @click="selectPatient(patient)"
            >
              <div class="patient-header">
                <div class="patient-info">
                  <h4>{{ patient.nume_complet }}</h4>
                  <div class="patient-details">
                    <span class="detail-item">
                      📧 {{ patient.email }}
                    </span>
                    <span v-if="patient.telefon" class="detail-item">
                      📞 {{ patient.telefon }}
                    </span>
                  </div>
                </div>
                <div class="patient-status">
                  <span 
                    :class="['status-badge', patient.hasQuestionnaire ? 'completed' : 'pending']"
                  >
                    {{ patient.hasQuestionnaire ? '✅ Chestionar completat' : '⏳ Chestionar lipsă' }}
                  </span>
                  <span class="age-category">
                    {{ patient.varsta_categoria === 'minor' ? '👶 Minor' : '👤 Adult' }}
                  </span>
                </div>
              </div>

              <div class="patient-summary">
                <div class="summary-item">
                  <span class="label">Data înregistrării:</span>
                  <span class="value">{{ formatDate(patient.created_at) }}</span>
                </div>
                <div v-if="patient.data_nasterii" class="summary-item">
                  <span class="label">Data nașterii:</span>
                  <span class="value">{{ formatDate(patient.data_nasterii) }} ({{ calculateAge(patient.data_nasterii) }} ani)</span>
                </div>
                <div v-if="patient.questionnaire_date" class="summary-item">
                  <span class="label">Ultima completare chestionar:</span>
                  <span class="value">{{ formatDate(patient.questionnaire_date) }}</span>
                </div>
              </div>

              <div class="patient-actions">
                <button class="btn-outline btn-sm">
                  👁️ Vezi detalii
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-info">
            <span>Total pacienți: {{ filteredPatients.length }}</span>
          </div>
          <button @click="closeModal" class="btn-secondary">Închide</button>
        </div>
      </div>
    </div>
  </template>

  <script>
  import { supabase } from '@/lib/supabase.js'

  export default {
    name: 'Pacienti',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'patient-selected'],
    data() {
      return {
        patients: [],
        loading: false,
        error: null,
        searchTerm: '',
        activeFilter: 'all'
      }
    },

    computed: {
      filteredPatients() {
        let filtered = this.patients

        // Filtru după numele pacientului
        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase()
          filtered = filtered.filter(patient => 
            patient.nume_complet.toLowerCase().includes(searchLower) ||
            patient.email.toLowerCase().includes(searchLower)
          )
        }

        // Filtru după statusul chestionarului
        if (this.activeFilter === 'with_questionnaire') {
          filtered = filtered.filter(patient => patient.hasQuestionnaire)
        } else if (this.activeFilter === 'without_questionnaire') {
          filtered = filtered.filter(patient => !patient.hasQuestionnaire)
        }

        return filtered
      },

      totalCount() {
        return this.patients.length
      },

      withQuestionnaireCount() {
        return this.patients.filter(p => p.hasQuestionnaire).length
      },

      withoutQuestionnaireCount() {
        return this.patients.filter(p => !p.hasQuestionnaire).length
      }
    },

    watch: {
      show(newVal) {
        if (newVal) {
          this.loadPatients()
        }
      }
    },

    methods: {
      async loadPatients() {
        this.loading = true
        this.error = null

        try {
          // Încarcă profilurile pacienților cu informații despre chestionare
          const { data: patientProfiles, error: profilesError } = await supabase
            .from('patient_profiles')
            .select(`
              *,
              user_profiles!inner(
                email,
                nume_complet,
                telefon
              )
            `)
            .order('created_at', { ascending: false })

          if (profilesError) throw profilesError

          // Pentru fiecare pacient, verifică dacă are chestionar completat
          const patientsWithQuestionnaires = await Promise.all(
            patientProfiles.map(async (profile) => {
              const { data: questionnaires } = await supabase
                .from('medical_questionnaires')
                .select('completat_la, status')
                .eq('patient_id', profile.id)
                .eq('status', 'signed')
                .order('completat_la', { ascending: false })
                .limit(1)

              const hasQuestionnaire = questionnaires && questionnaires.length > 0
              const questionnaireDate = hasQuestionnaire ? questionnaires[0].completat_la : null

              return {
                id: profile.id,
                user_id: profile.user_id,
                nume_complet: profile.user_profiles.nume_complet,
                email: profile.user_profiles.email,
                telefon: profile.user_profiles.telefon,
                data_nasterii: profile.data_nasterii,
                varsta_categoria: profile.varsta_categoria,
                reprezentant_legal_nume: profile.reprezentant_legal_nume,
                reprezentant_legal_cnp: profile.reprezentant_legal_cnp,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                hasQuestionnaire,
                questionnaire_date: questionnaireDate
              }
            })
          )

          this.patients = patientsWithQuestionnaires

        } catch (error) {
          console.error('Error loading patients:', error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },

      setFilter(filter) {
        this.activeFilter = filter
      },

      selectPatient(patient) {
        this.$emit('patient-selected', patient)
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
          day: 'numeric'
        })
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

  .filters-section {
    padding: 20px 30px;
    border-bottom: 2px solid #f3f4f6;
    background: #f9fafb;
  }

  .search-group {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  .filter-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: #6b7280;
  }

  .filter-btn:hover {
    border-color: #2196F3;
    color: #2196F3;
  }

  .filter-btn.active {
    background: #2196F3;
    border-color: #2196F3;
    color: white;
  }

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

  .patients-list {
    padding: 20px 30px;
  }

  .patient-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 16px;
    transition: all 0.2s ease;
    background: white;
    cursor: pointer;
  }

  .patient-card:hover {
    border-color: #2196F3;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.1);
    transform: translateY(-1px);
  }

  .patient-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .patient-info h4 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  .patient-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-item {
    font-size: 14px;
    color: #6b7280;
  }

  .patient-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }

  .status-badge.completed {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .age-category {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .patient-summary {
    padding: 0 20px 15px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-item .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .summary-item .value {
    font-size: 14px;
    color: #374151;
    font-weight: 600;
  }

  .patient-actions {
    padding: 15px 20px 20px 20px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: flex-end;
  }

  .modal-footer {
    padding: 20px 30px;
    border-top: 2px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .footer-info {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  }

  .btn-secondary,
  .btn-outline,
  .btn-primary,
  .btn-sm {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-width: 120px;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 14px;
    min-width: auto;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-outline {
    background: white;
    color: #374151;
    border: 2px solid #d1d5db;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
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

    .filters-section,
    .patients-list,
    .modal-footer {
      padding: 15px 20px;
    }

    .search-group {
      gap: 12px;
    }

    .filter-buttons {
      gap: 8px;
    }

    .filter-btn {
      font-size: 12px;
      padding: 6px 12px;
    }

    .patient-header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .patient-status {
      align-items: flex-start;
    }

    .patient-summary {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .modal-footer {
      flex-direction: column;
      gap: 10px;
      text-align: center;
    }
  }
  </style>