<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>📊 Rapoarte și Statistici</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se generează rapoartele...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la generarea rapoartelor</h3>
            <p>{{ error }}</p>
            <button @click="loadData" class="btn-primary">Încearcă din nou</button>
          </div>

          <div v-else class="reports-content">
            <!-- Statistici Generale -->
            <div class="stats-overview">
              <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                  <h3>{{ totalPatients }}</h3>
                  <p>Total Pacienți</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-content">
                  <h3>{{ completedQuestionnaires }}</h3>
                  <p>Chestionare Completate</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                  <h3>{{ completionRate }}%</h3>
                  <p>Rata de Completare</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">⚠️</div>
                <div class="stat-content">
                  <h3>{{ highRiskPatients }}</h3>
                  <p>Pacienți cu Risc Crescut</p>
                </div>
              </div>
            </div>

            <!-- Tabs Navigation -->
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

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Statistici Chestionare -->
              <div v-if="activeTab === 'questionnaires'" class="questionnaires-stats">
                <div class="charts-grid">
                  <!-- Rata de completare -->
                  <div class="chart-card">
                    <h4>📊 Rata de Completare Chestionare</h4>
                    <div class="chart-placeholder">
                      <div class="progress-chart">
                        <div class="progress-circle">
                          <span class="progress-text">{{ completionRate }}%</span>
                        </div>
                        <div class="progress-details">
                          <div class="detail-item">
                            <span class="detail-label">Completate:</span>
                            <span class="detail-value completed">{{ completedQuestionnaires }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Necompletate:</span>
                            <span class="detail-value pending">{{ totalPatients - completedQuestionnaires }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Distribuția afecțiunilor -->
                  <div class="chart-card">
                    <h4>🏥 Distribuția Afecțiunilor</h4>
                    <div class="conditions-chart">
                      <div class="condition-bar" v-for="condition in conditionsStats" :key="condition.name">
                        <div class="condition-info">
                          <span class="condition-name">{{ condition.name }}</span>
                          <span class="condition-count">{{ condition.count }} pacienți</span>
                        </div>
                        <div class="condition-progress">
                          <div 
                            class="condition-fill" 
                            :style="{ width: condition.percentage + '%', backgroundColor: condition.color }"
                          ></div>
                        </div>
                        <span class="condition-percentage">{{ condition.percentage }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Analiza detaliată -->
                <div class="detailed-analysis">
                  <h4>🔍 Analiza Detaliată</h4>
                  <div class="analysis-grid">
                    <div class="analysis-card">
                      <h5>🤧 Alergii</h5>
                      <div class="analysis-stat">
                        <span class="big-number">{{ allergiesCount }}</span>
                        <span class="stat-label">pacienți cu alergii</span>
                      </div>
                      <div class="percentage-bar">
                        <div class="fill" :style="{ width: allergiesPercentage + '%' }"></div>
                      </div>
                      <span class="percentage-text">{{ allergiesPercentage }}% din total</span>
                    </div>

                    <div class="analysis-card">
                      <h5>🚬 Fumători</h5>
                      <div class="analysis-stat">
                        <span class="big-number">{{ smokersCount }}</span>
                        <span class="stat-label">pacienți fumători</span>
                      </div>
                      <div class="percentage-bar">
                        <div class="fill smokers" :style="{ width: smokersPercentage + '%' }"></div>
                      </div>
                      <span class="percentage-text">{{ smokersPercentage }}% din total</span>
                    </div>

                    <div class="analysis-card">
                      <h5>❤️ Boli Cardiovasculare</h5>
                      <div class="analysis-stat">
                        <span class="big-number">{{ heartDiseaseCount }}</span>
                        <span class="stat-label">pacienți afectați</span>
                      </div>
                      <div class="percentage-bar">
                        <div class="fill heart" :style="{ width: heartDiseasePercentage + '%' }"></div>
                      </div>
                      <span class="percentage-text">{{ heartDiseasePercentage }}% din total</span>
                    </div>

                    <div class="analysis-card">
                      <h5>🩺 Diabet</h5>
                      <div class="analysis-stat">
                        <span class="big-number">{{ diabetesCount }}</span>
                        <span class="stat-label">pacienți cu diabet</span>
                      </div>
                      <div class="percentage-bar">
                        <div class="fill diabetes" :style="{ width: diabetesPercentage + '%' }"></div>
                      </div>
                      <span class="percentage-text">{{ diabetesPercentage }}% din total</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Demografia -->
              <div v-if="activeTab === 'demographics'" class="demographics-stats">
                <div class="charts-grid">
                  <!-- Distribuția pe vârste -->
                  <div class="chart-card">
                    <h4>👶👤 Distribuția pe Categorii de Vârstă</h4>
                    <div class="age-distribution">
                      <div class="age-chart">
                        <div class="age-segment minors">
                          <div class="segment-bar" :style="{ height: minorsPercentage + '%' }">
                            <span class="segment-label">{{ minorsCount }}</span>
                          </div>
                          <span class="segment-title">Minori</span>
                        </div>
                        <div class="age-segment adults">
                          <div class="segment-bar" :style="{ height: adultsPercentage + '%' }">
                            <span class="segment-label">{{ adultsCount }}</span>
                          </div>
                          <span class="segment-title">Adulți</span>
                        </div>
                      </div>
                      <div class="age-details">
                        <div class="age-detail">
                          <span class="age-color minors-color"></span>
                          <span>Minori (sub 18 ani): {{ minorsCount }} ({{ minorsPercentage }}%)</span>
                        </div>
                        <div class="age-detail">
                          <span class="age-color adults-color"></span>
                          <span>Adulți (peste 18 ani): {{ adultsCount }} ({{ adultsPercentage }}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Distribuția pe grupe de vârstă -->
                  <div class="chart-card">
                    <h4>📊 Distribuția Detaliată pe Vârste</h4>
                    <div class="age-groups-chart">
                      <div v-for="group in ageGroups" :key="group.name" class="age-group-bar">
                        <div class="group-info">
                          <span class="group-name">{{ group.name }}</span>
                          <span class="group-count">{{ group.count }} pacienți</span>
                        </div>
                        <div class="group-progress">
                          <div 
                            class="group-fill" 
                            :style="{ width: group.percentage + '%' }"
                          ></div>
                        </div>
                        <span class="group-percentage">{{ group.percentage }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Reprezentanți legali -->
                <div v-if="minorsCount > 0" class="legal-representatives">
                  <h4>👨‍👩‍👧‍👦 Reprezentanți Legali</h4>
                  <div class="representatives-stats">
                    <div class="rep-stat">
                      <span class="rep-number">{{ minorsWithRepresentatives }}</span>
                      <span class="rep-label">minori cu reprezentant legal specificat</span>
                    </div>
                    <div class="rep-stat">
                      <span class="rep-number">{{ minorsWithoutRepresentatives }}</span>
                      <span class="rep-label">minori fără reprezentant legal</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rapoarte de Risc -->
              <div v-if="activeTab === 'risk'" class="risk-analysis">
                <div class="risk-overview">
                  <h4>⚠️ Analiza Riscurilor Medicale</h4>
                  <div class="risk-categories">
                    <div class="risk-card high-risk">
                      <div class="risk-header">
                        <span class="risk-icon">🔴</span>
                        <h5>Risc Crescut</h5>
                      </div>
                      <div class="risk-count">{{ highRiskPatients }}</div>
                      <div class="risk-description">Pacienți cu multiple afecțiuni</div>
                    </div>

                    <div class="risk-card medium-risk">
                      <div class="risk-header">
                        <span class="risk-icon">🟡</span>
                        <h5>Risc Moderat</h5>
                      </div>
                      <div class="risk-count">{{ mediumRiskPatients }}</div>
                      <div class="risk-description">Pacienți cu o afecțiune majoră</div>
                    </div>

                    <div class="risk-card low-risk">
                      <div class="risk-header">
                        <span class="risk-icon">🟢</span>
                        <h5>Risc Scăzut</h5>
                      </div>
                      <div class="risk-count">{{ lowRiskPatients }}</div>
                      <div class="risk-description">Pacienți fără afecțiuni majore</div>
                    </div>
                  </div>
                </div>

                <!-- Alerte medicale -->
                <div class="medical-alerts">
                  <h4>🚨 Alerte Medicale</h4>
                  <div v-if="medicalAlerts.length === 0" class="no-alerts">
                    <span class="alert-icon">✅</span>
                    <p>Nu există alerte medicale critice în acest moment.</p>
                  </div>
                  <div v-else class="alerts-list">
                    <div 
                      v-for="alert in medicalAlerts" 
                      :key="alert.id"
                      :class="['alert-item', alert.severity]"
                    >
                      <div class="alert-header">
                        <span class="alert-severity">{{ getAlertIcon(alert.severity) }}</span>
                        <h5>{{ alert.title }}</h5>
                      </div>
                      <p class="alert-description">{{ alert.description }}</p>
                      <div class="alert-patients">
                        <span class="patients-count">{{ alert.patientCount }} pacienți afectați</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Prioritizare consultații -->
                <div class="consultation-priority">
                  <h4>📅 Prioritizare Consultații</h4>
                  <div class="priority-list">
                    <div 
                      v-for="patient in priorityPatients" 
                      :key="patient.id"
                      class="priority-patient"
                    >
                      <div class="patient-info">
                        <span class="patient-name">{{ patient.nume_complet }}</span>
                        <span class="patient-age">{{ calculateAge(patient.data_nasterii) }} ani</span>
                      </div>
                      <div class="priority-reasons">
                        <span 
                          v-for="reason in patient.riskReasons" 
                          :key="reason"
                          class="risk-tag"
                        >
                          {{ reason }}
                        </span>
                      </div>
                      <span :class="['priority-level', patient.priorityLevel]">
                        {{ getPriorityLabel(patient.priorityLevel) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="exportReport" class="btn-outline">📄 Export PDF</button>
          <button @click="closeModal" class="btn-secondary">Închide</button>
        </div>
      </div>
    </div>
  </template>

  <script>
  import { supabase } from '@/lib/supabase.js'

  export default {
    name: 'Rapoarte',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close'],
    data() {
      return {
        loading: false,
        error: null,
        activeTab: 'questionnaires',
        tabs: [
          { id: 'questionnaires', label: 'Statistici Chestionare', icon: '📋' },
          { id: 'demographics', label: 'Demografia', icon: '👥' },
          { id: 'risk', label: 'Analiza Riscurilor', icon: '⚠️' }
        ],
        
        // Date statistici
        patients: [],
        questionnaires: [],
        
        // Stats calculate
        totalPatients: 0,
        completedQuestionnaires: 0,
        completionRate: 0,
        
        // Afecțiuni
        allergiesCount: 0,
        smokersCount: 0,
        heartDiseaseCount: 0,
        diabetesCount: 0,
        
        // Demografia
        minorsCount: 0,
        adultsCount: 0,
        minorsWithRepresentatives: 0,
        
        // Risk analysis
        highRiskPatients: 0,
        mediumRiskPatients: 0,
        lowRiskPatients: 0,
        medicalAlerts: [],
        priorityPatients: []
      }
    },

    computed: {
      allergiesPercentage() {
        return this.totalPatients > 0 ? Math.round((this.allergiesCount / this.completedQuestionnaires) * 100) : 0
      },
      
      smokersPercentage() {
        return this.totalPatients > 0 ? Math.round((this.smokersCount / this.completedQuestionnaires) * 100) : 0
      },
      
      heartDiseasePercentage() {
        return this.totalPatients > 0 ? Math.round((this.heartDiseaseCount / this.completedQuestionnaires) * 100) : 0
      },
      
      diabetesPercentage() {
        return this.totalPatients > 0 ? Math.round((this.diabetesCount / this.completedQuestionnaires) * 100) : 0
      },

      minorsPercentage() {
        return this.totalPatients > 0 ? Math.round((this.minorsCount / this.totalPatients) * 100) : 0
      },

      adultsPercentage() {
        return this.totalPatients > 0 ? Math.round((this.adultsCount / this.totalPatients) * 100) : 0
      },

      minorsWithoutRepresentatives() {
        return this.minorsCount - this.minorsWithRepresentatives
      },

      conditionsStats() {
        return [
          { name: 'Alergii', count: this.allergiesCount, percentage: this.allergiesPercentage, color: '#ef4444' },
          { name: 'Fumători', count: this.smokersCount, percentage: this.smokersPercentage, color: '#f97316' },
          { name: 'Boli Cardiovasculare', count: this.heartDiseaseCount, percentage: this.heartDiseasePercentage, color: '#dc2626' },
          { name: 'Diabet', count: this.diabetesCount, percentage: this.diabetesPercentage, color: '#7c3aed' }
        ]
      },

      ageGroups() {
        const groups = [
          { name: '0-17 ani', count: this.minorsCount },
          { name: '18-30 ani', count: 0 },
          { name: '31-50 ani', count: 0 },
          { name: '51-70 ani', count: 0 },
          { name: '70+ ani', count: 0 }
        ]

        // Calculează distribuția pe grupe pentru adulți
        const adultDistribution = Math.floor(this.adultsCount / 4)
        groups[1].count = adultDistribution
        groups[2].count = adultDistribution
        groups[3].count = adultDistribution
        groups[4].count = this.adultsCount - (adultDistribution * 3)

        return groups.map(group => ({
          ...group,
          percentage: this.totalPatients > 0 ? Math.round((group.count / this.totalPatients) * 100) : 0
        }))
      }
    },

    watch: {
      show(newVal) {
        if (newVal) {
          this.loadData()
        }
      }
    },

    methods: {
      async loadData() {
        this.loading = true
        this.error = null

        try {
          await Promise.all([
            this.loadPatients(),
            this.loadQuestionnaires()
          ])
          
          this.calculateStatistics()
          this.analyzeRisks()
          
        } catch (error) {
          console.error('Error loading reports data:', error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },

      async loadPatients() {
        const { data: patientProfiles, error } = await supabase
          .from('patient_profiles')
          .select(`
            *,
            user_profiles!inner(
              email,
              nume_complet,
              telefon
            )
          `)

        if (error) throw error
        this.patients = patientProfiles.map(profile => ({
          ...profile,
          nume_complet: profile.user_profiles.nume_complet,
          email: profile.user_profiles.email,
          telefon: profile.user_profiles.telefon
        }))
      },

      async loadQuestionnaires() {
        const { data: questionnaires, error } = await supabase
          .from('medical_questionnaires')
          .select('*')
          .eq('status', 'signed')

        if (error) throw error
        this.questionnaires = questionnaires || []
      },

      calculateStatistics() {
        this.totalPatients = this.patients.length
        this.completedQuestionnaires = this.questionnaires.length
        this.completionRate = this.totalPatients > 0 ? 
          Math.round((this.completedQuestionnaires / this.totalPatients) * 100) : 0

        // Calculează statistici afecțiuni
        this.allergiesCount = this.questionnaires.filter(q => 
          q.data_chestionar?.alergii && q.data_chestionar.alergii.toLowerCase() !== 'nu'
        ).length

        this.smokersCount = this.questionnaires.filter(q => 
          q.data_chestionar?.fumat && q.data_chestionar.fumat.toLowerCase() === 'da'
        ).length

        this.heartDiseaseCount = this.questionnaires.filter(q => 
          q.data_chestionar?.boli_inima && q.data_chestionar.boli_inima.toLowerCase() === 'da'
        ).length

        this.diabetesCount = this.questionnaires.filter(q => 
          q.data_chestionar?.diabet && q.data_chestionar.diabet.toLowerCase() === 'da'
        ).length

        // Calculează demografia
        this.minorsCount = this.patients.filter(p => p.varsta_categoria === 'minor').length
        this.adultsCount = this.patients.filter(p => p.varsta_categoria === 'adult').length
        this.minorsWithRepresentatives = this.patients.filter(p => 
          p.varsta_categoria === 'minor' && p.reprezentant_legal_nume
        ).length
      },

      analyzeRisks() {
        let highRisk = 0
        let mediumRisk = 0
        let lowRisk = 0

        const alerts = []
        const priority = []

        this.questionnaires.forEach(q => {
          const patient = this.patients.find(p => p.id === q.patient_id)
          if (!patient) return

          const riskFactors = []
          let riskScore = 0

          // Evaluează factorii de risc
          if (q.data_chestionar?.boli_inima === 'da') {
            riskFactors.push('Boli cardiovasculare')
            riskScore += 3
          }
          
          if (q.data_chestionar?.diabet === 'da') {
            riskFactors.push('Diabet')
            riskScore += 3
          }
          
          if (q.data_chestionar?.fumat === 'da') {
            riskFactors.push('Fumător')
            riskScore += 2
          }
          
          if (q.data_chestionar?.alergii && q.data_chestionar.alergii.toLowerCase() !== 'nu') {
            riskFactors.push('Alergii')
            riskScore += 1
          }

          // Clasifică riscul
          if (riskScore >= 5) {
            highRisk++
            priority.push({
              ...patient,
              riskReasons: riskFactors,
              priorityLevel: 'high',
              riskScore
            })
          } else if (riskScore >= 2) {
            mediumRisk++
            if (riskScore >= 3) {
              priority.push({
                ...patient,
                riskReasons: riskFactors,
                priorityLevel: 'medium',
                riskScore
              })
            }
          } else {
            lowRisk++
          }
        })

        // Verifică combinații periculoase
        const diabeticsAndSmokers = this.questionnaires.filter(q => 
          q.data_chestionar?.diabet === 'da' && q.data_chestionar?.fumat === 'da'
        ).length

        const heartAndDiabetes = this.questionnaires.filter(q => 
          q.data_chestionar?.boli_inima === 'da' && q.data_chestionar?.diabet === 'da'
        ).length

        if (diabeticsAndSmokers > 0) {
          alerts.push({
            id: 'diabetes_smoking',
            title: 'Diabet + Fumat',
            description: 'Pacienți cu diabet care fumează - risc foarte crescut de complicații cardiovasculare',
            severity: 'high',
            patientCount: diabeticsAndSmokers
          })
        }

        if (heartAndDiabetes > 0) {
          alerts.push({
            id: 'heart_diabetes',
            title: 'Boli Cardiovasculare + Diabet',
            description: 'Combinație cu risc foarte crescut - necesită monitorizare intensivă',
            severity: 'high',
            patientCount: heartAndDiabetes
          })
        }

        this.highRiskPatients = highRisk
        this.mediumRiskPatients = mediumRisk
        this.lowRiskPatients = lowRisk
        this.medicalAlerts = alerts
        this.priorityPatients = priority.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)
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

      getAlertIcon(severity) {
        const icons = {
          'high': '🔴',
          'medium': '🟡',
          'low': '🟢'
        }
        return icons[severity] || '⚠️'
      },

      getPriorityLabel(level) {
        const labels = {
          'high': 'Urgență Ridicată',
          'medium': 'Prioritate Medie',
          'low': 'Prioritate Scăzută'
        }
        return labels[level] || level
      },

      exportReport() {
        // TODO: Implementare export PDF
        alert('Funcționalitatea de export PDF va fi disponibilă în curând.')
      },

      handleOverlayClick() {
        this.closeModal()
      },

      closeModal() {
        this.activeTab = 'questionnaires'
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
    border-top: 4px solid #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  /* Stats Overview */
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 20px 30px;
    background: #f9fafb;
  }

  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: all 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    font-size: 32px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 10px;
  }

  .stat-content h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .stat-content p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: #6b7280;
  }

  /* Tabs Navigation */
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

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }

  .chart-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  }

  .chart-card h4 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  /* Progress Chart */
  .progress-chart {
    display: flex;
    align-items: center;
    gap: 30px;
  }

  .progress-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #2196F3 0deg 216deg, #e5e7eb 216deg 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .progress-circle::after {
    content: '';
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 50%;
    position: absolute;
  }

  .progress-text {
    position: relative;
    z-index: 1;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
  }

  .progress-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-label {
    font-size: 14px;
    color: #6b7280;
  }

  .detail-value {
    font-size: 16px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .detail-value.completed {
    background: #d1fae5;
    color: #065f46;
  }

  .detail-value.pending {
    background: #fef3c7;
    color: #92400e;
  }

  /* Conditions Chart */
  .conditions-chart {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .condition-bar {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .condition-info {
    min-width: 150px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .condition-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .condition-count {
    font-size: 12px;
    color: #6b7280;
  }

  .condition-progress {
    flex: 1;
    height: 20px;
    background: #f3f4f6;
    border-radius: 10px;
    overflow: hidden;
  }

  .condition-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.3s ease;
  }

  .condition-percentage {
    min-width: 40px;
    text-align: right;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  /* Detailed Analysis */
  .detailed-analysis {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 25px;
  }

  .detailed-analysis h4 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .analysis-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
  }

  .analysis-card h5 {
    margin: 0 0 15px 0;
    color: #374151;
    font-size: 16px;
    font-weight: 600;
  }

  .analysis-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    margin-bottom: 15px;
  }

  .big-number {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
  }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
  }

  .percentage-bar {
    width: 100%;
    height: 8px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .fill {
    height: 100%;
    background: #2196F3;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .fill.smokers {
    background: #f97316;
  }

  .fill.heart {
    background: #dc2626;
  }

  .fill.diabetes {
    background: #7c3aed;
  }

  .percentage-text {
    font-size: 12px;
    color: #6b7280;
  }

  /* Demographics */
  .age-distribution {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .age-chart {
    display: flex;
    align-items: end;
    justify-content: center;
    gap: 40px;
    height: 200px;
  }

  .age-segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .segment-bar {
    width: 60px;
    background: #2196F3;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: end;
    justify-content: center;
    padding: 10px;
    color: white;
    font-weight: 600;
    min-height: 60px;
  }

  .segment-bar.minors {
    background: #06b6d4;
  }

  .segment-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .age-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .age-detail {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #374151;
  }

  .age-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }

  .minors-color {
    background: #06b6d4;
  }

  .adults-color {
    background: #2196F3;
  }

  /* Age Groups Chart */
  .age-groups-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .age-group-bar {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .group-info {
    min-width: 120px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .group-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .group-count {
    font-size: 12px;
    color: #6b7280;
  }

  .group-progress {
    flex: 1;
    height: 16px;
    background: #f3f4f6;
    border-radius: 8px;
    overflow: hidden;
  }

  .group-fill {
    height: 100%;
    background: #2196F3;
    border-radius: 8px;
    transition: width 0.3s ease;
  }

  .group-percentage {
    min-width: 40px;
    text-align: right;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  /* Legal Representatives */
  .legal-representatives {
    background: #f0f9ff;
    border: 2px solid #bae6fd;
    border-radius: 12px;
    padding: 20px;
    margin-top: 25px;
  }

  .legal-representatives h4 {
    margin: 0 0 15px 0;
    color: #0c4a6e;
    font-size: 18px;
    font-weight: 600;
  }

  .representatives-stats {
    display: flex;
    gap: 30px;
  }

  .rep-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }

  .rep-number {
    font-size: 24px;
    font-weight: 700;
    color: #0c4a6e;
  }

  .rep-label {
    font-size: 14px;
    color: #0369a1;
    text-align: center;
  }

  /* Risk Analysis */
  .risk-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .risk-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .risk-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .risk-icon {
    font-size: 24px;
  }

  .risk-header h5 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .risk-count {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .high-risk .risk-count {
    color: #dc2626;
  }

  .medium-risk .risk-count {
    color: #f59e0b;
  }

  .low-risk .risk-count {
    color: #059669;
  }

  .risk-description {
    font-size: 14px;
    color: #6b7280;
  }

  /* Medical Alerts */
  .medical-alerts {
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
  }

  .medical-alerts h4 {
    margin: 0 0 20px 0;
    color: #991b1b;
    font-size: 18px;
    font-weight: 600;
  }

  .no-alerts {
    text-align: center;
    color: #059669;
  }

  .alert-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }

  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .alert-item {
    background: white;
    border: 2px solid;
    border-radius: 10px;
    padding: 20px;
  }

  .alert-item.high {
    border-color: #fecaca;
    background: #fef2f2;
  }

  .alert-item.medium {
    border-color: #fed7aa;
    background: #fffbeb;
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .alert-severity {
    font-size: 20px;
  }

  .alert-item h5 {
    margin: 0;
    color: #991b1b;
    font-size: 16px;
    font-weight: 600;
  }

  .alert-description {
    color: #7f1d1d;
    margin: 0 0 10px 0;
    line-height: 1.5;
  }

  .patients-count {
    font-size: 14px;
    font-weight: 600;
    color: #991b1b;
  }

  /* Priority Patients */
  .consultation-priority {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 25px;
  }

  .consultation-priority h4 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  .priority-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .priority-patient {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .patient-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .patient-name {
    font-weight: 600;
    color: #1f2937;
  }

  .patient-age {
    font-size: 14px;
    color: #6b7280;
  }

  .priority-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .risk-tag {
    padding: 3px 8px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .priority-level {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .priority-level.high {
    background: #fecaca;
    color: #991b1b;
  }

  .priority-level.medium {
    background: #fed7aa;
    color: #9a3412;
  }

  .priority-level.low {
    background: #d1fae5;
    color: #065f46;
  }

  /* Modal Footer */
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

    .stats-overview {
      grid-template-columns: repeat(2, 1fr);
      padding: 15px 20px;
    }

    .tab-content {
      padding: 20px;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .analysis-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .risk-categories {
      grid-template-columns: 1fr;
    }

    .progress-chart {
      flex-direction: column;
      gap: 20px;
    }

    .age-chart {
      gap: 20px;
    }

    .representatives-stats {
      flex-direction: column;
      gap: 15px;
    }

    .priority-patient {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
  }
  </style>