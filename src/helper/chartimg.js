import qs from 'qs'

const BASE_URL = 'https://api.chart-img.com/v1/tradingview'

/**
 * @param {Object} query
 * @returns {Response}
 */
const getTradingViewMiniChart = (query = {}) => {
  return fetch(`${BASE_URL}/mini-chart?${qs.stringify(query)}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${CHART_IMG_API_KEY}`,
    },
  })
}

export { getTradingViewMiniChart }
