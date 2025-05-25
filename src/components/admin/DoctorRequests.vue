<template>
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>🏥 Gestionare Cereri Doctori</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
  
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă cererile...</p>
          </div>
  
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Eroare la încărcarea cererilor</h3>
            <p>{{ error }}</p>
            <button @click="loadRequests" class="btn-primary">Încearcă din nou</button>
          </div>
  
          <div v-else-if="requests.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Nu există cereri în așteptare</h3>
            <p>Toate cererile doctorilor au fost procesate.</p>
          </div>
  
          <div v-else class="requests-list">
            <div class="requests-header">
              <h3>Cereri în așteptare: {{ requests.length }}</h3>
              <button @click="loadRequests" class="refresh-btn">🔄 Actualizează</button>
            </div>
  
            <div 
              v-for="request in requests" 
              :key="request.id"
              class="request-card"
            >
              <div class="request-info">
                <div class="doctor-details">
                  <h4>{{ request.nume_complet }}</h4>
                  <div class="detail-row">
                    <span class="label">📧 Email:</span>
                    <span class="value">{{ request.email }}</span>
                  </div>
                  <div class="detail-row" v-if="request.telefon">
                    <span class="label">📞 Telefon:</span>
                    <span class="value">{{ request.telefon }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📅 Cerere trimisă:</span>
                    <span class="value">{{ formatDate(request.created_at) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">⏰ Status:</span>
                    <span class="status-badge waiting">{{ getStatusText(request.status) }}</span>
                  </div>
                </div>
              </div>
  
              <div class="request-actions">
                <button 
                  @click="approveRequest(request)"
                  :disabled="processingRequests.includes(request.id)"
                  class="btn-approve"
                >
                  {{ processingRequests.includes(request.id) ? 'Se procesează...' : '✅ Aprobă' }}
                </button>
                
                <button 
                  @click="rejectRequest(request)"
                  :disabled="processingRequests.includes(request.id)"
                  class="btn-reject"
                >
                  {{ processingRequests.includes(request.id) ? 'Se procesează...' : '❌ Respinge' }}
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="btn-secondary">
            Închide
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { supabase } from '@/lib/supabase.js'
  
  export default {
    name: 'DoctorRequests',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'request-updated'],
    data() {
      return {
        requests: [],
        loading: false,
        error: null,
        processingRequests: [] // Array cu ID-urile cererilor în curs de procesare
      }
    },
    watch: {
      show(newVal) {
        if (newVal) {
          this.loadRequests()
        }
      }
    },
    methods: {
      async loadRequests() {
        this.loading = true
        this.error = null
  
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('rol', 'doctor')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false })
  
          if (error) throw error
  
          this.requests = data || []
        } catch (error) {
          console.error('Error loading doctor requests:', error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },
  
      async approveRequest(request) {
        if (this.processingRequests.includes(request.id)) return
  
        this.processingRequests.push(request.id)
  
        try {
          // Schimbă status-ul din 'waiting' în NULL (aprobat)
          const { error } = await supabase
            .from('user_profiles')
            .update({ 
              status: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', request.id)
  
          if (error) throw error
  
          // Elimină cererea din lista locală
          this.requests = this.requests.filter(r => r.id !== request.id)
          
          // Notifică parent-ul pentru actualizarea counter-ului
          this.$emit('request-updated')
  
        } catch (error) {
          console.error('Error approving request:', error)
          alert('Eroare la aprobarea cererii: ' + error.message)
        } finally {
          // Elimină din lista de procesare
          this.processingRequests = this.processingRequests.filter(id => id !== request.id)
        }
      },
  
      async rejectRequest(request) {
        if (this.processingRequests.includes(request.id)) return
  
        // Confirmarea pentru respingere
        const confirmReject = confirm(
          `Sunteți sigur că doriți să respingeți cererea doctorului ${request.nume_complet}?\n\n` +
          'Această acțiune va bloca accesul utilizatorului la platformă.'
        )
  
        if (!confirmReject) return
  
        this.processingRequests.push(request.id)
  
        try {
          // Schimbă status-ul din 'waiting' în 'rejected'
          const { error } = await supabase
            .from('user_profiles')
            .update({ 
              status: 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', request.id)
  
          if (error) throw error
  
          // Elimină cererea din lista locală
          this.requests = this.requests.filter(r => r.id !== request.id)
          
          // Notifică parent-ul pentru actualizarea counter-ului
          this.$emit('request-updated')
  
        } catch (error) {
          console.error('Error rejecting request:', error)
          alert('Eroare la respingerea cererii: ' + error.message)
        } finally {
          // Elimină din lista de procesare
          this.processingRequests = this.processingRequests.filter(id => id !== request.id)
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
  
      getStatusText(status) {
        const statusMap = {
          'waiting': 'În așteptare',
          'rejected': 'Respins',
          null: 'Aprobat'
        }
        return statusMap[status] || 'Necunoscut'
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
    border-top: 4px solid #9C27B0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  .error-icon,
  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .requests-list {
    padding: 30px;
  }
  
  .requests-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f3f4f6;
  }
  
  .requests-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
  }
  
  .refresh-btn {
    padding: 8px 16px;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .refresh-btn:hover {
    background: #e5e7eb;
  }
  
  .request-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    transition: all 0.3s ease;
  }
  
  .request-card:hover {
    border-color: #9C27B0;
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.1);
  }
  
  .request-info {
    flex: 1;
  }
  
  .doctor-details h4 {
    margin: 0 0 15px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }
  
  .detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 10px;
  }
  
  .label {
    font-weight: 500;
    color: #475569;
    min-width: 100px;
  }
  
  .value {
    color: #334155;
  }
  
  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-badge.waiting {
    background: #fef3c7;
    color: #92400e;
  }
  
  .request-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 140px;
  }
  
  .btn-approve,
  .btn-reject {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    min-width: 120px;
  }
  
  .btn-approve {
    background: #10b981;
    color: white;
  }
  
  .btn-approve:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .btn-reject {
    background: #ef4444;
    color: white;
  }
  
  .btn-reject:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  .btn-approve:disabled,
  .btn-reject:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
  
  .btn-secondary:hover {
    background: #4b5563;
  }
  
  .btn-primary {
    background: #9C27B0;
    color: white;
  }
  
  .btn-primary:hover {
    background: #7B1FA2;
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
  
    .request-card {
      flex-direction: column;
      align-items: stretch;
    }
  
    .request-actions {
      flex-direction: row;
      justify-content: space-between;
    }
  
    .requests-header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }
  }
  </style>