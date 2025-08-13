import { Fragment, lazy } from 'react'
import { RouteProps } from 'react-router-dom'
import AuthGuard from '@/modules/shared/guards/AuthGuard'
import AdminGuard from '@/modules/shared/guards/AdminGuard'
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
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/Test')),
  },
  {
    exact: true,
    path: '/admin/levels',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/LevelManagement')),
  },
  {
    exact: true,
    path: '/admin/subjects',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/SubjectManagement')),
  },
  {
    exact: true,
    path: '/admin/chapters',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/ChapterManagement')),
  },
  {
    exact: true,
    path: '/admin/exercises',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/ExerciseManagement')),
  },
  {
    exact: true,
    path: '/admin/users',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/UserManagement')),
  },
  {
    exact: true,
    path: '/admin/students',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/StudentManagement/StudentManagement')),
  },
  {
    exact: true,
    path: '/admin/exercise-visibility',
    guard: AdminGuard,
    layout: AdminLayout,
    component: lazy(() => import('../features/ExerciseVisibilityManagement/ExerciseVisibilityManagement')),
  },
]

export default routes