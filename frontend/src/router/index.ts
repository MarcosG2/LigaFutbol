import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { haySesionActiva } from '../api/sesion'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'inicio', component: () => import('../views/HomeView.vue') },
  { path: '/fixture', name: 'fixture', component: () => import('../views/FixtureView.vue') },
  { path: '/tabla', name: 'tabla', component: () => import('../views/TablaView.vue') },
  { path: '/playoffs', redirect: { name: 'tabla' } },
  { path: '/equipos', name: 'equipos', component: () => import('../views/EquiposView.vue') },
  {
    path: '/inscribir-equipo',
    name: 'inscribir-equipo',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/administradores/login',
    name: 'login-administradores',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin-inicio',
        component: () => import('../views/admin/DashboardAdmin.vue'),
      },
      {
        path: 'equipos',
        name: 'admin-equipos',
        component: () => import('../views/admin/EquiposAdmin.vue'),
      },
      {
        path: 'partidos',
        name: 'admin-partidos',
        component: () => import('../views/admin/PartidosAdmin.vue'),
      },
      {
        path: 'tabla',
        name: 'admin-tabla',
        component: () => import('../views/admin/TablaAdmin.vue'),
      },
      {
        path: 'torneo',
        name: 'admin-torneo',
        component: () => import('../views/admin/TorneoAdmin.vue'),
      },
      {
        path: ':seccion',
        name: 'admin-seccion',
        component: () => import('../views/PlaceholderView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.path === '/login' || to.path === '/administradores/login') {
    return haySesionActiva() ? '/admin' : true
  }

  const requiereAuth = to.matched.some((registro) => registro.meta.requiresAuth === true)
  if (!requiereAuth) return true

  if (haySesionActiva()) return true

  return {
    path: '/login',
    query: { redirect: to.fullPath },
  }
})

export default router
