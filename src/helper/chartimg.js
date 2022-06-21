import qs from 'qs'

const BASE_URL = 'https://api.chart-img.com/v1/tradingview'

/**
 * @param {Object} query
 * @returns {Promise}
 */
const getTradingViewMiniChart = (query = {}) => {
  return fetch(`${BASE_URL}/mini-chart?${qs.stringify(query)}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${CHART_IMG_API_KEY}`,
    },
  })
}

/**
 * @param {Object} query
 * @returns {Promise}
 */
const getTradingViewAdvancedChart = (query = {}) => {
  return fetch(`${BASE_URL}/advanced-chart?${qs.stringify(query, { arrayFormat: 'repeat' })}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${CHART_IMG_API_KEY}`,
    },
  })
}

export { getTradingViewMiniChart, getTradingViewAdvancedChart }
