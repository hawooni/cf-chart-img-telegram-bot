import qs from 'qs'
import { authentication as AUTH } from '../../config'

const BASE_URL = 'https://api.chart-img.com/v1/tradingview'

/**
 * @param {Object} query
 * @returns {Promise}
 */
export const getTradingViewMiniChart = (query = {}) => {
  return fetch(`${BASE_URL}/mini-chart?${qs.stringify(query)}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${AUTH.chartImgApiKey}`,
    },
  })
}

/**
 * @param {Object} query
 * @returns {Promise}
 */
export const getTradingViewAdvancedChart = (query = {}) => {
  return fetch(`${BASE_URL}/advanced-chart?${qs.stringify(query, { arrayFormat: 'repeat' })}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${AUTH.chartImgApiKey}`,
    },
  })
}
