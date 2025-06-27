import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

// Import pages - CORRECTED PATHS
import LandingPage from '@/views/landing/LandingPage.vue'  // Main landing page
import AuthPage from '@/views/auth/AuthPage.vue'
import PatientDashboard from '@/views/patient/PatientDashboard.vue'
import DoctorDashboard from '@/views/doctor/DoctorDashboard.vue'
import AdminDashboard from '@/views/admin/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/landing'  // Redirect root to landing page
    },
    {
      path: '/landing',
      name: 'home',
      component: LandingPage,
      meta: { public: true }
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
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true, role: 'admin' }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
   
  // Initialize store if not already initialized
  if (!authStore.user && !authStore.loading) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const isPublic = to.matched.some(record => record.meta.public)
  const requiredRole = to.meta.role

  // If user is authenticated and tries to access landing page, redirect to dashboard
  if (to.path === '/landing' && authStore.isLoggedIn) {
    if (authStore.userProfile?.rol === 'admin') {
      next('/admin/dashboard')
      return
    } else if (authStore.isPatient) {
      next('/patient/dashboard')
      return
    } else if (authStore.isDoctor) {
      next('/doctor/dashboard')
      return
    }
  }

  // Public routes (like landing page) - allow everyone
  if (isPublic) {
    next()
    return
  }

  // Protected routes - require authentication
  if (requiresAuth && !authStore.isLoggedIn) {
    next('/auth')
    return
  }

  // Guest only routes (like auth page) - redirect logged in users
  if (requiresGuest && authStore.isLoggedIn) {
    // Redirect to appropriate dashboard
    if (authStore.userProfile?.rol === 'admin') {
      next('/admin/dashboard')
    } else if (authStore.isPatient) {
      next('/patient/dashboard')
    } else if (authStore.isDoctor) {
      next('/doctor/dashboard')
    } else {
      next('/auth')
    }
    return
  }

  // Role-based access control
  if (requiredRole && authStore.userProfile?.rol !== requiredRole) {
    // Redirect to appropriate dashboard or auth
    if (authStore.userProfile?.rol === 'admin') {
      next('/admin/dashboard')
    } else if (authStore.isPatient) {
      next('/patient/dashboard')
    } else if (authStore.isDoctor) {
      next('/doctor/dashboard')
    } else {
      next('/auth')
    }
    return
  }

  next()
})

export default router