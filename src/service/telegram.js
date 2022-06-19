import { debug, price as configPrice, message as configMessage } from '../../config'
import { getTradingViewMiniChart as getPricePhoto } from '../helper/chartimg'
import {
  sendMessage,
  sendChatAction,
  sendAttachPhoto,
  editAttachMessageMedia,
  answerCallbackQuery,
} from '../helper/telegram.js'

const CB_TYPE_PRICE = 'PRICE'
const CB_TYPE_PRICE_SYMBOLS = 'PRICE_SYMBOLS'

/**
 * Telegram webhook payload
 */
export default (payload) => {
  const { message, my_chat_member, channel_post, callback_query } = payload

  return Promise.resolve().then(() => {
    if (message) {
      const { chat, text } = message

      if (chat.type === 'private') {
        debug && console.debug(`:: debug :: process private chat ${chat.first_name} text`)
        return procCommand(chat.id, text, true)
      } else if (chat.type === 'group' && text) {
        debug && console.debug(`:: debug :: process group chat ${chat.title} text`)
        return procCommand(chat.id, text)
      }
    } else if (my_chat_member) {
      const { chat, new_chat_member } = my_chat_member

      if (chat.type === 'group') {
        if (new_chat_member.status === 'member') {
          debug && console.debug(':: debug :: add bot to the group')
          return sendMessageStart(chat.id)
        } else {
          debug && console.debug(':: debug :: remove bot from the group')
        }
      } else if (chat.type === 'channel') {
        if (new_chat_member.status === 'administrator') {
          debug && console.debug(':: debug :: add bot to the channel')
          return sendMessageStart(chat.id)
        } else {
          debug && console.debug(':: debug :: remove bot from the channel')
        }
      }
    } else if (channel_post) {
      const { chat, text } = channel_post
      debug && console.debug(`:: debug :: process channel ${chat.title} chat text`)
      return procCommand(chat.id, text)
    } else if (callback_query) {
      return procCallbackQuery(callback_query)
    }
  })
}

/**
 * @param {Number|String} chatId
 * @param {String} text
 * @param {Boolean} isPrivate
 * @returns {Promise}
 */
function procCommand(chatId, text, isPrivate = false) {
  debug && console.debug(`:: debug :: procCommand(${chatId}, ${text}, ${isPrivate})`)

  if (text === '/start') {
    return sendMessageStart(chatId)
  } else if (text.startsWith('/example')) {
    return sendMessageExample(chatId)
  } else if (text === '/price') {
    return sendPhotoPrice(chatId, getPriceChartQueryByText(text), true)
  } else if (text.startsWith('/price')) {
    return sendPhotoPrice(chatId, getPriceChartQueryByText(text))
  } else if (isPrivate) {
    return sendMessageError(chatId, 422) // invalid command
  }
}

/**
 * @param {Object} payload
 */
async function procCallbackQuery(payload) {
  debug && console.debug(':: debug :: procCallbackQuery(payload)')
  const { id, message, data } = payload
  const { message_id, chat } = message
  const [type, symbol, interval] = data.split('|')

  if (type.startsWith(CB_TYPE_PRICE)) {
    debug && console.debug(`:: debug :: process callback query type ${type}`)

    const query = getPriceChartQuery({ symbol: symbol, interval: interval })
    const resPhoto = await getPricePhoto(query)

    if (resPhoto.status === 200) {
      const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })
      const relayMarkup = getSendPhotoPriceRelayMarkup(query, type === CB_TYPE_PRICE_SYMBOLS)
      const resEdit = await editAttachMessageMedia(
        'photo',
        attachPhoto,
        {
          chat_id: chat.id,
          message_id: message_id,
          reply_markup: JSON.stringify(relayMarkup),
        },
        {
          caption: getSendPhotoPriceCaption(query),
        }
      )

      if (resEdit.status !== 200) {
        await sendMessageError(chat.id, resEdit.status, null, await resEdit.json())
      }
    } else {
      await sendMessageError(chat.id, resPhoto.status, null, await resPhoto.json())
    }
  } else {
    debug && console.debug(`:: debug :: unknown callback query type ${type}`)
  }

  await answerCallbackQuery(id)
}

/**
 * @param {Integeer|String} chatId
 * @param {Object} query
 * @param {Booealn} includeMarkupSymbols
 * @returns {Promise}
 */
async function sendPhotoPrice(chatId, query = {}, includeMarkupSymbols = false) {
  debug && console.debug(`:: debug :: sendPhotoPrice(${chatId}, ${JSON.stringify(query)}), ${includeMarkupSymbols}`)
  const [resPhoto] = await Promise.all([getPricePhoto(query), sendChatAction(chatId, 'upload_photo')])

  if (resPhoto.status === 200) {
    const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })
    const relayMarkup = getSendPhotoPriceRelayMarkup(query, includeMarkupSymbols)
    const resSend = await sendAttachPhoto(chatId, attachPhoto, {
      caption: getSendPhotoPriceCaption(query),
      reply_markup: JSON.stringify(relayMarkup),
    })

    if (resSend.status !== 200) {
      return sendMessageError(chatId, resSend.status, null, await resSend.json())
    }
  } else {
    const resPhotoData = await resPhoto.json()

    if (resPhoto.status === 422 && resPhotoData.error) {
      return sendMessageError(chatId, resPhoto.status, resPhotoData.error) // invalid symbol
    } else {
      return sendMessageError(chatId, resPhoto.status, null, resPhotoData)
    }
  }
}

/**
 * @param {Integer|String} chatId
 * @returns {Promise}
 */
async function sendMessageStart(chatId) {
  debug && console.debug(`:: debug :: sendMessageStart(${chatId})`)

  const resSend = await sendMessage({
    chat_id: chatId,
    parse_mode: 'HTML',
    text: configMessage.start,
  })

  if (resSend.status !== 200) {
    return sendMessageError(chatId, resSend.status, null, await resSend.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @returns {Promise}
 */
async function sendMessageExample(chatId) {
  debug && console.debug(`:: debug :: sendMessageExample(${chatId})`)

  const resSend = await sendMessage({
    chat_id: chatId,
    parse_mode: 'HTML',
    text: configMessage.example,
  })

  if (resSend.status !== 200) {
    return sendMessageError(chatId, resSend.status, null, await resSend.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @param {Integer} status
 * @param {String|null} message
 * @param {Object|null} data
 * @returns {Promise}
 */
function sendMessageError(chatId, status, message = null, data = null) {
  console.error(`sendMessageError(${chatId}, ${status}, ${message}, data)`)
  data && console.error(JSON.stringify(data))

  if (status === 422) {
    return sendMessage({
      chat_id: chatId,
      text: message || configMessage.invalid,
    })
  } else if (status === 429) {
    return sendMessage({
      chat_id: chatId,
      text: message || configMessage.rateLimit,
    })
  } else {
    return sendMessage({
      chat_id: chatId,
      text: message || configMessage.error,
    })
  }
}

/**
 * @param {String} text
 * @returns {Object}
 */
function getPriceChartQueryByText(text) {
  debug && console.debug(`:: debug :: getPriceChartQueryByText() :: ${text}`)

  const [cmd, symbol, interval] = text.split(' ')
  const textQuery = {}

  if (symbol) {
    textQuery.symbol = symbol
  }
  if (interval) {
    textQuery.interval = interval
  }
  return getPriceChartQuery(textQuery)
}

/**
 * @param {Object} query
 * @returns {Object}
 */
function getPriceChartQuery(query) {
  return Object.assign(
    {}, // deep copy default query
    configPrice.default,
    query
  )
}

/**
 * price chart image caption
 * eg. BTCUSD 1M
 *
 * @param {Object} query
 * @returns {String}
 */
function getSendPhotoPriceCaption(query) {
  return `${query.symbol.toUpperCase()} ${query.interval}`
}

/**
 * @param {Object} query eg. { symbol: ..., interval: ... }
 * @param {Boolean} includeSymbols
 * @returns {Object[]}
 */
function getSendPhotoPriceRelayMarkup(query, includeSymbols = false) {
  const cbType = includeSymbols ? CB_TYPE_PRICE_SYMBOLS : CB_TYPE_PRICE
  const intervals = getInlineKeyboardIntervals(cbType, configPrice.intervals, query)

  if (includeSymbols) {
    const symbols = configPrice.inputs.map((input) =>
      input.map((cQuery) => {
        return {
          text: cQuery.text,
          callback_data: `${cbType}|${cQuery.symbol}|${query.interval}|${Date.now()}`,
        }
      })
    )
    return {
      inline_keyboard: [intervals, ...symbols],
    }
  }

  return {
    inline_keyboard: [intervals],
  }
}

/**
 * @param {String} cbType
 * @param {String[]} intervals
 * @param {Object} query
 * @returns {Object[]} eg. [{text: '1d', callback_data: '{...}'}, ...]
 */
function getInlineKeyboardIntervals(cbType, intervals, query) {
  return intervals.map((interval) => {
    return {
      text: interval,
      callback_data: `${cbType}|${query.symbol}|${interval}|${Date.now()}`,
    }
  })
}
