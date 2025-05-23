import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

// Import pages
import AuthPage from '@/views/auth/AuthPage.vue'
import PatientDashboard from '@/views/patient/PatientDashboard.vue'
import DoctorDashboard from '@/views/doctor/DoctorDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/auth'
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage,
      meta: { requiresGuest: true }
    },
    {
      path: '/patient/dashboard',
      name: 'patient-dashboard',
      component: PatientDashboard,
      meta: { requiresAuth: true, role: 'patient' }
    },
    {
      path: '/doctor/dashboard',
      name: 'doctor-dashboard',
      component: DoctorDashboard,
      meta: { requiresAuth: true, role: 'doctor' }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inițializează store-ul dacă nu este deja inițializat
  if (!authStore.user && !authStore.loading) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiredRole = to.meta.role

  if (requiresAuth && !authStore.isLoggedIn) {
    next('/auth')
  } else if (requiresGuest && authStore.isLoggedIn) {
    // Redirecționează utilizatorul logat la dashboard-ul corespunzător
    if (authStore.isPatient) {
      next('/patient/dashboard')
    } else if (authStore.isDoctor) {
      next('/doctor/dashboard')
    }
  } else if (requiredRole && authStore.userProfile?.rol !== requiredRole) {
    // Utilizatorul nu are rolul necesar
    next('/auth')
  } else {
    next()
  }
})

export default router