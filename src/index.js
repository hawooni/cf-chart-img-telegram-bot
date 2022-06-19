import { Router } from 'itty-router'
import { resJson } from './helper/response'

import webhookTelegram from './controller/webhook'

const router = Router()

router.post('/webhook/telegram', webhookTelegram)

router.all('/*', () => resJson({ message: 'Route not found!' }, 404))

addEventListener('fetch', (event) => {
  event.respondWith(router.handle(event.request))
})
