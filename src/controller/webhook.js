import telegram from '../service/telegram'
import { resJson } from '../helper/response'

export default (req) => {
  if (req.headers.get('Content-Type') !== 'application/json') {
    return resJson({ message: 'Content type must be application/json' }, 400)
  }
  return req
    .json()
    .then((payload) => telegram(payload))
    .then(() => resJson({ message: 'Success' }))
}
