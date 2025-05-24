<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>ℹ️ Detalii Clinică</h2>
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
            <!-- Servicii Tab -->
            <div v-if="activeTab === 'servicii'" class="services-content">
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

              <div v-else class="services-grid">
                <div 
                  v-for="service in services"
                  :key="service.id"
                  class="service-card"
                >
                  <div class="service-header">
                    <h4>{{ service.nume }}</h4>
                    <span class="service-price">{{ formatPrice(service.pret) }}</span>
                  </div>
                  <p class="service-description">{{ service.descriere }}</p>
                  <div v-if="service.durata" class="service-duration">
                    🕐 Durată: {{ service.durata }} minute
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Tab -->
            <div v-if="activeTab === 'contact'" class="contact-content">
              <div v-if="loadingContact" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Se încarcă informațiile de contact...</p>
              </div>

              <div v-else-if="contactError" class="error-state">
                <div class="error-icon">❌</div>
                <h3>Eroare la încărcarea contactelor</h3>
                <p>{{ contactError }}</p>
                <button @click="loadContact" class="btn-primary">Încearcă din nou</button>
              </div>

              <div v-else class="contact-info">
                <div class="contact-section">
                  <h4>📞 Telefon</h4>
                  <div class="contact-items">
                    <div 
                      v-for="phone in contactData.telefoane"
                      :key="phone.numar"
                      class="contact-item"
                    >
                      <a :href="`tel:${phone.numar}`" class="contact-link">
                        {{ phone.numar }}
                        <span v-if="phone.eticheta" class="contact-label">({{ phone.eticheta }})</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div class="contact-section">
                  <h4>✉️ Email</h4>
                  <div class="contact-items">
                    <div 
                      v-for="email in contactData.emails"
                      :key="email.email"
                      class="contact-item"
                    >
                      <a :href="`mailto:${email.email}`" class="contact-link">
                        {{ email.email }}
                        <span v-if="email.eticheta" class="contact-label">({{ email.eticheta }})</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div class="contact-section">
                  <h4>🕐 Program</h4>
                  <div class="schedule-grid">
                    <div 
                      v-for="(schedule, day) in contactData.program"
                      :key="day"
                      class="schedule-item"
                    >
                      <span class="day">{{ day }}:</span>
                      <span class="hours">{{ schedule }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="contactData.website" class="contact-section">
                  <h4>🌐 Website</h4>
                  <div class="contact-items">
                    <div class="contact-item">
                      <a :href="contactData.website" target="_blank" class="contact-link">
                        {{ contactData.website }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Locație Tab -->
            <div v-if="activeTab === 'locatie'" class="location-content">
              <div v-if="loadingLocation" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Se încarcă informațiile despre locație...</p>
              </div>

              <div v-else-if="locationError" class="error-state">
                <div class="error-icon">❌</div>
                <h3>Eroare la încărcarea locației</h3>
                <p>{{ locationError }}</p>
                <button @click="loadLocation" class="btn-primary">Încearcă din nou</button>
              </div>

              <div v-else class="location-info">
                <div class="address-section">
                  <h4>📍 Adresa</h4>
                  <div class="address-card">
                    <p class="address-text">{{ locationData.adresa }}</p>
                    <p v-if="locationData.oras" class="city-text">{{ locationData.oras }}, {{ locationData.judet }}</p>
                    <p v-if="locationData.cod_postal" class="postal-code">{{ locationData.cod_postal }}</p>
                  </div>
                </div>

                <div v-if="locationData.coordonate" class="map-section">
                  <h4>🗺️ Hartă</h4>
                  <div class="map-placeholder">
                    <p>📍 Coordonate: {{ locationData.coordonate.lat }}, {{ locationData.coordonate.lng }}</p>
                    <a 
                      :href="getGoogleMapsLink()"
                      target="_blank"
                      class="btn-primary map-btn"
                    >
                      Vezi pe Google Maps
                    </a>
                  </div>
                </div>

                <div v-if="locationData.transport" class="transport-section">
                  <h4>🚌 Transport Public</h4>
                  <div class="transport-info">
                    <div 
                      v-for="transport in locationData.transport"
                      :key="transport"
                      class="transport-item"
                    >
                      {{ transport }}
                    </div>
                  </div>
                </div>

                <div v-if="locationData.parcare" class="parking-section">
                  <h4>🚗 Parcare</h4>
                  <p class="parking-info">{{ locationData.parcare }}</p>
                </div>
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
    name: 'Detalii',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close'],
    data() {
      return {
        activeTab: 'servicii',
        tabs: [
          { id: 'servicii', label: 'Servicii', icon: '💼' },
          { id: 'contact', label: 'Contact', icon: '📞' },
          { id: 'locatie', label: 'Locație', icon: '📍' }
        ],
        
        // Servicii
        services: [],
        loadingServices: false,
        servicesError: null,
        
        // Contact
        contactData: {},
        loadingContact: false,
        contactError: null,
        
        // Locație
        locationData: {},
        loadingLocation: false,
        locationError: null
      }
    },
    
    watch: {
      show(newVal) {
        if (newVal) {
          this.loadActiveTabData()
        }
      },
      
      activeTab() {
        this.loadActiveTabData()
      }
    },
    
    methods: {
      async loadActiveTabData() {
        switch (this.activeTab) {
          case 'servicii':
            if (this.services.length === 0) {
              await this.loadServices()
            }
            break
          case 'contact':
            if (Object.keys(this.contactData).length === 0) {
              await this.loadContact()
            }
            break
          case 'locatie':
            if (Object.keys(this.locationData).length === 0) {
              await this.loadLocation()
            }
            break
        }
      },

      async loadServices() {
        this.loadingServices = true
        this.servicesError = null

        try {
          const { data: services, error } = await supabase
            .from('servicii')
            .select('*')
            .eq('is_active', true)
            .order('ordine', { ascending: true })

          if (error) throw error

          this.services = services || []
          
        } catch (error) {
          console.error('Error loading services:', error)
          this.servicesError = error.message
        } finally {
          this.loadingServices = false
        }
      },

      async loadContact() {
        this.loadingContact = true
        this.contactError = null

        try {
          const { data: contactItems, error } = await supabase
            .from('contact')
            .select('*')
            .eq('is_active', true)
            .order('ordine', { ascending: true })

          if (error) throw error

          // Organizează datele după tip
          const organizedData = {
            telefoane: [],
            emails: [],
            website: '',
            program: {}
          }

          contactItems.forEach(item => {
            switch (item.tip) {
              case 'telefon':
                organizedData.telefoane.push({
                  numar: item.valoare,
                  eticheta: item.eticheta
                })
                break
              case 'email':
                organizedData.emails.push({
                  email: item.valoare,
                  eticheta: item.eticheta
                })
                break
              case 'website':
                organizedData.website = item.valoare
                break
              case 'program':
                // Extrage ziua din etichetă și ora din valoare
                const ziua = item.eticheta
                const program = item.valoare.split(': ')[1] // ia doar partea cu orele
                organizedData.program[ziua] = program
                break
            }
          })

          this.contactData = organizedData

        } catch (error) {
          console.error('Error loading contact:', error)
          this.contactError = error.message
        } finally {
          this.loadingContact = false
        }
      },

      async loadLocation() {
        this.loadingLocation = true
        this.locationError = null

        try {
          const { data: locationItems, error } = await supabase
            .from('locatie')
            .select('*')
            .eq('is_active', true)
            .order('ordine', { ascending: true })

          if (error) throw error

          // Organizează datele după tip
          const organizedData = {
            adresa: '',
            oras: '',
            judet: '',
            cod_postal: '',
            coordonate: null,
            transport: [],
            parcare: ''
          }

          locationItems.forEach(item => {
            switch (item.tip) {
              case 'adresa':
                organizedData.adresa = item.valoare
                if (item.detalii) {
                  organizedData.oras = item.detalii.oras || ''
                  organizedData.judet = item.detalii.judet || ''
                  organizedData.cod_postal = item.detalii.cod_postal || ''
                }
                break
              case 'coordonate':
                if (item.detalii && item.detalii.lat && item.detalii.lng) {
                  organizedData.coordonate = {
                    lat: item.detalii.lat,
                    lng: item.detalii.lng
                  }
                }
                break
              case 'transport':
                organizedData.transport.push(item.valoare)
                break
              case 'parcare':
                organizedData.parcare = item.valoare
                break
            }
          })

          this.locationData = organizedData

        } catch (error) {
          console.error('Error loading location:', error)
          this.locationError = error.message
        } finally {
          this.loadingLocation = false
        }
      },

      formatPrice(price) {
        return `${price} RON`
      },

      getGoogleMapsLink() {
        if (this.locationData.coordonate) {
          const { lat, lng } = this.locationData.coordonate
          return `https://maps.google.com/?q=${lat},${lng}`
        }
        return '#'
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
    color: #4f46e5;
    background: white;
    border-bottom-color: #4f46e5;
  }

  /* Content Area */
  .tab-content {
    padding: 30px;
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

  /* Servicii Styles */
  .services-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .service-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease;
    background: white;
  }

  .service-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .service-header h4 {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
    flex: 1;
  }

  .service-price {
    background: #4f46e5;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    margin-left: 12px;
  }

  .service-description {
    color: #6b7280;
    line-height: 1.5;
    margin: 0 0 12px 0;
  }

  .service-duration {
    color: #4f46e5;
    font-size: 14px;
    font-weight: 500;
  }

  /* Contact Styles */
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .contact-section h4 {
    margin: 0 0 15px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 2px solid #f3f4f6;
  }

  .contact-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .contact-item {
    padding: 8px 0;
  }

  .contact-link {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .contact-link:hover {
    color: #4338ca;
    text-decoration: underline;
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .schedule-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .day {
    font-weight: 600;
    color: #374151;
  }

  .hours {
    color: #6b7280;
  }

  /* Location Styles */
  .location-info {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .location-info h4 {
    margin: 0 0 15px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 2px solid #f3f4f6;
  }

  .address-card {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  }

  .address-text {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .city-text {
    margin: 0 0 8px 0;
    color: #6b7280;
  }

  .postal-code {
    margin: 0;
    color: #9ca3af;
    font-size: 14px;
  }

  .map-placeholder {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
  }

  .map-btn {
    margin-top: 15px;
    display: inline-block;
    text-decoration: none;
  }

  .transport-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .transport-item {
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  .parking-info {
    padding: 15px 20px;
    background: #f0f9ff;
    border: 2px solid #bae6fd;
    border-radius: 8px;
    color: #0c4a6e;
    line-height: 1.5;
    margin: 0;
  }

  .contact-label {
    font-size: 12px;
    color: #9ca3af;
    font-weight: normal;
    margin-left: 8px;
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
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .modal-container {
      margin: 10px;
      max-width: none;
    }
    
    .tab-content,
    .modal-footer {
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
      border-right-color: #4f46e5;
    }
    
    .services-grid {
      grid-template-columns: 1fr;
    }

    .service-header {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }

    .service-price {
      margin-left: 0;
      text-align: center;
    }

    .schedule-grid {
      grid-template-columns: 1fr;
    }

    .schedule-item {
      flex-direction: column;
      gap: 4px;
    }
  }
  </style>