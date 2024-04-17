// 第一次编译：修改loader，跳过loader复杂逻辑。
// 浏览器请求，触发编译，返回结果。
// !! 修改loader ✅
// !! loader返回内容：【按需编译触发时机】浏览器请求文件，通知nodejs compile[使用url代理方式] ✅
// !! server监听到url请求，修改状态，改回loader, 修改文件信息触发webpack watch编译 ✅
// !!【交互优化】compile完成后，通知前端刷新获取最新内容 ✅
//  - 动态感知 ✅

// ?其他方案尝试
// esbuild for vue loader ::: github的 esbuild-loader 不行，不能实现vue的loader。用它替代babel-loader，测试项目没有速度提升。
// worker
// 启动后backgroud build

/// <reference types="webpack" />

const chalk = require('chalk')
const http = require('http')
const url = require('url')
const fs = require('fs')

const log = function () {
  console.log(chalk.black.bgGreen(...arguments))
}

class ServerAsapPlugin {
  ignores = [/\bhtml-webpack-plugin\b/]
  constructor(options) {
    this.ignores.push(...options.ignores)
  }

  apply(compiler) {
    // return
    // const excludesPlugin = require('./liber.plugin2')
    // excludesPlugin(compiler)
    log('********** Liber Lazy Compile Enabled **********')

    function activateModule(key) {
      const lazyModule = lazyMap.get(key)
      if (lazyModule) {
        lazyModule.status = 'ready'
        return new Promise((resolve, reject) => {
          const now = new Date()
          // trigger watcher to recompile
          fs.utimes(lazyModule.filename, now, now, (err) => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        })
      }
    }

    const server = http.createServer((req, res) => {
      const key = url.parse(req.url, true).query.r
      activateModule(key).then(() => {
        res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>')
      })
    })
    server.listen('9000', () => {
      log('\nserver.listen on 9000')
    })

    const lazyMap = new Map()
    compiler.hooks.beforeCompile.tapAsync('LazyCompilePlugin', (compilation, cb) => {
      compilation.normalModuleFactory.hooks.afterResolve.tap('LazyCompilePlugin', (m) => {
        const key = m.userRequest
        if (this._shouldBeLazy(m) && !lazyMap.has(key)) {
          lazyMap.set(key, {
            status: 'init',
            isEntry: isEntry(m)
          })
        } else {
          // console.log('\n ignore: ', m.request)
        }
      })
      cb()
    })
    compiler.hooks.compilation.tap('liber-lazy-compile', (compilation) => {
      compilation.hooks.buildModule.tap('liber-lazy-compile', (module) => {
        const key = module.userRequest
        if (!lazyMap.has(key)) {
          return
        }
        const lazyModule = lazyMap.get(key)
        if (lazyModule.status == 'ready') {
          module.loaders = lazyModule.loaders
          lazyModule.status = 'compiled'
        }
        if (lazyModule.status == 'init') {
          const stripQuery = module.resource.replace(/\?.*$/, '')
          lazyModule.filename = stripQuery
          lazyModule.loaders = module.loaders
          module.loaders = [
            {
              loader: require.resolve(lazyModule.isEntry ? './loaders/loader-entry.js' : './loaders/loader-normal.js'),
              options: {
                key
              }
            }
          ]
          lazyModule.status = 'blocked'
        }
      })
    })
  }
  _shouldBeLazy(wpModule) {
    const { request, dependencies } = wpModule
    if (dependencies.length <= 0) return false

    const lazible = dependencies.some((dep) => isImportDep(dep) || isEntryDep(dep))
    if (!lazible) return false

    for (let index = 0; index < this.ignores.length; index++) {
      const ignore = this.ignores[index]
      let shouldIgnore = false
      if (util.isRegExp(ignore)) {
        shouldIgnore = ignore.test(request)
      } else if (util.isFunction(ignore)) {
        shouldIgnore = ignore(request, wpModule)
      }

      if (shouldIgnore) {
        return false
      }
    }
    return true
  }
}
module.exports = ServerAsapPlugin

function isImportDep(dep) {
  return dep.type.startsWith('import()')
}

function isEntryDep(dep) {
  return dep.type === 'single entry' || dep.type === 'multi entry'
}

function isEntry(wpModule) {
  const { dependencies } = wpModule
  return dependencies && dependencies.some(isEntryDep)
}

class util {
  static isRegExp(target) {
    return toString.call(target) === `[object RegExp]`
  }

  static isFunction(target) {
    return toString.call(target) === `[object Function]`
  }
}
