import { debug, price as PRICE, chart as CHART, message as MESSAGE } from '../../config'
import {
  getTradingViewMiniChart as getPricePhoto,
  getTradingViewAdvancedChart as getChartPhoto,
} from '../helper/chartimg'
import {
  sendMessage,
  sendChatAction,
  sendAttachPhoto,
  editAttachMessageMedia,
  answerCallbackQuery,
} from '../helper/telegram.js'

const CB_TYPE_PRICE = 'P'
const CB_TYPE_PRICE_SYMBOLS = 'PS'
const CB_TYPE_CHART = 'C'
const CB_TYPE_CHART_SYMBOLS = 'CS'

const CB_DATA_TIMESTAMP_SLICE = -4 // cut to last 4 digit to reduce the data length and unique
const CHART_STUDIES_SEPARATOR = ';' // eg. RSI;MACD;EMA:200

/**
 * Telegram webhook payload
 */
export default (payload) => {
  const { message, my_chat_member, channel_post, callback_query } = payload

  return Promise.resolve().then(() => {
    if (message) {
      const { chat, text } = message

      if (chat.type === 'private' && text) {
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

      if (text) {
        debug && console.debug(`:: debug :: process channel ${chat.title} chat text`)
        return procCommand(chat.id, text)
      }
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
    return sendPhotoPrice(chatId, getPriceQueryByText(text), true)
  } else if (text.startsWith('/price')) {
    return sendPhotoPrice(chatId, getPriceQueryByText(text))
  } else if (text === '/chart') {
    return sendPhotoChart(chatId, getChartQueryByText(text), true)
  } else if (text.startsWith('/chart')) {
    return sendPhotoChart(chatId, getChartQueryByText(text))
  } else if (isPrivate) {
    return sendMessageError(chatId, 422) // invalid command for private message
  }
}

/**
 * @param {Object} payload
 */
async function procCallbackQuery(payload) {
  debug && console.debug(':: debug :: procCallbackQuery(payload)')

  const { id, message, data } = payload
  const { message_id, chat } = message
  const [type] = data.split('|')

  debug && console.debug(`:: debug :: process callback query type ${type}`)

  if (type.startsWith(CB_TYPE_PRICE)) {
    const query = getPriceQueryByCallbackData(data)
    const resPhoto = await getPricePhoto(query)

    if (resPhoto.status === 200) {
      const caption = getSendPhotoPriceCaption(query)
      const relayMarkup = getSendPhotoPriceRelayMarkup(query, type === CB_TYPE_PRICE_SYMBOLS)
      const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })

      await sendPhotoCallback(chat.id, message_id, attachPhoto, caption, relayMarkup)
    } else {
      await sendMessageError(chat.id, resPhoto.status, await resPhoto.json())
    }
  } else if (type.startsWith(CB_TYPE_CHART)) {
    const query = getChartQueryByCallbackData(data)
    const resPhoto = await getChartPhoto(query)

    if (resPhoto.status === 200) {
      const caption = getSendPhotoChartCaption(query)
      const relayMarkup = getSendPhotoChartRelayMarkup(query, type === CB_TYPE_CHART_SYMBOLS)
      const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })

      await sendPhotoCallback(chat.id, message_id, attachPhoto, caption, relayMarkup)
    } else {
      await sendMessageError(chat.id, resPhoto.status, await resPhoto.json())
    }
  } else {
    debug && console.debug(`:: debug :: unknown callback query type ${type}`)
  }

  await answerCallbackQuery(id)
}

/**
 * @param {Integer|String} chatId
 * @param {Object} query
 * @param {Boolean} includeMarkupSymbols
 * @returns {Promise}
 */
async function sendPhotoPrice(chatId, query = {}, includeMarkupSymbols = false) {
  debug && console.debug(`:: debug :: sendPhotoPrice(${chatId}, ${JSON.stringify(query)}), ${includeMarkupSymbols}`)
  const [resPhoto] = await Promise.all([getPricePhoto(query), sendChatAction(chatId, 'upload_photo')])

  if (resPhoto.status === 200) {
    const caption = getSendPhotoPriceCaption(query)
    const relayMarkup = getSendPhotoPriceRelayMarkup(query, includeMarkupSymbols)
    const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })

    return sendPhoto(chatId, attachPhoto, caption, relayMarkup)
  } else {
    return sendMessageError(chatId, resPhoto.status, await resPhoto.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @param {Object} query
 * @param {Boolean} includeMarkupSymbols
 * @returns {Promise}
 */
async function sendPhotoChart(chatId, query = {}, includeMarkupSymbols = false) {
  debug && console.debug(`:: debug :: sendPhotoChart(${chatId}, ${JSON.stringify(query)}), ${includeMarkupSymbols}`)
  const [resPhoto] = await Promise.all([getChartPhoto(query), sendChatAction(chatId, 'upload_photo')])

  if (resPhoto.status === 200) {
    const caption = getSendPhotoChartCaption(query)
    const relayMarkup = getSendPhotoChartRelayMarkup(query, includeMarkupSymbols)
    const attachPhoto = new Blob([await resPhoto.arrayBuffer()], { type: 'application/octet-stream' })

    return sendPhoto(chatId, attachPhoto, caption, relayMarkup)
  } else {
    return sendMessageError(chatId, resPhoto.status, await resPhoto.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @param {Blob} attachPhoto
 * @param {String} caption
 * @param {Object|null} relayMarkup
 * @returns {Promise}
 */
async function sendPhoto(chatId, attachPhoto, caption, relayMarkup = null) {
  const param = {
    caption: caption,
  }

  if (relayMarkup) {
    param.reply_markup = JSON.stringify(relayMarkup)
  }

  const resSend = await sendAttachPhoto(chatId, attachPhoto, param)

  if (resSend.status !== 200) {
    return sendMessageError(chatId, resSend.status, await resSend.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @param {Integer} msgId
 * @param {Blob} attachPhoto
 * @param {String} caption
 * @param {Object|null} relayMarkup
 * @return {Promise}
 */
async function sendPhotoCallback(chatId, msgId, attachPhoto, caption, relayMarkup = null) {
  const param = {
    chat_id: chatId,
    message_id: msgId,
  }

  if (relayMarkup) {
    param.reply_markup = JSON.stringify(relayMarkup)
  }

  const resEdit = await editAttachMessageMedia('photo', attachPhoto, param, {
    caption: caption,
  })

  if (resEdit.status !== 200) {
    return sendMessageError(chatId, resEdit.status, await resEdit.json())
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
    text: MESSAGE.start,
  })

  if (resSend.status !== 200) {
    return sendMessageError(chatId, resSend.status, await resSend.json())
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
    text: MESSAGE.example,
  })

  if (resSend.status !== 200) {
    return sendMessageError(chatId, resSend.status, await resSend.json())
  }
}

/**
 * @param {Integer|String} chatId
 * @param {Integer} status
 * @param {Object|null} payload must be JSON
 * @returns {Promise}
 */
function sendMessageError(chatId, status, payload = null) {
  console.error(`sendMessageError(${chatId}, ${status})`)
  payload && console.error(JSON.stringify(payload))

  if (status === 422) {
    return sendMessage({
      chat_id: chatId,
      text: (payload && payload.error) || MESSAGE.invalid,
    })
  } else if (status === 429) {
    return sendMessage({
      chat_id: chatId,
      text: (payload && payload.error) || MESSAGE.rateLimit,
    })
  } else {
    return sendMessage({
      chat_id: chatId,
      text: MESSAGE.error,
    })
  }
}

/**
 * @param {String} text
 * @returns {Object}
 */
function getPriceQueryByText(text) {
  debug && console.debug(`:: debug :: getPriceQueryByText() :: ${text}`)

  const [cmd, symbol, interval] = text.split(' ')
  const textQuery = {}

  if (symbol) {
    textQuery.symbol = symbol.toUpperCase()
  }
  if (interval) {
    textQuery.interval = interval
  }
  return getPriceQuery(textQuery)
}

/**
 * @param {String} text
 * @returns {Object}
 */
function getChartQueryByText(text) {
  debug && console.debug(`:: debug :: getChartQueryByText() :: ${text}`)

  const [cmd, symbol, interval, studies, style] = text.split(' ')
  const textQuery = {}

  if (symbol) {
    textQuery.symbol = symbol.toUpperCase()
  }
  if (interval) {
    textQuery.interval = interval
  }
  if (studies) {
    textQuery.studies = studies.split(CHART_STUDIES_SEPARATOR).map((study) => study.toUpperCase())
  }
  if (style) {
    textQuery.style = style
  }
  return getChartQuery(textQuery)
}

/**
 * @param {String} data
 * @returns {Object}
 */
function getPriceQueryByCallbackData(data) {
  debug && console.debug(`:: debug :: getPriceQueryByCallback() :: ${data}`)
  const [type, symbol, interval] = data.split('|')

  return getPriceQuery({
    symbol: symbol,
    interval: interval,
  })
}

/**
 * @param {String} data
 * @returns {Object}
 */
function getChartQueryByCallbackData(data) {
  debug && console.debug(`:: debug :: getChartQueryByCallback() :: ${data}`)
  const [type, symbol, interval, studies, style] = data.split('|')

  return getChartQuery(
    Object.assign(
      {
        symbol: symbol,
        interval: interval,
      },
      studies ? { studies: studies.split(CHART_STUDIES_SEPARATOR) } : null,
      style ? { style: style } : null
    )
  )
}

/**
 * @param {Object} query
 * @returns {Object}
 */
function getPriceQuery(query) {
  return Object.assign({}, PRICE.default, query)
}

/**
 * @param {Object} query
 * @returns {Object}
 */
function getChartQuery(query) {
  return Object.assign({}, CHART.default, query)
}

/**
 * eg. BTCUSD 1M
 *
 * @param {Object} query
 * @returns {String}
 */
function getSendPhotoPriceCaption(query) {
  return `${query.symbol.toUpperCase()} ${query.interval}`
}

/**
 * eg. BTCUSD MACD;RSI 1h area
 *
 * @param {Object} query
 * @returns {String}
 */
function getSendPhotoChartCaption(query) {
  const { symbol, interval, studies, style } = query
  return `${symbol.toUpperCase()} ${interval} ${studies ? studies.join(CHART_STUDIES_SEPARATOR) : ''} ${style || ''}`
}

/**
 * note: callback_data must be within 64 byte
 *
 * @param {Object} query eg. { symbol: ..., interval: ... }
 * @param {Boolean} includeSymbols
 * @returns {Object[]}
 */
function getSendPhotoPriceRelayMarkup(query, includeSymbols = false) {
  const { symbol: qSymbol, interval: qInterval } = query
  const cbType = includeSymbols ? CB_TYPE_PRICE_SYMBOLS : CB_TYPE_PRICE
  const intervals = PRICE.intervals.map((interval) => {
    return {
      text: interval,
      callback_data: `${cbType}|${qSymbol}|${interval}|${String(Date.now()).slice(CB_DATA_TIMESTAMP_SLICE)}`,
    }
  })

  if (includeSymbols) {
    const symbols = PRICE.inputs.map((input) =>
      input.map((cQuery) => {
        return {
          text: cQuery.text,
          callback_data: `${cbType}|${cQuery.symbol}|${qInterval}|${String(Date.now()).slice(CB_DATA_TIMESTAMP_SLICE)}`,
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
 * note: callback_data must be within 64 byte
 *
 * @param {Object} query
 * @param {Boolean} includeSymbols
 * @returns {Promise[]}
 */
function getSendPhotoChartRelayMarkup(query, includeSymbols = false) {
  const { symbol: qSymbol, studies: qStudies, style: qStyle, interval: qInterval } = query
  const cbType = includeSymbols ? CB_TYPE_CHART_SYMBOLS : CB_TYPE_CHART
  const intervals = CHART.intervals.map((interval) => {
    return {
      text: interval,
      callback_data: `${cbType}|${qSymbol}|${interval}|${qStudies ? qStudies.join(CHART_STUDIES_SEPARATOR) : ''}|${qStyle || ''}|${String(Date.now()).slice(CB_DATA_TIMESTAMP_SLICE)}`, // prettier-ignore
    }
  })

  if (includeSymbols) {
    const symbols = CHART.inputs.map((input) =>
      input.map((sQuery) => {
        const { symbol: sqSymbol, studies: sqStudies, style: sqStyle } = sQuery
        return {
          text: sQuery.text,
          callback_data: `${cbType}|${sqSymbol}|${qInterval}|${sqStudies ? sqStudies.join(CHART_STUDIES_SEPARATOR) : ''}|${sqStyle || ''}|${String(Date.now()).slice(CB_DATA_TIMESTAMP_SLICE)}`, // prettier-ignore
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
