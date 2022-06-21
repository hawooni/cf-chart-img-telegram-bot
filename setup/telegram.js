const axios = require('axios')
const { authentication: AUTH, commands } = require('../config')

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

readline.question('Enter published domain name: ', (domain) => {
  readline.close()
  Promise.all([
    postTelegramAPI('setWebhook', {
      url: `https://${domain}/webhook/telegram`,
    }),
    postTelegramAPI('setMyCommands', { commands: commands }),
  ]).catch((error) => {
    console.error(error.response?.data?.description || 'Something went wrong.')
  })
})

/**
 * @param {String} method
 * @param {Object} payload
 * @returns {Promise}
 */
function postTelegramAPI(method, payload) {
  return axios.post(`https://api.telegram.org/bot${AUTH.telegramApiToken}/${method}`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
