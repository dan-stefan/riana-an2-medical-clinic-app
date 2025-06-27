<template>
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                Sistem Digital Interactiv pentru
                <span class="highlight">Colectarea Datelor Medicale</span>
              </h1>
              <p class="hero-subtitle">
                Platforma modernă pentru gestionarea informațiilor medicale în stomatologie. 
                Completează chestionare, consultă rezultate și comunică eficient cu medicii.
              </p>
              <div class="hero-actions">
                <button @click="goToAuth('login')" class="btn-primary">
                  🔐 Autentificare
                </button>
                <button @click="goToAuth('register')" class="btn-secondary">
                  📝 Înregistrare
                </button>
              </div>
            </div>
            <div class="hero-image">
              <div class="hero-illustration">
                <div class="illustration-circle">
                  <span class="illustration-icon">🦷</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Features Section -->
      <section class="features-section">
        <div class="container">
          <h2 class="section-title">De ce să alegi platforma noastră?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📋</div>
              <h3>Chestionare Digitale</h3>
              <p>Completează rapid și sigur chestionarele medicale înainte de consultație</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Securitate Maximă</h3>
              <p>Datele tale medicale sunt protejate cu cele mai înalte standarde de securitate</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>Acces Rapid</h3>
              <p>Accesează istoricul medical și rezultatele de oriunde, oricând</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👨‍⚕️</div>
              <h3>Comunicare Directă</h3>
              <p>Comunică eficient cu medicii și echipa medicală</p>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Services Preview Section -->
      <section class="services-section">
        <div class="container">
          <div class="services-header">
            <h2 class="section-title">Serviciile Noastre</h2>
            <p class="section-subtitle">Descoperă gama completă de servicii stomatologice</p>
          </div>
          
          <div v-if="loadingServices" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă serviciile...</p>
          </div>
  
          <div v-else-if="servicesError" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea serviciilor</h3>
            <p>{{ servicesError }}</p>
            <button @click="loadServices" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <div v-else-if="services.length === 0" class="loading-state">
            <p>Nu sunt servicii disponibile.</p>
          </div>
  
          <div v-else class="services-preview-grid">
            <div 
              v-for="service in services.slice(0, 4)"
              :key="service.id"
              class="service-preview-card"
            >
              <div class="service-icon">💼</div>
              <h4>{{ service.nume }}</h4>
              <p class="service-price">{{ formatPrice(service.pret) }}</p>
              <p class="service-description-short">{{ truncateText(service.descriere, 60) }}</p>
            </div>
          </div>
  
          <div class="services-footer">
            <button @click="openServicesModal" class="btn-outline">
              💼 Vezi Toate Serviciile
            </button>
          </div>
        </div>
      </section>
  
      <!-- Doctors Section -->
      <section class="doctors-section">
        <div class="container">
          <div class="doctors-header">
            <h2 class="section-title">Echipa Noastră de Specialiști</h2>
            <p class="section-subtitle">Doctori cu experiență și dedicare pentru sănătatea ta</p>
          </div>
          
          <div v-if="loadingDoctors" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă informațiile despre doctori...</p>
          </div>
  
          <div v-else-if="doctorsError" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea doctorilor</h3>
            <p>{{ doctorsError }}</p>
            <button @click="loadDoctors" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <div v-else-if="doctors.length === 0" class="loading-state">
            <div class="empty-icon">👨‍⚕️</div>
            <p>Nu sunt doctori disponibili în acest moment.</p>
          </div>
  
          <div v-else class="doctors-grid">
            <div 
              v-for="doctor in doctors.slice(0, 6)"
              :key="doctor.id"
              class="doctor-preview-card"
            >
              <div class="doctor-avatar">
                <span class="avatar-icon">👨‍⚕️</span>
              </div>
              <div class="doctor-info">
                <h4>{{ doctor.nume_complet }}</h4>
                <p class="doctor-email">{{ doctor.email }}</p>
                <span class="doctor-status">✅ Disponibil</span>
              </div>
            </div>
          </div>
  
          <div class="doctors-footer">
            <button @click="showAllDoctors" class="btn-outline">
              👩‍⚕️ Vezi Toți Doctorii
            </button>
          </div>
        </div>
      </section>
  
      <!-- Contact Section -->
      <section class="contact-section">
        <div class="container">
          <div class="contact-content">
            <div class="contact-info">
              <h2 class="section-title">Informații de Contact</h2>
              <p class="section-subtitle">Suntem aici să te ajutăm</p>
              <button @click="openContactModal" class="btn-outline">
                📞 Detalii Complete de Contact
              </button>
            </div>
            <div class="contact-quick">
              <div class="quick-contact-card">
                <div class="contact-icon">📞</div>
                <h4>Telefon</h4>
                <p>Sună-ne pentru programări</p>
              </div>
              <div class="quick-contact-card">
                <div class="contact-icon">📍</div>
                <h4>Locație</h4>
                <p>Clinica în centrul orașului</p>
              </div>
              <div class="quick-contact-card">
                <div class="contact-icon">🕐</div>
                <h4>Program</h4>
                <p>Luni - Vineri: 8:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-brand">
              <h3>🦷 Clinica Dentară</h3>
              <p>Sistem Digital pentru Colectarea Datelor Medicale</p>
            </div>
            <div class="footer-links">
              <button @click="goToAuth('login')" class="footer-link">Autentificare</button>
              <button @click="goToAuth('register')" class="footer-link">Înregistrare</button>
              <button @click="openServicesModal" class="footer-link">Servicii</button>
              <button @click="openContactModal" class="footer-link">Contact</button>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; {{ new Date().getFullYear() }} - Sistem Digital Interactiv pentru Colectarea Datelor Medicale</p>
          </div>
        </div>
      </footer>
  
      <!-- Services Modal -->
      <div v-if="showServicesModal" class="modal-overlay" @click="closeServicesModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>💼 Serviciile Noastre Complete</h2>
            <button @click="closeServicesModal" class="close-btn">✕</button>
          </div>
  
          <div class="modal-body">
            <div class="tab-navigation">
              <button 
                class="tab-btn active"
                @click="activeTab = 'servicii'"
              >
                🏥 Servicii
              </button>
            </div>

            <div class="tab-content">
              <div v-if="loadingServices" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Se încarcă serviciile...</p>
              </div>
  
              <div v-else-if="servicesError" class="error-state">
                <div class="error-icon">❌</div>
                <h3>Eroare la încărcarea serviciilor</h3>
                <p>{{ servicesError }}</p>
                <button @click="loadServices" class="btn-primary">Încearcă din nou</button>
              </div>
  
              <div v-else class="services-modal-grid">
                <div 
                  v-for="service in services"
                  :key="service.id"
                  class="service-modal-card"
                >
                  <div class="service-header">
                    <h4>{{ service.nume }}</h4>
                    <span class="service-price-large">{{ formatPrice(service.pret) }}</span>
                  </div>
                  <p class="service-description-full">{{ service.descriere }}</p>
                  <div v-if="service.durata" class="service-duration">
                    🕐 Durată: {{ service.durata }} minute
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <div class="modal-footer">
            <button @click="closeServicesModal" class="btn-secondary">Închide</button>
          </div>
        </div>
      </div>
  
      <!-- Doctors Modal -->
      <div v-if="showDoctorsModal" class="modal-overlay" @click="closeDoctorsModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>👩‍⚕️ Echipa Noastră de Specialiști</h2>
            <button @click="closeDoctorsModal" class="close-btn">✕</button>
          </div>

          <div class="modal-body">
            <div class="tab-navigation">
              <button class="tab-btn active">
                👩‍⚕️ Doctori
              </button>
            </div>

            <div class="tab-content">
              <div v-if="loadingDoctors" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Se încarcă informațiile despre doctori...</p>
              </div>

              <div v-else-if="doctorsError" class="error-state">
                <div class="error-icon">❌</div>
                <h3>Eroare la încărcarea doctorilor</h3>
                <p>{{ doctorsError }}</p>
                <button @click="loadDoctors" class="btn-primary">Încearcă din nou</button>
              </div>

              <div v-else-if="doctors.length === 0" class="loading-state">
                <div class="empty-icon">👨‍⚕️</div>
                <p>Nu sunt doctori disponibili în acest moment.</p>
              </div>

              <div v-else class="doctors-modal-grid">
                <div 
                  v-for="doctor in doctors"
                  :key="doctor.id"
                  class="doctor-modal-card"
                >
                  <div class="doctor-modal-header">
                    <div class="doctor-modal-avatar">
                      <span class="doctor-avatar-icon">👨‍⚕️</span>
                    </div>
                    <div class="doctor-modal-info">
                      <h4>{{ doctor.nume_complet }}</h4>
                      <span class="doctor-status-badge">✅ Disponibil</span>
                    </div>
                  </div>
                  
                  <div class="doctor-modal-details">
                    <div class="doctor-detail-item">
                      <span class="detail-icon">📧</span>
                      <span class="detail-text">{{ doctor.email }}</span>
                    </div>
                    <div class="doctor-detail-item" v-if="doctor.telefon">
                      <span class="detail-icon">📞</span>
                      <span class="detail-text">{{ doctor.telefon }}</span>
                    </div>
                    <div class="doctor-detail-item">
                      <span class="detail-icon">🗓️</span>
                      <span class="detail-text">Membru din {{ formatDate(doctor.created_at) }}</span>
                    </div>
                  </div>

                  <div class="doctor-specialties">
                    <h5>Specializări:</h5>
                    <div class="specialty-tags">
                      <span class="specialty-tag">🦷 Stomatologie Generală</span>
                      <span class="specialty-tag">🔧 Chirurgie Orală</span>
                      <span class="specialty-tag">✨ Estetică Dentară</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeDoctorsModal" class="btn-secondary">Închide</button>
            <button @click="goToAuth('login')" class="btn-primary">📅 Programează Consultație</button>
          </div>
        </div>
      </div>

      <!-- Contact Details Modal -->
      <div v-if="showContactModal" class="modal-overlay" @click="closeContactModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>📞 Detalii Complete de Contact</h2>
            <button @click="closeContactModal" class="close-btn">✕</button>
          </div>

          <div class="modal-body">
            <div class="tab-navigation">
              <button class="tab-btn active">
                📞 Informații Contact
              </button>
            </div>

            <div class="tab-content">
              <div class="contact-details-grid">
                
                <!-- Telefon -->
                <div class="contact-detail-card">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">📞</div>
                    <h4>Telefon & WhatsApp</h4>
                  </div>
                  <div class="contact-detail-info">
                    <p class="contact-main">+40 256 123 456</p>
                    <p class="contact-secondary">Program: Luni - Vineri, 8:00 - 18:00</p>
                    <p class="contact-secondary">Sâmbătă: 9:00 - 14:00</p>
                  </div>
                </div>

                <!-- Email -->
                <div class="contact-detail-card">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">📧</div>
                    <h4>Email</h4>
                  </div>
                  <div class="contact-detail-info">
                    <p class="contact-main">contact@clinica-dentara.ro</p>
                    <p class="contact-secondary">Răspundem în maxim 24 de ore</p>
                    <p class="contact-secondary">Pentru urgențe, vă rugăm să sunați</p>
                  </div>
                </div>

                <!-- Locație -->
                <div class="contact-detail-card">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">📍</div>
                    <h4>Locația Clinicii</h4>
                  </div>
                  <div class="contact-detail-info">
                    <p class="contact-main">Strada Principală Nr. 123</p>
                    <p class="contact-secondary">Sector 1, București, România</p>
                    <p class="contact-secondary">Cod poștal: 010101</p>
                  </div>
                </div>

                <!-- Program Detaliat -->
                <div class="contact-detail-card">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">🕐</div>
                    <h4>Program Detaliat</h4>
                  </div>
                  <div class="contact-detail-info">
                    <div class="schedule-item">
                      <span class="schedule-day">Luni - Marți</span>
                      <span class="schedule-time">8:00 - 18:00</span>
                    </div>
                    <div class="schedule-item">
                      <span class="schedule-day">Miercuri - Joi</span>
                      <span class="schedule-time">8:00 - 19:00</span>
                    </div>
                    <div class="schedule-item">
                      <span class="schedule-day">Vineri</span>
                      <span class="schedule-time">8:00 - 17:00</span>
                    </div>
                    <div class="schedule-item">
                      <span class="schedule-day">Sâmbătă</span>
                      <span class="schedule-time">9:00 - 14:00</span>
                    </div>
                    <div class="schedule-item closed">
                      <span class="schedule-day">Duminică</span>
                      <span class="schedule-time">Închis</span>
                    </div>
                  </div>
                </div>

                <!-- Urgențe -->
                <div class="contact-detail-card emergency">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">🚨</div>
                    <h4>Urgențe Stomatologice</h4>
                  </div>
                  <div class="contact-detail-info">
                    <p class="contact-main emergency-text">+40 256 999 888</p>
                    <p class="contact-secondary">Disponibil 24/7 pentru urgențe</p>
                    <p class="contact-secondary">Dureri acute, traumatisme dentare</p>
                  </div>
                </div>

                <!-- Social Media -->
                <div class="contact-detail-card">
                  <div class="contact-detail-header">
                    <div class="contact-detail-icon">📱</div>
                    <h4>Social Media</h4>
                  </div>
                  <div class="contact-detail-info">
                    <p class="contact-secondary">Urmărește-ne pentru sfaturi și noutăți</p>
                    <p class="contact-main">Facebook: @ClinicaDentara</p>
                    <p class="contact-main">Instagram: @clinica_dentara</p>
                    <p class="contact-main">YouTube: Clinica Dentară</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeContactModal" class="btn-secondary">Închide</button>
            <button class="btn-primary">📞 Programează Consultație</button>
          </div>
        </div>
      </div>

      <!-- Other Modals -->
      <Detalii 
        :show="showDetailsModal"
        :initial-tab="detailsActiveTab"
        @close="showDetailsModal = false"
      />
  
      <Programari 
        :show="showProgramariModal"
        @close="showProgramariModal = false"
        @doctor-selected="onDoctorSelected"
      />
    </div>
  </template>
  
  <script>
  import { supabase } from '@/lib/supabase.js'
  import Detalii from '@/components/patient/Detalii.vue'
  import Programari from '@/components/patient/Programari.vue'
  
  export default {
    name: 'LandingPage',
    components: {
      Detalii,
      Programari
    },
    data() {
      return {
        doctors: [],
        loadingDoctors: false,
        doctorsError: null,
        services: [],
        loadingServices: false,
        servicesError: null,
        showDetailsModal: false,
        showProgramariModal: false,
        showServicesModal: false, // Added this missing property
        showContactModal: false, // Added contact modal property
        showDoctorsModal: false, // Added doctors modal property
        detailsActiveTab: 'servicii',
        activeTab: 'servicii' // Added for modal tab navigation
      }
    },
    
    async mounted() {
      console.log('LandingPage mounted - loading data...')
      try {
        await this.loadDoctors()
        await this.loadServices()
      } catch (error) {
        console.error('Error in mounted:', error)
      }
    },
    
    methods: {
      async loadDoctors() {
        console.log('Loading doctors...')
        this.loadingDoctors = true
        this.doctorsError = null
        
        try {
          const { data: doctors, error } = await supabase
            .from('user_profiles')
            .select(`
              id,
              nume_complet,
              email,
              telefon,
              created_at
            `)
            .eq('rol', 'doctor')
            .is('status', null)
            .order('nume_complet')
  
          console.log('Doctors query result:', { doctors, error })
  
          if (error) throw error
  
          this.doctors = doctors || []
          console.log('Doctors loaded:', this.doctors.length)
          
        } catch (error) {
          console.error('Error loading doctors:', error)
          this.doctorsError = error.message
        } finally {
          this.loadingDoctors = false
        }
      },
  
      async loadServices() {
        console.log('Loading services...')
        this.loadingServices = true
        this.servicesError = null
        
        try {
          const { data: services, error } = await supabase
            .from('servicii')
            .select('*')
            .eq('is_active', true)
            .order('ordine', { ascending: true })
  
          console.log('Services query result:', { services, error })
  
          if (error) throw error
  
          this.services = services || []
          console.log('Services loaded:', this.services.length)
          
        } catch (error) {
          console.error('Error loading services:', error)
          this.servicesError = error.message
        } finally {
          this.loadingServices = false
        }
      },
  
      formatPrice(price) {
        return `${price} RON`
      },
  
      truncateText(text, maxLength) {
        if (!text) return ''
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
      },
  
      goToAuth(mode = 'login') {
        this.$router.push({ 
          path: '/auth', 
          query: { mode } 
        })
      },

      // Updated method name to match the template
      openServicesModal() {
        console.log('Opening services modal')
        this.showServicesModal = true
      },

      closeServicesModal() {
        this.showServicesModal = false
      },

      openContactModal() {
        console.log('Opening contact modal')
        this.showContactModal = true
      },

      closeContactModal() {
        this.showContactModal = false
      },

      openDoctorsModal() {
        console.log('Opening doctors modal')
        this.showDoctorsModal = true
      },

      closeDoctorsModal() {
        this.showDoctorsModal = false
      },

      formatDate(dateString) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('ro-RO', { 
          year: 'numeric', 
          month: 'long' 
        })
      },
  
      showServices() {
        console.log('Opening services modal via Detalii')
        this.detailsActiveTab = 'servicii'
        this.showDetailsModal = true
      },
  
      showContact() {
        console.log('Opening contact modal')
        this.openContactModal()
      },
  
      showAllDoctors() {
        console.log('Opening doctors modal')
        this.openDoctorsModal()
      },
  
      onDoctorSelected(doctor) {
        console.log('Doctor selected from landing page:', doctor)
        this.goToAuth('login')
      }
    }
  }
  </script>
  
  <style scoped>
  .landing-page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  /* Hero Section */
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 60px 20px 40px;
    position: relative;
    box-sizing: border-box;
  }
  
  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .hero-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }
  
  .hero-title {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 700;
    color: white;
    margin: 0 0 20px 0;
    line-height: 1.2;
  }
  
  .highlight {
    color: #fbbf24;
    display: block;
  }
  
  .hero-subtitle {
    font-size: clamp(1.1rem, 2vw, 1.3rem);
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 40px 0;
    line-height: 1.6;
  }
  
  .hero-actions {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .hero-illustration {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .illustration-circle {
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    animation: float 6s ease-in-out infinite;
  }
  
  .illustration-icon {
    font-size: 120px;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  /* Common Styles */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  
  .section-title {
    font-size: clamp(2rem, 4vw, 2.5rem);
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0 0 20px 0;
  }
  
  .section-subtitle {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    margin: 0 0 40px 0;
  }
  
  /* Features Section */
  .features-section {
    padding: 80px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin-top: 50px;
  }
  
  .feature-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 30px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .feature-card:hover {
    transform: translateY(-10px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
  
  .feature-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  .feature-card h3 {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 15px 0;
  }
  
  .feature-card p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin: 0;
  }
  
  /* Services Preview Styles */
  .services-section {
    padding: 80px 20px;
    background: rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }
  
  .services-header {
    text-align: center;
  }
  
  .services-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin: 40px 0;
  }
  
  .service-preview-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 25px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .service-preview-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .service-icon {
    font-size: 36px;
    margin-bottom: 15px;
  }
  
  .service-preview-card h4 {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .service-price {
    background: #fbbf24;
    color: #1f2937;
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-block;
    margin: 0 0 12px 0;
  }
  
  .service-description-short {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
  }
  
  .services-footer {
    text-align: center;
    margin-top: 40px;
  }
  
  /* Services Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .modal-container {
    background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
    border-radius: 20px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header {
    padding: 25px 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .modal-header h2 {
    color: white;
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0;
  }
  
  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s ease;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  .tab-navigation {
    padding: 20px 30px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tab-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 12px 20px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px 8px 0 0;
    transition: all 0.3s ease;
    margin-right: 10px;
  }
  
  .tab-btn.active {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .tab-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .modal-body {
    padding: 30px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .tab-content {
    min-height: 200px;
  }
  
  .services-modal-grid {
    display: grid;
    gap: 20px;
  }
  
  .service-modal-card {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .service-modal-card:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
  
  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    gap: 15px;
  }
  
  .service-modal-card h4 {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }
  
  .service-price-large {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 1.1rem;
    white-space: nowrap;
  }
  
  .service-description-full {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin: 0 0 15px 0;
    font-size: 1rem;
  }
  
  .service-duration {
    color: #fbbf24;
    font-weight: 600;
    font-size: 0.9rem;
    margin: 0;
  }
  
  .modal-footer {
    padding: 20px 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }

  /* Contact Modal Styles */
  .contact-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .contact-detail-card {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .contact-detail-card:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .contact-detail-card.emergency {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .contact-detail-card.emergency:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .contact-detail-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
  }

  .contact-detail-icon {
    font-size: 32px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .contact-detail-card.emergency .contact-detail-icon {
    background: rgba(239, 68, 68, 0.2);
  }

  .contact-detail-header h4 {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
  }

  .contact-detail-info {
    color: rgba(255, 255, 255, 0.8);
  }

  .contact-main {
    color: white;
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 10px 0;
  }

  .emergency-text {
    color: #ef4444 !important;
    text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
  }

  .contact-secondary {
    font-size: 0.9rem;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  /* Schedule Styles */
  .schedule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .schedule-item:last-child {
    border-bottom: none;
  }

  .schedule-item.closed {
    opacity: 0.6;
  }

  .schedule-day {
    font-weight: 600;
    color: white;
  }

  .schedule-time {
    color: #fbbf24;
    font-weight: 500;
  }

  .schedule-item.closed .schedule-time {
    color: #ef4444;
  }

  /* Doctors Modal Styles */
  .doctors-modal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
  }

  .doctor-modal-card {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .doctor-modal-card:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .doctor-modal-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .doctor-modal-avatar {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .doctor-avatar-icon {
    font-size: 32px;
  }

  .doctor-modal-info {
    flex: 1;
  }

  .doctor-modal-card h4 {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .doctor-status-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .doctor-modal-details {
    margin-bottom: 20px;
  }

  .doctor-detail-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: rgba(255, 255, 255, 0.8);
  }

  .doctor-detail-item:last-child {
    margin-bottom: 0;
  }

  .detail-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .detail-text {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .doctor-specialties {
    margin-top: 15px;
  }

  .doctor-specialties h5 {
    color: white;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 10px 0;
  }

  .specialty-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .specialty-tag {
    background: rgba(79, 70, 229, 0.3);
    color: #a5b4fc;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(79, 70, 229, 0.4);
  }
  
  /* Doctors Section */
  .doctors-section {
    padding: 80px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }
  
  .doctors-header {
    text-align: center;
    margin-bottom: 50px;
  }
  
  .doctors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin: 40px 0;
  }
  
  .doctor-preview-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 25px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .doctor-preview-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
  }
  
  .doctor-avatar {
    margin-bottom: 15px;
  }
  
  .avatar-icon {
    font-size: 48px;
  }
  
  .doctor-info h4 {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  .doctor-email {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin: 0 0 8px 0;
  }
  
  .doctor-status {
    color: #10b981;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .doctors-footer {
    text-align: center;
    margin-top: 40px;
  }
  
  /* Contact Section */
  .contact-section {
    padding: 80px 20px;
    background: rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }
  
  .contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }
  
  .contact-info {
    text-align: left;
  }
  
  .contact-info .section-title {
    text-align: left;
  }
  
  .contact-info .section-subtitle {
    text-align: left;
  }
  
  .contact-quick {
    display: grid;
    gap: 20px;
  }
  
  .quick-contact-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }
  
  .quick-contact-card:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  .contact-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }
  
  .quick-contact-card h4 {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  .quick-contact-card p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-size: 0.9rem;
  }
  
  /* Footer */
  .footer {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    padding: 40px 20px 20px;
    box-sizing: border-box;
  }
  
  .footer-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .footer-brand h3 {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .footer-brand p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9rem;
  }
  
  .footer-links {
    display: flex;
    gap: 30px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  
  .footer-link {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }
  
  .footer-link:hover {
    color: white;
  }
  
  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 20px;
    text-align: center;
  }
  
  .footer-bottom p {
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    font-size: 0.85rem;
  }
  
  /* Buttons */
  .btn-primary,
  .btn-secondary,
  .btn-outline {
    padding: 15px 30px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary {
    background: #4f46e5;
    color: white;
  }
  
  .btn-primary:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
  
  .btn-outline {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
  
  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-2px);
  }
  
  /* Loading and Error States */
  .loading-state,
  .error-state {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .error-state h3 {
    color: white;
    margin: 0 0 10px 0;
    font-size: 1.2rem;
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Modal Responsive Design */
  @media (max-width: 768px) {
    .modal-container {
      margin: 10px;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 20px;
    }
    
    .modal-header h2 {
      font-size: 1.5rem;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-footer {
      padding: 15px 20px;
      flex-direction: column;
      gap: 10px;
    }
    
    .service-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    
    .service-price-large {
      align-self: flex-start;
    }

    /* Contact Modal Mobile */
    .contact-details-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .contact-detail-card {
      padding: 20px;
    }

    .contact-detail-header {
      gap: 12px;
    }

    .contact-detail-icon {
      width: 40px;
      height: 40px;
      font-size: 24px;
    }

    .contact-detail-header h4 {
      font-size: 1.1rem;
    }

    .contact-main {
      font-size: 1.2rem;
    }

    /* Doctors Modal Mobile */
    .doctors-modal-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .doctor-modal-card {
      padding: 20px;
    }

    .doctor-modal-header {
      gap: 12px;
      margin-bottom: 15px;
      padding-bottom: 12px;
    }

    .doctor-modal-avatar {
      width: 50px;
      height: 50px;
    }

    .doctor-avatar-icon {
      font-size: 24px;
    }

    .doctor-modal-card h4 {
      font-size: 1.1rem;
    }

    .specialty-tags {
      flex-direction: column;
      align-items: flex-start;
    }

    .specialty-tag {
      width: fit-content;
    }
  }
  
  /* Responsive Design */
  @media (max-width: 1024px) {
    .hero-content {
      grid-template-columns: 1fr;
      gap: 40px;
      text-align: center;
    }
  
    .hero-actions {
      justify-content: center;
    }
  
    .contact-content {
      grid-template-columns: 1fr;
      gap: 40px;
    }
  
    .contact-info .section-title,
    .contact-info .section-subtitle {
      text-align: center;
    }
  
    .footer-content {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 30px;
    }
  
    .footer-links {
      justify-content: center;
    }
  
    .illustration-circle {
      width: 250px;
      height: 250px;
    }
  
    .illustration-icon {
      font-size: 80px;
    }
  }
  
  @media (max-width: 768px) {
    .hero-section {
      padding: 40px 15px 30px;
    }
  
    .features-section,
    .services-section,
    .doctors-section,
    .contact-section {
      padding: 60px 15px;
    }
  
    .hero-actions {
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }
  
    .btn-primary,
    .btn-secondary,
    .btn-outline {
      width: 100%;
      max-width: 280px;
      justify-content: center;
    }
  
    .footer-links {
      flex-direction: column;
      gap: 15px;
    }
  
    .illustration-circle {
      width: 200px;
      height: 200px;
    }
  
    .illustration-icon {
      font-size: 60px;
    }
  
    .doctors-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  
    .features-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
  
  @media (max-width: 480px) {
    .hero-section {
      padding: 30px 10px 20px;
    }
  
    .features-section,
    .services-section,
    .doctors-section,
    .contact-section {
      padding: 40px 10px;
    }
  
    .container {
      padding: 0 15px;
    }
  
    .hero-title {
      font-size: 2rem;
    }
  
    .hero-subtitle {
      font-size: 1rem;
    }
  
    .section-title {
      font-size: 1.8rem;
    }
  
    .illustration-circle {
      width: 180px;
      height: 180px;
    }
  
    .illustration-icon {
      font-size: 50px;
    }
  }
  </style>