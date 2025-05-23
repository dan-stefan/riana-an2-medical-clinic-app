<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <div class="header-content">
            <h2>📋 Chestionar Medical</h2>
            <p v-if="questionnaireType">
              {{ questionnaireType === 'minor' ? 'Chestionar pentru minori' : 'Chestionar pentru adulți' }}
            </p>
            <div class="progress-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${completionPercentage}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ completionPercentage }}% completat</span>
            </div>
          </div>
          <button @click="closeModal" class="close-btn" :disabled="saving">
            ✕
          </button>
        </div>
  
        <!-- Body -->
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă chestionarul...</p>
          </div>
  
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>A apărut o eroare</h3>
            <p>{{ error }}</p>
            <button @click="retryLoad" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <form v-else @submit.prevent="handleSubmit" class="questionnaire-form">
            <!-- Secțiuni chestionar -->
            <div 
              v-for="(section, sectionIndex) in sections" 
              :key="section.id"
              class="section"
            >
              <h3 class="section-title">
                {{ section.sectiune_nume }}
              </h3>
              
              <div class="questions-grid">
                <div 
                  v-for="(question, questionIndex) in section.intrebari"
                  :key="question.id"
                  :class="[
                    'question-item',
                    { 'question-hidden': !isQuestionVisible(question) }
                  ]"
                >
                  <label :for="question.id" class="question-label">
                    {{ question.intrebare }}
                    <span v-if="question.obligatoriu" class="required-mark">*</span>
                  </label>
  
                  <!-- Text Input -->
                  <input
                    v-if="question.tip === 'text'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    type="text"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    :placeholder="getPlaceholder(question)"
                    class="text-input"
                    @input="updateResponse(question.id, $event.target.value)"
                  />
  
                  <!-- Email Input -->
                  <input
                    v-else-if="question.tip === 'email'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    type="email"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    placeholder="exemplu@email.com"
                    class="text-input"
                    @input="updateResponse(question.id, $event.target.value)"
                  />
  
                  <!-- Tel Input -->
                  <input
                    v-else-if="question.tip === 'tel'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    type="tel"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    placeholder="0712345678"
                    class="text-input"
                    @input="updateResponse(question.id, $event.target.value)"
                  />
  
                  <!-- Date Input -->
                  <input
                    v-else-if="question.tip === 'date'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    type="date"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    class="date-input"
                    @input="updateResponse(question.id, $event.target.value)"
                  />
  
                  <!-- Number Input -->
                  <input
                    v-else-if="question.tip === 'number'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    type="number"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    :placeholder="getPlaceholder(question)"
                    class="text-input"
                    min="0"
                    @input="updateResponse(question.id, $event.target.value)"
                  />
  
                  <!-- Radio Options -->
                  <div v-else-if="question.tip === 'radio'" class="radio-group">
                    <label 
                      v-for="option in question.optiuni"
                      :key="option"
                      class="radio-option"
                    >
                      <input
                        :name="question.id"
                        :value="option"
                        v-model="responses[question.id]"
                        type="radio"
                        :required="question.obligatoriu && isQuestionVisible(question)"
                        @change="updateResponse(question.id, option)"
                      />
                      <span class="radio-label">{{ option }}</span>
                    </label>
                  </div>
  
                  <!-- Textarea for long text -->
                  <textarea
                    v-else-if="question.tip === 'textarea'"
                    :id="question.id"
                    v-model="responses[question.id]"
                    :required="question.obligatoriu && isQuestionVisible(question)"
                    :placeholder="getPlaceholder(question)"
                    class="textarea-input"
                    rows="3"
                    @input="updateResponse(question.id, $event.target.value)"
                  ></textarea>
                </div>
              </div>
            </div>
  
            <!-- Secțiunea de semnătură -->
            <div v-if="isComplete && !currentQuestionnaire" class="signature-section">
              <h3 class="section-title">📝 Semnătură și Consimțământ</h3>
              
              <div class="consent-text">
                <p><strong>Declar că:</strong></p>
                <ul>
                  <li>Informațiile furnizate sunt corecte și complete</li>
                  <li>Înțeleg că datele vor fi folosite strict în scop medical</li>
                  <li>{{ questionnaireType === 'minor' ? 'Semnez ca reprezentant legal al minorului' : 'Semnez în nume propriu' }}</li>
                </ul>
              </div>
  
              <div class="signature-group">
                <label for="signature" class="question-label">
                  Numele complet pentru semnătură: <span class="required-mark">*</span>
                </label>
                <input
                  id="signature"
                  v-model="signature"
                  type="text"
                  required
                  placeholder="Introduceți numele complet"
                  class="text-input"
                />
              </div>
            </div>
  
            <!-- Error message -->
            <div v-if="submitError" class="error-message">
              {{ submitError }}
            </div>
  
            <!-- Success message -->
            <div v-if="currentQuestionnaire && currentQuestionnaire.status === 'signed'" class="success-message">
              ✅ Chestionarul a fost completat și semnat cu succes!
            </div>
          </form>
        </div>
  
        <!-- Footer -->
        <div class="modal-footer">
          <div class="footer-actions">
            <button 
              type="button" 
              @click="saveAsDraft"
              class="btn-secondary"
              :disabled="saving || loading"
              v-if="!currentQuestionnaire"
            >
              {{ saving ? 'Se salvează...' : 'Salvează Draft' }}
            </button>
            
            <button 
              type="button" 
              @click="closeModal"
              class="btn-outline"
              :disabled="saving"
            >
              {{ currentQuestionnaire?.status === 'signed' ? 'Închide' : 'Anulează' }}
            </button>
            
            <button 
              v-if="!currentQuestionnaire"
              @click="submitQuestionnaire"
              class="btn-primary"
              :disabled="!canSubmit || saving"
            >
              {{ saving ? 'Se procesează...' : 'Finalizează și Semnează' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useQuestionnaireStore } from '@/stores/questionnaire.js'
  
  export default {
    name: 'QuestionnaireModal',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'completed'],
    data() {
      return {
        signature: '',
        submitError: '',
        hasUnsavedChanges: false
      }
    },
    computed: {
      questionnaireStore() {
        return useQuestionnaireStore()
      },
      
      loading() {
        return this.questionnaireStore.loading
      },
      
      saving() {
        return this.questionnaireStore.saving
      },
      
      error() {
        return this.questionnaireStore.error
      },
      
      sections() {
        return this.questionnaireStore.sections
      },
      
      responses() {
        return this.questionnaireStore.responses
      },
      
      questionnaireType() {
        return this.questionnaireStore.questionnaireType
      },
      
      currentQuestionnaire() {
        return this.questionnaireStore.currentQuestionnaire
      },
      
      isComplete() {
        return this.questionnaireStore.isComplete
      },
      
      completionPercentage() {
        return this.questionnaireStore.completionPercentage
      },
      
      canSubmit() {
        return this.isComplete && this.signature.trim().length > 2
      }
    },
    
    watch: {
      responses: {
        handler() {
          this.hasUnsavedChanges = true
        },
        deep: true
      },
      
      show(newVal) {
        if (newVal) {
          this.signature = ''
          this.submitError = ''
          this.hasUnsavedChanges = false
        }
      }
    },
    
    methods: {
      updateResponse(questionId, value) {
        this.questionnaireStore.updateResponse(questionId, value)
      },
      
      isQuestionVisible(question) {
        if (!question.conditie) return true
        
        // Evaluează condiția în mod sigur
        const evaluateCondition = (condition, responses) => {
          const parts = condition.split('===')
          if (parts.length !== 2) return true
          
          const key = parts[0].trim()
          const value = parts[1].trim().replace(/['"]/g, '')
          return responses[key] === value
        }
        
        try {
          return evaluateCondition(question.conditie, this.responses)
        } catch (e) {
          console.error('Error evaluating condition:', e)
          return true
        }
      },
      
      getPlaceholder(question) {
        const placeholders = {
          'tigari_pe_zi': 'ex: 10',
          'medic_detalii': 'Numele medicului și diagnosticul',
          'alergii_detalii': 'Specificați substanțele',
          'medicamente_lista': 'Numele medicamentelor',
          'ultim_consult': 'ex: Ianuarie 2024'
        }
        return placeholders[question.id] || ''
      },
      
      async saveAsDraft() {
        this.submitError = ''
        
        const result = await this.questionnaireStore.saveQuestionnaire(false)
        
        if (result.success) {
          this.hasUnsavedChanges = false
          // Poți adăuga o notificare de succes aici
        } else {
          this.submitError = result.error
        }
      },
      
      async submitQuestionnaire() {
        this.submitError = ''
        
        if (!this.canSubmit) {
          this.submitError = 'Vă rugăm să completați toate câmpurile obligatorii și să introduceți semnătura.'
          return
        }
        
        // Salvează ca finalizat
        const saveResult = await this.questionnaireStore.saveQuestionnaire(true)
        
        if (!saveResult.success) {
          this.submitError = saveResult.error
          return
        }
        
        // Semnează chestionarul
        const signResult = await this.questionnaireStore.signQuestionnaire(this.signature)
        
        if (signResult.success) {
          this.$emit('completed', {
            questionnaire: this.currentQuestionnaire,
            type: this.questionnaireType
          })
        } else {
          this.submitError = signResult.error
        }
      },
      
      async retryLoad() {
        await this.questionnaireStore.loadQuestionnaireSections()
      },
      
      handleOverlayClick() {
        if (!this.saving) {
          this.closeModal()
        }
      },
      
      closeModal() {
        if (this.hasUnsavedChanges && !this.currentQuestionnaire?.status) {
          const confirmClose = confirm('Aveți modificări nesalvate. Sunteți sigur că doriți să închideți?')
          if (!confirmClose) return
        }
        
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
    margin: 0 0 5px 0;
    color: #1f2937;
    font-size: 24px;
    font-weight: 700;
  }
  
  .header-content p {
    margin: 0 0 15px 0;
    color: #6b7280;
    font-size: 14px;
  }
  
  .progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ade80, #22c55e);
    transition: width 0.3s ease;
    border-radius: 4px;
  }
  
  .progress-text {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    min-width: 80px;
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
  
  .close-btn:hover:not(:disabled) {
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
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .questionnaire-form {
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
  
  .questions-grid {
    display: grid;
    gap: 20px;
  }
  
  .question-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .question-hidden {
    display: none;
  }
  
  .question-label {
    font-weight: 600;
    color: #374151;
    font-size: 15px;
    line-height: 1.4;
  }
  
  .required-mark {
    color: #dc2626;
    font-weight: 700;
  }
  
  .text-input,
  .date-input,
  .textarea-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: white;
    box-sizing: border-box;
  }
  
  .text-input:focus,
  .date-input:focus,
  .textarea-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  .textarea-input {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
  
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .radio-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
  }
  
  .radio-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
  
  .radio-option input[type="radio"] {
    margin: 0;
    cursor: pointer;
  }
  
  .radio-option:has(input:checked) {
    border-color: #4f46e5;
    background: #eef2ff;
  }
  
  .radio-label {
    font-size: 15px;
    color: #374151;
    cursor: pointer;
    flex: 1;
  }
  
  .signature-section {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 25px;
    margin: 20px 30px;
  }
  
  .consent-text {
    margin-bottom: 20px;
    color: #475569;
    line-height: 1.6;
  }
  
  .consent-text ul {
    margin: 10px 0 0 20px;
    padding: 0;
  }
  
  .consent-text li {
    margin-bottom: 5px;
  }
  
  .signature-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    flex-shrink: 0;
  }
  
  .footer-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
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
    background: #4f46e5;
    color: white;
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
  
  /* Responsive design */
  @media (max-width: 768px) {
    .modal-container {
      margin: 10px;
      max-width: none;
      max-height: 95vh;
    }
    
    .modal-header,
    .section,
    .modal-footer {
      padding: 20px;
    }
    
    .signature-section {
      margin: 20px;
    }
    
    .error-message,
    .success-message {
      margin: 20px;
    }
    
    .progress-container {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
    
    .progress-text {
      text-align: center;
      min-width: auto;
    }
    
    .footer-actions {
      flex-direction: column;
    }
    
    .btn-secondary,
    .btn-outline,
    .btn-primary {
      width: 100%;
    }
    
    .radio-group {
      gap: 8px;
    }
    
    .radio-option {
      padding: 10px 12px;
    }
  }
  
  @media (max-width: 480px) {
    .header-content h2 {
      font-size: 20px;
    }
    
    .section-title {
      font-size: 18px;
    }
    
    .questions-grid {
      gap: 16px;
    }
    
    .text-input,
    .date-input,
    .textarea-input {
      padding: 10px 12px;
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
  </style>