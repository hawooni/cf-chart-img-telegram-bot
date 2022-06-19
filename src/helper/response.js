/**
 * @param {Object} payload
 * @param {Integer} status
 * @param {Object} headers
 * @returns {Response}
 */
const resJson = (payload, status = 200, headers = {}) => {
  const body = JSON.stringify(payload)

  return new Response(body, {
    headers: Object.assign(
      {
        'Content-Type': 'application/json',
      },
      headers
    ),
    status: status,
  })
}

export { resJson }
