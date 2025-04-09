module.exports = {
  timeout: 10000,
  exit: true,
  require: ['chai', 'chai-as-promised'],
  reporter: 'spec',
  slow: 75,
  bail: false,
  spec: ['**/*.test.js']
}; 