import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'
import Onboarding from '@/views/Onboarding.vue'
import StepProfile from '@/views/StepProfile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Onboarding
    }
   ,
    {
      path: '/onboarding-profile',
      name: 'onboarding-profile',
      component: StepProfile
    }
   
  ]
})

export default router
