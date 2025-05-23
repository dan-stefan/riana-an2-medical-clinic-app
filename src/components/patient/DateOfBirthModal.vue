<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>📅 Data Nașterii</h2>
          <p>Pentru a vă oferi chestionarul medical potrivit, avem nevoie de data dumneavoastră de naștere.</p>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="birthDate">Data nașterii:</label>
              <input
                id="birthDate"
                v-model="birthDate"
                type="date"
                required
                :max="maxDate"
                :min="minDate"
                class="date-input"
              />
              <small class="help-text">
                Această informație este necesară pentru a determina tipul de chestionar medical potrivit.
              </small>
            </div>
  
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
  
            <div class="modal-actions">
              <button 
                type="button" 
                @click="$emit('close')" 
                class="btn-secondary"
                :disabled="loading"
              >
                Anulează
              </button>
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!birthDate || loading"
              >
                {{ loading ? 'Se procesează...' : 'Continuă' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useQuestionnaireStore } from '@/stores/questionnaire.js'
  
  export default {
    name: 'DateOfBirthModal',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'continue'],
    data() {
      return {
        birthDate: '',
        error: ''
      }
    },
    computed: {
      questionnaireStore() {
        return useQuestionnaireStore()
      },
      loading() {
        return this.questionnaireStore.loading
      },
      maxDate() {
        // Nu mai târziu de azi
        return new Date().toISOString().split('T')[0]
      },
      minDate() {
        // Nu mai devreme de 120 de ani
        const date = new Date()
        date.setFullYear(date.getFullYear() - 120)
        return date.toISOString().split('T')[0]
      }
    },
    methods: {
      async handleSubmit() {
        this.error = ''
        
        if (!this.birthDate) {
          this.error = 'Vă rugăm să introduceți data nașterii.'
          return
        }
  
        // Verifică dacă data nu este în viitor
        if (new Date(this.birthDate) > new Date()) {
          this.error = 'Data nașterii nu poate fi în viitor.'
          return
        }
  
        const result = await this.questionnaireStore.setDateOfBirth(this.birthDate)
        
        if (result.success) {
          this.$emit('continue', { 
            birthDate: this.birthDate, 
            type: result.type 
          })
        } else {
          this.error = result.error
        }
      },
  
      handleOverlayClick() {
        // Permite închiderea doar dacă nu se încarcă
        if (!this.loading) {
          this.$emit('close')
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .modal-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease-out;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-header {
    padding: 30px 30px 20px 30px;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
  }
  
  .modal-header h2 {
    margin: 0 0 10px 0;
    color: #1f2937;
    font-size: 24px;
    font-weight: 600;
  }
  
  .modal-header p {
    margin: 0;
    color: #6b7280;
    font-size: 15px;
    line-height: 1.5;
  }
  
  .modal-body {
    padding: 30px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 16px;
  }
  
  .date-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: white;
  }
  
  .date-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  .help-text {
    display: block;
    margin-top: 6px;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.4;
  }
  
  .error-message {
    color: #dc2626;
    background-color: #fef2f2;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 4px solid #dc2626;
    font-size: 14px;
    margin-bottom: 20px;
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
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
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
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
  
  @media (max-width: 480px) {
    .modal-container {
      margin: 10px;
      max-width: none;
    }
    
    .modal-header,
    .modal-body {
      padding: 20px;
    }
    
    .modal-actions {
      flex-direction: column;
    }
    
    .btn-secondary,
    .btn-primary {
      width: 100%;
    }
  }
  </style>