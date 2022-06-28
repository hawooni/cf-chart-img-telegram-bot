import axios from 'axios'
import inquirer from 'inquirer'
import config from '../config.json' assert { type: 'json' }

const { authentication: AUTH, commands } = config

console.log('\n')

inquirer
  .prompt([
    {
      type: 'input',
      name: 'domain',
      message: `Enter published domain name :`,
    },
  ])
  .then((answer) => {
    return Promise.all([
      postTelegramAPI('setWebhook', {
        url: `https://${answer.domain}/webhook/telegram`,
      }),
      postTelegramAPI('setMyCommands', { commands: commands }),
    ])
  })
  .catch((error) => {
    console.error(error.response?.data?.description || error.message || error)
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
