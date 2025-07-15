/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import AuthGuard from '../../shared/guards/AuthGuard'

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment | any
  layout?: React.ComponentType<any> | typeof Fragment
} & RouteProps

const routes: RouteConfig[] = [
  // Exercise Routes
  {
    exact: true,
    guard: AuthGuard,
    path: '/subjects/:subjectId/chapters/:chapterId/exercises',
    component: lazy(() => import('../features/exercicesList/exercicesList')),
  }
]

export default routes