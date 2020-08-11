import { Router } from 'express'
import ClassesController from './database/controllers/ClassesController'
import ConnectionsController from './database/controllers/ConnectionsController'

const routes = Router()

routes.get('/classes', ClassesController.index)
routes.post('/classes', ClassesController.create)

routes.get('/connections', ConnectionsController.index)
routes.post('/connections', ConnectionsController.create)

export default routes