import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from './auth.js'

export const useQuestionnaireStore = defineStore('questionnaire', {
  state: () => ({
    currentQuestionnaire: null,
    questionnaireType: null, // 'adult' sau 'minor'
    sections: [],
    responses: {},
    loading: false,
    saving: false,
    error: null,
    patientProfile: null,
    showDateModal: false,
    showQuestionnaireModal: false
  }),

  getters: {
    isMinor: (state) => state.questionnaireType === 'minor',
    isComplete: (state) => {
      if (!state.sections.length) return false
      
      // Verifică dacă toate întrebările obligatorii au răspuns
      return state.sections.every(section => 
        section.intrebari.every(intrebare => {
          if (!intrebare.obligatoriu) return true
          
          // Verifică condițiile pentru întrebări condiționale
          if (intrebare.conditie) {
            // Evaluează condiția simplu (ex: "fumat === 'DA'")
            const condition = intrebare.conditie.replace(/'/g, '"')
            try {
              const result = eval(condition.replace(/(\w+)/g, (match) => 
                `"${state.responses[match] || ''}"`
              ))
              if (!result) return true // Întrebarea nu e aplicabilă
            } catch (e) {
              return true // În caz de eroare, consideră întrebarea opțională
            }
          }
          
          return !!state.responses[intrebare.id]
        })
      )
    },
    
    completionPercentage: (state) => {
      const totalQuestions = state.sections.reduce((total, section) => 
        total + section.intrebari.filter(q => q.obligatoriu).length, 0
      )
      const answeredQuestions = Object.keys(state.responses).length
      return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    }
  },

  actions: {
    async checkQuestionnaireStatus() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        
        // Obține profilul pacientului
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', authStore.user.id)
          .single()

        this.patientProfile = profile

        // Verifică dacă există chestionar completat recent (< 6 luni)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const { data: recentQuestionnaire } = await supabase
          .from('medical_questionnaires')
          .select('*')
          .eq('patient_id', profile.id)
          .eq('status', 'signed')
          .gte('completat_la', sixMonthsAgo.toISOString())
          .order('completat_la', { ascending: false })
          .limit(1)
          .single()

        if (recentQuestionnaire) {
          // Are chestionar recent
          return { 
            hasRecent: true, 
            questionnaire: recentQuestionnaire,
            needsUpdate: false 
          }
        }

        // Determină tipul chestionarului
        if (!profile.data_nasterii) {
          // Prima completare - arată modal pentru data nașterii
          this.showDateModal = true
          return { hasRecent: false, needsUpdate: true, needsBirthDate: true }
        } else {
          this.questionnaireType = profile.varsta_categoria || 'adult'
          await this.loadQuestionnaireSections()
          this.showQuestionnaireModal = true
          return { hasRecent: false, needsUpdate: true, needsBirthDate: false }
        }

      } catch (error) {
        console.error('Error checking questionnaire status:', error)
        this.error = error.message
        return { hasRecent: false, needsUpdate: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async setDateOfBirth(birthDate) {
      try {
        const authStore = useAuthStore()
        
        // Calculează vârsta
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        
        const questionnaireType = age < 18 ? 'minor' : 'adult'

        // Actualizează profilul pacientului
        const { error } = await supabase
          .from('patient_profiles')
          .update({ data_nasterii: birthDate })
          .eq('user_id', authStore.user.id)

        if (error) throw error

        this.questionnaireType = questionnaireType
        this.responses.data_nasterii = birthDate
        this.showDateModal = false

        await this.loadQuestionnaireSections()
        this.showQuestionnaireModal = true

        return { success: true, type: questionnaireType }

      } catch (error) {
        console.error('Error setting date of birth:', error)
        this.error = error.message
        return { success: false, error: error.message }
      }
    },

    async loadQuestionnaireSections() {
      try {
        const { data: sections, error } = await supabase
          .from('questionnaire_sections')
          .select('*')
          .eq('tip_chestionar', this.questionnaireType)
          .eq('activ', true)
          .order('sectiune_ordine')

        if (error) throw error

        this.sections = sections
        
        // Pre-populează cu datele existente
        if (this.patientProfile) {
          if (this.patientProfile.data_nasterii) {
            this.responses.data_nasterii = this.patientProfile.data_nasterii
          }
        }

      } catch (error) {
        console.error('Error loading questionnaire sections:', error)
        this.error = error.message
      }
    },

    updateResponse(questionId, value) {
      this.responses = { ...this.responses, [questionId]: value }
    },

    async saveQuestionnaire(isComplete = false) {
      this.saving = true
      this.error = null

      try {
        const questionnaireData = {
          patient_id: this.patientProfile.id,
          tip_chestionar: this.questionnaireType,
          data_chestionar: this.responses,
          status: isComplete ? 'completed' : 'draft'
        }

        if (isComplete) {
          questionnaireData.completat_la = new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('medical_questionnaires')
          .insert(questionnaireData)
          .select()
          .single()

        if (error) throw error

        this.currentQuestionnaire = data
        
        return { success: true, data }

      } catch (error) {
        console.error('Error saving questionnaire:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.saving = false
      }
    },

    async signQuestionnaire(signature) {
      try {
        if (!this.currentQuestionnaire) {
          throw new Error('Nu există chestionar de semnat')
        }

        const { error } = await supabase
          .from('medical_questionnaires')
          .update({
            status: 'signed',
            semnatura_digitala: signature,
            semnat_la: new Date().toISOString()
          })
          .eq('id', this.currentQuestionnaire.id)

        if (error) throw error

        this.currentQuestionnaire.status = 'signed'
        this.showQuestionnaireModal = false
        
        return { success: true }

      } catch (error) {
        console.error('Error signing questionnaire:', error)
        this.error = error.message
        return { success: false, error: error.message }
      }
    },

    closeModals() {
      this.showDateModal = false
      this.showQuestionnaireModal = false
    },

    resetQuestionnaire() {
      this.currentQuestionnaire = null
      this.questionnaireType = null
      this.sections = []
      this.responses = {}
      this.error = null
      this.patientProfile = null
      this.showDateModal = false
      this.showQuestionnaireModal = false
    }
  }
})