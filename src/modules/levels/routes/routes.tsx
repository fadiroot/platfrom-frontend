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
  // AuthGuard Routes
  {
    exact: true,
    guard: AuthGuard,
    path: '/levels',
    component: lazy(() => import('../features/LevelsList/LevelsList')),
  },
  {
    exact: true,
    guard: AuthGuard,
    path: '/levels/create',
    component: lazy(() => import('../features/CreateLevel/CreateLevel')),
  },
  {
    exact: true,
    guard: AuthGuard,
    path: '/levels/:levelId/chapters',
    component: lazy(() => import('../../chapters/features/chaptersList/chaptersList')),
  },
  {
    exact: true,
    guard: AuthGuard,
    path: '/levels/:levelId/subjects',
    component: lazy(() => import('../../subjects/features/subjectList/subjectList')),
  },
]

export default routes 