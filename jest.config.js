const { jest } = require("skripts/config")

module.exports = {
  ...jest,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
}
