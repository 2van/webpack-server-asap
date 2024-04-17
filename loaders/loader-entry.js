const path = require('path')
const loaderUtils = require('loader-utils')
const apiPath = path.join(__dirname, 'api.js')
module.exports = function () {
  const options = loaderUtils.getOptions(this) || {}
  const key = options.key
  return `
  const api = require('!!${apiPath}');
  console.log('compiling ${key}');api.compile('${key}')
  setTimeout(function () {
    window.location.reload()
  }, 200)
  `.trim()
}
