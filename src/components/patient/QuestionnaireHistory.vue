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
                  :disabled="pdfGenerating === questionnaire.id"
                >
                  {{ pdfGenerating === questionnaire.id ? '⏳' : '📄' }} PDF
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
      deletingId: null,
      pdfGenerating: null
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

    async downloadPDF(questionnaire) {
      try {
        // Check if html2pdf is available
        if (!window.html2pdf) {
          alert('Eroare: Librăria PDF nu este disponibilă. Vă rugăm să reîncărcați pagina.')
          return
        }

        // Set loading state
        this.pdfGenerating = questionnaire.id
        console.log('Se generează PDF-ul...')
        
        // Create a temporary element with questionnaire details
        const tempDiv = document.createElement('div')
        tempDiv.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 794px;
          min-height: 1123px;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: white;
          color: black;
          box-sizing: border-box;
          z-index: -1;
        `
        
        // Build the PDF content with simplified HTML
        const pdfContent = this.buildSimplePDFContent(questionnaire)
        tempDiv.innerHTML = pdfContent
        
        // Add to DOM
        document.body.appendChild(tempDiv)

        // Wait for DOM to render
        await new Promise(resolve => setTimeout(resolve, 500))

        // Simplified PDF options
        const options = {
          margin: 0.5,
          filename: `Chestionar_${questionnaire.tip_chestionar}_${questionnaire.completat_la ? new Date(questionnaire.completat_la).toLocaleDateString('ro-RO').replace(/\./g, '_') : 'necunoscut'}.pdf`,
          image: { 
            type: 'jpeg', 
            quality: 0.92 
          },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            width: 794,
            height: 1123,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { 
            unit: 'px', 
            format: [794, 1123], 
            orientation: 'portrait'
          }
        }

        console.log('Starting PDF generation...')
        
        // Generate PDF
        await window.html2pdf().set(options).from(tempDiv).save()
        
        // Clean up
        document.body.removeChild(tempDiv)
        
        console.log('PDF generat cu succes!')
        alert('PDF-ul a fost generat cu succes! 📄')
        
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Eroare la generarea PDF-ului: ' + error.message)
        
        // Clean up on error
        const tempElements = document.querySelectorAll('div[style*="z-index: -1"]')
        tempElements.forEach(el => el.remove())
      } finally {
        this.pdfGenerating = null
      }
    },

    // Simplified PDF content
    buildSimplePDFContent(questionnaire) {
      const responses = questionnaire.data_chestionar || {}
      const completedDate = questionnaire.completat_la ? this.formatDate(questionnaire.completat_la) : 'Necunoscut'
      const signedDate = questionnaire.semnat_la ? this.formatDate(questionnaire.semnat_la) : 'Nu este semnat'
      
      return `
        <div>
          <h1 style="text-align: center; color: #333; margin-bottom: 10px; font-size: 24px;">📋 Chestionar Medical</h1>
          <h2 style="text-align: center; color: #666; margin-bottom: 20px; font-size: 18px;">
            ${questionnaire.tip_chestionar === 'minor' ? 'Pentru Minori' : 'Pentru Adulți'}
          </h2>
          <hr style="border: 1px solid #ccc; margin-bottom: 20px;">
          
          <h3 style="color: #333; margin-bottom: 15px;">📋 Informații Generale</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Data completării:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${completedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Data semnării:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${signedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Status:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${this.getStatusLabel(questionnaire.status)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Tip chestionar:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${questionnaire.tip_chestionar === 'minor' ? 'Minor' : 'Adult'}</td>
            </tr>
          </table>

          <h3 style="color: #333; margin-bottom: 15px;">🏥 Răspunsuri Medicale</h3>
          ${this.formatSimpleResponsesForPDF(responses)}
          
          <hr style="border: 1px solid #ccc; margin: 30px 0 10px 0;">
          <p style="text-align: center; color: #666; font-size: 12px; margin: 0;">
            Document generat la: ${new Date().toLocaleDateString('ro-RO')}<br>
            © ${new Date().getFullYear()} - Sistem Digital Interactiv pentru Colectarea Datelor Medicale
          </p>
        </div>
      `
    },

    // Simplified responses formatting
    formatSimpleResponsesForPDF(responses) {
      if (!responses || Object.keys(responses).length === 0) {
        return '<p style="text-align: center; color: #666; font-style: italic; padding: 20px;">Nu există răspunsuri înregistrate.</p>'
      }

      let html = '<table style="width: 100%; border-collapse: collapse;">'
      let rowCount = 0
      
      Object.keys(responses).forEach(key => {
        const value = responses[key]
        if (value !== null && value !== undefined && value.toString().trim() !== '') {
          const bgColor = rowCount % 2 === 0 ? '#f9f9f9' : 'white'
          html += `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: ${bgColor}; font-weight: bold; width: 40%;">
                ${this.formatQuestionLabel(key)}
              </td>
              <td style="padding: 8px; border: 1px solid #ddd; background: ${bgColor};">
                ${this.formatResponseValue(value)}
              </td>
            </tr>
          `
          rowCount++
        }
      })
      
      html += '</table>'
      
      if (rowCount === 0) {
        return '<p style="text-align: center; color: #666; font-style: italic; padding: 20px;">Nu există răspunsuri relevante pentru afișare.</p>'
      }
      
      return html
    },

    // Build PDF content
    buildPDFContent(questionnaire) {
      const responses = questionnaire.data_chestionar || {}
      const completedDate = questionnaire.completat_la ? this.formatDate(questionnaire.completat_la) : 'Necunoscut'
      const signedDate = questionnaire.semnat_la ? this.formatDate(questionnaire.semnat_la) : 'Nu este semnat'
      
      console.log('Building PDF content for questionnaire:', questionnaire.id)
      console.log('Responses found:', Object.keys(responses).length)
      
      // Simple fallback content if no responses
      if (!responses || Object.keys(responses).length === 0) {
        return `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #333; text-align: center;">📋 Chestionar Medical</h1>
            <h2 style="color: #666; text-align: center;">${questionnaire.tip_chestionar === 'minor' ? 'Pentru Minori' : 'Pentru Adulți'}</h2>
            
            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3>Informații Generale</h3>
              <p><strong>Data completării:</strong> ${completedDate}</p>
              <p><strong>Data semnării:</strong> ${signedDate}</p>
              <p><strong>Status:</strong> ${this.getStatusLabel(questionnaire.status)}</p>
              <p><strong>Tip chestionar:</strong> ${questionnaire.tip_chestionar === 'minor' ? 'Minor' : 'Adult'}</p>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px;">
              <h3>⚠️ Observație</h3>
              <p>Nu au fost găsite răspunsuri pentru acest chestionar sau datele nu sunt disponibile.</p>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
              <p>Document generat la: ${new Date().toLocaleDateString('ro-RO')}</p>
            </div>
          </div>
        `
      }
      
      return `
        <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
            <h1 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px;">📋 Chestionar Medical</h1>
            <h2 style="margin: 0 0 15px 0; color: #4f46e5; font-size: 18px;">
              ${questionnaire.tip_chestionar === 'minor' ? 'Pentru Minori' : 'Pentru Adulți'}
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Generat la data: ${new Date().toLocaleDateString('ro-RO')}
            </p>
          </div>

          <!-- Patient Info -->
          <div style="margin-bottom: 25px; padding: 15px; background-color: #f8fafc; border-radius: 6px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              📋 Informații Generale
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;"><strong>Data completării:</strong></td>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;">${completedDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;"><strong>Data semnării:</strong></td>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;">${signedDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;"><strong>Status:</strong></td>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;">${this.getStatusLabel(questionnaire.status)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;"><strong>Tip chestionar:</strong></td>
                <td style="padding: 5px 10px; border: 1px solid #e5e7eb;">${questionnaire.tip_chestionar === 'minor' ? 'Minor' : 'Adult'}</td>
              </tr>
            </table>
          </div>

          <!-- Medical Responses -->
          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              🏥 Răspunsuri Medicale
            </h3>
            ${this.formatMedicalResponsesForPDF(responses)}
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px;">
            <p style="margin: 0;">Document generat automat de sistemul de management al clinicii</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} - Sistem Digital Interactiv pentru Colectarea Datelor Medicale</p>
          </div>
        </div>
      `
    },

    // Format medical responses for PDF
    formatMedicalResponsesForPDF(responses) {
      console.log('Formatting responses for PDF:', responses)
      
      if (!responses || Object.keys(responses).length === 0) {
        return '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">Nu există răspunsuri înregistrate.</p>'
      }

      let html = '<div style="margin: 10px 0;">'
      let hasContent = false
      
      // First, show all available responses
      Object.keys(responses).forEach(key => {
        const value = responses[key]
        if (value !== null && value !== undefined && value.toString().trim() !== '') {
          hasContent = true
          html += `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: white;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 5px;">
                📝 ${this.formatQuestionLabel(key)}
              </div>
              <div style="color: #1f2937;">
                ${this.formatResponseValue(value)}
              </div>
            </div>
          `
        }
      })
      
      // If no content was added, show all responses for debugging
      if (!hasContent) {
        html += '<div style="padding: 15px; background: #fff3cd; border-radius: 4px;">'
        html += '<h4>🔍 Debug - Toate răspunsurile disponibile:</h4>'
        
        if (Object.keys(responses).length === 0) {
          html += '<p>Nu există chei în obiectul responses.</p>'
        } else {
          Object.keys(responses).forEach(key => {
            const value = responses[key]
            html += `<p><strong>${key}:</strong> ${value} (tip: ${typeof value})</p>`
          })
        }
        html += '</div>'
      }
      
      html += '</div>'
      
      console.log('Generated HTML length:', html.length)
      return html
    },

    // Format response value
    formatResponseValue(value) {
      if (typeof value === 'boolean') {
        return value ? 'Da' : 'Nu'
      }
      if (typeof value === 'string') {
        return value.length > 100 ? value.substring(0, 100) + '...' : value
      }
      return value.toString()
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