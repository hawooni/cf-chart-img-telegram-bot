import { authentication as AUTH } from '../../config'

export const sendPhoto = (payload) => postPayload('sendPhoto', payload)
export const sendMessage = (payload) => postJsonPayload('sendMessage', payload)

/**
 * @param {Integer|String} chatId
 * @param {String} actionType
 * @returns {Promise}
 */
export const sendChatAction = (chatId, actionType) => {
  return postJsonPayload('sendChatAction', {
    chat_id: chatId,
    action: actionType,
  })
}

/**
 * @param {String|Integer} chatId
 * @param {Blob} attachPhoto
 * @param {Object} optParam
 * @returns {Promise}
 */
export const sendAttachPhoto = (chatId, attachPhoto, optParam = {}) => {
  const formData = new FormData()

  formData.append('chat_id', chatId)
  formData.append('photo', attachPhoto)

  Object.keys(optParam).forEach((key) => {
    formData.append(key, optParam[key])
  })

  return postPayload('sendPhoto', formData)
}

/**
 * @param {String} mediaType eg. photo, ...
 * @param {Blob} mediaAttach eg. new Blob([media], { type: 'application/octet-stream' })
 * @param {Object} optParam eg. { chat_id: 1234, message_id: 1234, ... }
 * @param {Promise}
 */
export const editAttachMessageMedia = (mediaType, mediaAttach, optParam = {}, optMedia = {}) => {
  const formData = new FormData()
  const attachName = '0'
  const media = {
    type: mediaType,
    media: `attach://${attachName}`,
  }

  Object.keys(optParam).forEach((key) => {
    formData.append(key, optParam[key])
  })

  Object.keys(optMedia).forEach((key) => {
    media[key] = optMedia[key]
  })

  formData.append(attachName, mediaAttach)
  formData.append('media', JSON.stringify(media))

  return postPayload(`editMessageMedia`, formData)
}

/**
 * @param {String} cbQueryId
 * @param {Object} optParam
 * @returns {Promise}
 */
export const answerCallbackQuery = (cbQueryId, optParam = {}) => {
  const payload = {
    callback_query_id: cbQueryId,
  }

  Object.keys(optParam).forEach((key) => {
    payload[key] = optParam[key]
  })

  return postJsonPayload('answerCallbackQuery', payload)
}

/**
 * @param {Object[]} commands
 * @param {Object} optParam
 * @returns {Promise}
 */
export const setMyCommands = (commands, optParam = {}) => {
  const payload = {
    commands: JSON.stringify(commands),
  }

  Object.keys(optParam).forEach((key) => {
    payload[key] = optParam[key]
  })

  return postJsonPayload('setMyCommands', payload)
}

/**
 * @param {String} method
 * @param {FormData|String} payload
 * @param {Object|undefined} headers
 * @returns {Promise}
 */
function postPayload(method, payload, headers) {
  return fetch(`https://api.telegram.org/bot${AUTH.telegramApiToken}/${method}`, {
    method: 'POST',
    body: payload,
    headers: headers,
  })
}

/**
 * @param {String} method
 * @param {Object} payload
 * @returns {Promise}
 */
function postJsonPayload(method, payload) {
  return postPayload(method, JSON.stringify(payload), {
    'content-type': 'application/json',
  })
}
