import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userProfile: null,
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isPatient: (state) => state.userProfile?.rol === 'patient',
    isDoctor: (state) => state.userProfile?.rol === 'doctor',
    isAdmin: (state) => state.userProfile?.rol === 'admin'
  },

  actions: {
    // Înregistrare utilizator nou cu debug complet
    async signUp(email, password, numeComplet, rol = 'patient') {
      this.loading = true
      this.error = null

      try {
        console.log('🚀 SIGNUP START:', { email, numeComplet, rol })
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nume_complet: numeComplet,
              rol: rol
            }
          }
        })

        console.log('📊 AUTH RESULT:', {
          hasUser: !!authData?.user,
          hasSession: !!authData?.session,
          userId: authData?.user?.id,
          error: authError?.message
        })

        if (authError) {
          throw authError
        }

        if (authData.user) {
          console.log('👤 USER CREATED:', authData.user.id)
          
          // Așteaptă trigger-ul
          console.log('⏳ Waiting 3 seconds for trigger...')
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Verifică user_profiles
          console.log('🔍 Checking user_profiles...')
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (userProfile) {
            console.log('✅ USER PROFILE FOUND:', userProfile)
            this.userProfile = userProfile
          } else {
            console.log('❌ USER PROFILE NOT FOUND:', userError?.message)
            
            // Încearcă crearea manuală
            console.log('🔧 Creating profile manually...')
            const { data: manualProfile, error: manualError } = await supabase
              .from('user_profiles')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                nume_complet: numeComplet,
                rol: rol
              })
              .select()
              .single()

            if (manualProfile) {
              console.log('✅ MANUAL PROFILE CREATED:', manualProfile)
              this.userProfile = manualProfile
            } else {
              console.log('❌ MANUAL PROFILE FAILED:', manualError?.message)
            }
          }

          // Verifică patient_profiles dacă este pacient
          if (rol === 'patient') {
            console.log('🔍 Checking patient_profiles...')
            const { data: patientProfile, error: patientError } = await supabase
              .from('patient_profiles')
              .select('*')
              .eq('user_id', authData.user.id)
              .single()

            if (patientProfile) {
              console.log('✅ PATIENT PROFILE FOUND:', patientProfile)
            } else {
              console.log('❌ PATIENT PROFILE NOT FOUND:', patientError?.message)
              
              // Creează manual profilul de pacient
              console.log('🔧 Creating patient profile manually...')
              const { data: manualPatient, error: manualPatientError } = await supabase
                .from('patient_profiles')
                .insert({
                  user_id: authData.user.id
                })
                .select()
                .single()

              if (manualPatient) {
                console.log('✅ MANUAL PATIENT PROFILE CREATED:', manualPatient)
              } else {
                console.log('❌ MANUAL PATIENT PROFILE FAILED:', manualPatientError?.message)
              }
            }
          }

          this.user = authData.user
          return { success: true, message: 'Cont creat cu succes!' }
        }

        throw new Error('Nu s-a putut crea utilizatorul')
        
      } catch (error) {
        console.error('💥 SIGNUP ERROR:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Login utilizator cu debug
    async signIn(email, password) {
      this.loading = true
      this.error = null

      try {
        console.log('🔑 LOGIN START:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        if (data.user) {
          console.log('👤 USER LOGGED IN:', data.user.id)
          
          // Așteaptă puțin să se sincronizeze datele
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await this.fetchUserProfile()
          
          // Verifică dacă profilul a fost găsit
          if (!this.userProfile) {
            console.log('⚠️ Profile not found, attempting to create...')
            await this.createMissingProfile(data.user)
          }
        }
        
        return { success: true }
      } catch (error) {
        console.error('💥 LOGIN ERROR:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Creează profilul lipsă pentru utilizatori existenți
    async createMissingProfile(user) {
      try {
        console.log('🔧 Creating missing profile for:', user.id)
        
        // Creează profilul dacă lipsește
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            nume_complet: user.user_metadata?.nume_complet || 'Utilizator',
            rol: user.user_metadata?.rol || 'patient'
          })
          .select()
          .single()

        if (profileError && !profileError.message.includes('duplicate key')) {
          throw profileError
        }

        if (profileData) {
          console.log('✅ Missing profile created:', profileData)
          this.userProfile = profileData
        }

        // Dacă este pacient, creează și profilul de pacient
        if ((user.user_metadata?.rol || 'patient') === 'patient') {
          const { error: patientError } = await supabase
            .from('patient_profiles')
            .insert({
              user_id: user.id
            })

          if (patientError && !patientError.message.includes('duplicate key')) {
            console.error('❌ Patient profile creation failed:', patientError)
          } else {
            console.log('✅ Patient profile created')
          }
        }

        // Reîncarcă profilul
        await this.fetchUserProfile()
      } catch (error) {
        console.error('💥 Error creating missing profile:', error)
      }
    },

    // Logout
    async signOut() {
      console.log('👋 LOGOUT')
      const { error } = await supabase.auth.signOut()
      if (!error) {
        this.user = null
        this.userProfile = null
        console.log('✅ Logout successful')
      }
      return !error
    },

    // Obține profilul utilizatorului
    async fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          this.user = user

          // Încearcă să obții profilul cu retry
          let attempts = 0
          let profile = null
          
          while (attempts < 3 && !profile) {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (!error && data) {
              profile = data
              console.log('✅ Profile fetched:', profile)
            } else if (attempts < 2) {
              console.log(`⏳ Profile fetch attempt ${attempts + 1} failed, retrying...`)
              // Așteaptă puțin înainte de următoarea încercare
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
            
            attempts++
          }

          if (profile) {
            this.userProfile = profile
          } else {
            console.log('❌ Profile not found after 3 attempts')
          }
        }
      } catch (error) {
        console.error('💥 Error fetching profile:', error)
      }
    },

    // Inițializare - verifică dacă utilizatorul este logat
    async initialize() {
      try {
        console.log('🚀 Initializing auth store...')
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('👤 Found existing session for:', session.user.id)
          await this.fetchUserProfile()
        } else {
          console.log('👻 No existing session found')
        }

        // Ascultă schimbările de autentificare
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state changed:', event)
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in')
            await this.fetchUserProfile()
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out')
            this.user = null
            this.userProfile = null
          }
        })
      } catch (error) {
        console.error('💥 Initialization error:', error)
      }
    }
  }
})