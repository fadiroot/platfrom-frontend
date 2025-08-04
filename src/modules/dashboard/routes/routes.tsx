import { Fragment, lazy } from 'react'
import { RouteProps } from 'react-router-dom'
import AuthGuard from '@/modules/shared/guards/AuthGuard'
import AdminLayout from '@/modules/shared/layout/AdminLayout/AdminLayout'

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment
  layout?: React.ComponentType<any> | typeof Fragment
} & RouteProps

const routes: RouteConfig[] = [
  // Admin Dashboard
  {
    exact: true,
    path: '/admin',
    guard: AuthGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/Test')),
  },
  {
    exact: true,
    path: '/admin/levels',
    guard: AuthGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/LevelManagement')),
  },
  {
    exact: true,
    path: '/admin/subjects',
    guard: AuthGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/SubjectManagement')),
  },
  {
    exact: true,
    path: '/admin/chapters',
    guard: AuthGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/ChapterManagement')),
  },
  {
    exact: true,
    path: '/admin/exercises',
    guard: AuthGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/ExerciseManagement')),
  },
]

export default routes