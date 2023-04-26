// This is a test file to see what kind of lift adding Matomo will be like
// Configuring the wrapper for the Matomo tracker package
import { createInstance } from '@jonkoops/matomo-tracker-react'

export const matomoInstance = createInstance({
  urlBase: 'http://localhost:8080/',
  // urlBase: 'https://dev-analytics.wic-services.org/',
  siteId: 1,
  trackerUrl: 'http://localhost:8080/matomo.php',
  // trackerUrl: 'https://dev-analytics.wic-services.org/matomo.php', // optional, default value: `${urlBase}matomo.php` 
  srcUrl: 'http://localhost:8080/matomo.js',
  // srcUrl: 'https://dev-analytics.wic-services.org/matomo.js', // optional, default value: `${urlBase}matomo.js` // has to be an https website
  disabled: false, // optional, false by default. Makes all tracking calls no-ops if set to true.
  heartBeat: { // optional, enabled by default
    active: true, // optional, default value: true
    seconds: 10 // optional, default value: `15
  },
  linkTracking: false, // optional, default value: true
  configurations: { // optional, default value: {}
    // any valid matomo configuration, all below are optional
    disableCookies: true,
    setSecureCookie: true,
    setRequestMethod: 'POST',
    trackPageView: true,
  }
})



