<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>📚 Istoricul Chestionarelor</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Se încarcă istoricul...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h3>Eroare la încărcarea istoricului</h3>
          <p>{{ error }}</p>
          <button @click="loadHistory" class="btn-primary">Încearcă din nou</button>
        </div>

        <div v-else-if="questionnaires.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>Nu există chestionare completate</h3>
          <p>Încă nu ați completat niciun chestionar medical.</p>
          <button @click="startNewQuestionnaire" class="btn-primary">
            Completează primul chestionar
          </button>
        </div>

        <div v-else class="questionnaires-list">
          <div 
            v-for="questionnaire in questionnaires"
            :key="questionnaire.id"
            class="questionnaire-card"
          >
            <div class="card-header">
              <div class="questionnaire-info">
                <h4>Chestionar {{ questionnaire.tip_chestionar === 'minor' ? 'Minor' : 'Adult' }}</h4>
                <div class="date-info">
                  <span class="date">📅 {{ formatDate(questionnaire.completat_la) }}</span>
                  <span :class="['status', questionnaire.status]">
                    {{ getStatusLabel(questionnaire.status) }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button 
                  @click="viewDetails(questionnaire)"
                  class="btn-outline btn-sm"
                >
                  👁️ Vezi detalii
                </button>
                <button 
                  v-if="questionnaire.status === 'signed'"
                  @click="downloadPDF(questionnaire)"
                  class="btn-outline btn-sm"
                >
                  📄 PDF
                </button>
                <button 
                  v-if="questionnaire.status === 'draft'"
                  @click="deleteDraft(questionnaire)"
                  class="btn-danger btn-sm"
                  :disabled="deletingId === questionnaire.id"
                >
                  {{ deletingId === questionnaire.id ? '⏳' : '🗑️' }} Șterge Draft
                </button>
              </div>
            </div>

            <div class="card-summary">
              <div class="summary-item">
                <span class="label">Secțiuni completate:</span>
                <span class="value">{{ getCompletedSections(questionnaire) }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Data semnării:</span>
                <span class="value">
                  {{ questionnaire.semnat_la ? formatDate(questionnaire.semnat_la) : 'Nu este semnat' }}
                </span>
              </div>
            </div>

            <!-- Expandable details -->
            <div v-if="expandedId === questionnaire.id" class="card-details">
              <div class="details-content">
                <h5>Rezumat răspunsuri:</h5>
                <div class="responses-summary">
                  <div 
                    v-for="(value, key) in getImportantResponses(questionnaire)"
                    :key="key"
                    class="response-item"
                  >
                    <span class="response-label">{{ formatQuestionLabel(key) }}:</span>
                    <span class="response-value">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn-secondary">Închide</button>
        <button @click="startNewQuestionnaire" class="btn-primary">
          + Chestionar nou
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'QuestionnaireHistory',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'start-new', 'draft-deleted'],
  data() {
    return {
      questionnaires: [],
      loading: false,
      error: null,
      expandedId: null,
      deletingId: null
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadHistory()
      }
    }
  },
  methods: {
    async loadHistory() {
      this.loading = true
      this.error = null

      try {
        // Obține ID-ul profilului de pacient
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', this.authStore.user.id)
          .single()

        if (!profile) {
          throw new Error('Profilul de pacient nu a fost găsit')
        }

        // Obține chestionarele
        const { data: questionnaires, error } = await supabase
          .from('medical_questionnaires')
          .select('*')
          .eq('patient_id', profile.id)
          .order('completat_la', { ascending: false })

        if (error) throw error

        this.questionnaires = questionnaires || []

      } catch (error) {
        console.error('Error loading questionnaire history:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async deleteDraft(questionnaire) {
      // Confirmă ștergerea
      const confirmDelete = confirm(`Sunteți sigur că doriți să ștergeți draft-ul din ${this.formatDate(questionnaire.created_at)}?`)
      if (!confirmDelete) return

      this.deletingId = questionnaire.id

      try {
        const { error } = await supabase
          .from('medical_questionnaires')
          .delete()
          .eq('id', questionnaire.id)
          .eq('status', 'draft') // Siguranta suplimentara

        if (error) throw error

        // Elimină din lista locală
        this.questionnaires = this.questionnaires.filter(q => q.id !== questionnaire.id)
        
        // Emisă eveniment pentru notificare în dashboard
        this.$emit('draft-deleted', questionnaire)

      } catch (error) {
        console.error('Error deleting draft:', error)
        alert('Eroare la ștergerea draft-ului: ' + error.message)
      } finally {
        this.deletingId = null
      }
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

    getCompletedSections(questionnaire) {
      const responses = questionnaire.data_chestionar || {}
      return Object.keys(responses).length
    },

    getImportantResponses(questionnaire) {
      const responses = questionnaire.data_chestionar || {}
      const important = {}

      // Selectează doar răspunsurile importante pentru afișare
      const importantKeys = [
        'stare_sanatate',
        'alergii',
        'medicamente_curente',
        'boli_inima',
        'diabet',
        'fumat'
      ]

      importantKeys.forEach(key => {
        if (responses[key]) {
          important[key] = responses[key]
        }
      })

      return important
    },

    formatQuestionLabel(key) {
      const labels = {
        'stare_sanatate': 'Stare generală',
        'alergii': 'Alergii',
        'medicamente_curente': 'Medicamente',
        'boli_inima': 'Boli cardiovasculare',
        'diabet': 'Diabet',
        'fumat': 'Fumător'
      }
      return labels[key] || key
    },

    viewDetails(questionnaire) {
      if (this.expandedId === questionnaire.id) {
        this.expandedId = null
      } else {
        this.expandedId = questionnaire.id
      }
    },

    async downloadPDF(questionnaire) {
      // TODO: Implementare generare PDF
      alert('Funcționalitatea de export PDF va fi disponibilă în curând.')
    },

    startNewQuestionnaire() {
      this.$emit('start-new')
      this.closeModal()
    },

    handleOverlayClick() {
      this.closeModal()
    },

    closeModal() {
      this.expandedId = null
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
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.questionnaires-list {
  padding: 20px 30px;
}

.questionnaire-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  background: white;
}

.questionnaire-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.questionnaire-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.date {
  color: #6b7280;
}

.status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status.draft {
  background: #fef3c7;
  color: #92400e;
}

.status.completed {
  background: #dbeafe;
  color: #1e40af;
}

.status.signed {
  background: #d1fae5;
  color: #065f46;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
  min-width: auto;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.card-summary {
  padding: 0 20px 20px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.card-details {
  border-top: 1px solid #e5e7eb;
  padding: 20px;
  background: #f9fafb;
}

.details-content h5 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.responses-summary {
  display: grid;
  gap: 8px;
}

.response-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.response-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.response-value {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
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
.btn-primary,
.btn-danger {
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
.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  .questionnaires-list,
  .modal-footer {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .card-actions {
    justify-content: center;
  }
  
  .card-summary {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .response-item {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}
</style>