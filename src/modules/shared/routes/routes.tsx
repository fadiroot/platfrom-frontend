import sharedRoutes from './sharedRoutes'
import authRoutes from '../../auth/routes/routes'
import dashboardRoutes from '../../dashboard/routes/routes'
import subjectRoutes from '../../subjects/routes/routes'
import chapterRoutes from '../../chapters/routes/routes'
import exerciceRoutes from '../../exercices/routes/routes'
import levelRoutes from '../../levels/routes/routes'

const routes = [...sharedRoutes, ...authRoutes, ...dashboardRoutes, ...subjectRoutes, ...chapterRoutes, ...exerciceRoutes, ...levelRoutes]

export default routes
