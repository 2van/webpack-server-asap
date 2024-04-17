const isBrowser = typeof window !== 'undefined'
const GLOBAL_ANIMATION_KEY = '__lazyCompileWebpackPlugin'

function noop() {}

function compile(key) {
  let ready
  const p = new Promise((resolve) => {
    ready = resolve
    if (!globalThis.Image) {
      return
    }
    const img = new Image()
    img.src = `http://localhost:9000?r=${encodeURIComponent(key)}`
  })
  p.ready = ready

  return p
}
const figures = ['.', '..', '...']

function startAnimation() {
  if (!isBrowser) return noop
  if (window[GLOBAL_ANIMATION_KEY]) return noop

  window[GLOBAL_ANIMATION_KEY] = true

  var originTitle = document.title
  function animatioLoop() {
    loopHandle = setTimeout(animatioLoop, 50)
    document.title = 'Compiling ' + figures[Math.floor((Date.now() / 100) % figures.length)]
  }
  animatioLoop()

  return () => {
    window[GLOBAL_ANIMATION_KEY] = false
    clearTimeout(loopHandle)
    document.title = originTitle
  }
}

module.exports = {
  isBrowser,
  compile,
  startAnimation
}
