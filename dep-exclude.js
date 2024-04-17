module.exports = (compiler) => {
  console.log('\x1b[36m%s\x1b[0m', '********** Liber Exclude Enabled **********')
  compiler.hooks.compilation.tap('compilation', (compilation) => {
    compilation.hooks.succeedModule.tap('succeedModule', (module) => {
      module.dependencies = module.dependencies.filter((dep) => {
        const includes = ['@/pages/resource']
        const excludes = ['@/pages']
        // const fullPath = dep.originModule?.resource
        const rawRequest = dep.originModule?.rawRequest
        if (rawRequest?.includes('@/pages')) {
          if (!includes.some((v) => rawRequest.startsWith(v)) && excludes.some((v) => rawRequest.startsWith(v))) {
            return false
          }
        }
        return true
      })
    })
  })
}
