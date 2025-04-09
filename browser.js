/**
 * Enum for browser types supported by the WebSocket client
 * @enum {string}
 */
const Browser = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  OPERA: 'opera',
  SAFARI: 'safari',
  EDGE: 'edge',
  IOS: 'ios',
  ANDROID: 'android' // deprecated
};

// Freeze the enum to make it immutable
Object.freeze(Browser);

module.exports = Browser; 