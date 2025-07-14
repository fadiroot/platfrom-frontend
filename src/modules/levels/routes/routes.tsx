/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import GuestGuard from '@src/modules/shared/guards/GuestGuard'

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
    guard: GuestGuard,
    path: '/levels',
    component: lazy(() => import('../features/LevelsList/LevelsList')),
  },
  {
    exact: true,
    guard: GuestGuard,
    path: '/levels/create',
    component: lazy(() => import('../features/CreateLevel/CreateLevel')),
  }
]

export default routes 