import Vue from 'vue'
import enUsStrings from '../strings/en-us.json'

const defaultCode = 'en-us'
let $localStore = null

const languageCodeMap = {
  'en-us': { label: 'English', dateFnsLocale: 'enUS' }
}

function supplant(str, subs) {
  // source: http://crockford.com/javascript/remedial.html
  return str.replace(/{([^{}]*)}/g, function (a, b) {
    var r = subs[b]
    return typeof r === 'string' || typeof r === 'number' ? r : a
  })
}

Vue.prototype.$languageCodeOptions = Object.keys(languageCodeMap).map((code) => {
  return {
    text: languageCodeMap[code].label,
    value: code
  }
})

Vue.prototype.$languageCodes = {
  default: defaultCode,
  current: defaultCode,
  local: null,
  server: null
}

Vue.prototype.$strings = { ...enUsStrings }

Vue.prototype.$getString = (key, subs) => {
  if (!Vue.prototype.$strings[key]) return ''
  if (subs && Array.isArray(subs) && subs.length) {
    return supplant(Vue.prototype.$strings[key], subs)
  }
  return Vue.prototype.$strings[key]
}

Vue.prototype.$formatNumber = (num) => {
  return Intl.NumberFormat(Vue.prototype.$languageCodes.current).format(num)
}

async function loadi18n() {
  const code = defaultCode
  if (Vue.prototype.$languageCodes.current == code) {
    // already set
    return false
  }

  const strings = enUsStrings
  Vue.prototype.$languageCodes.current = code
  $localStore.setLanguage(code)

  for (const key in Vue.prototype.$strings) {
    Vue.prototype.$strings[key] = strings[key]
  }

  Vue.prototype.$setDateFnsLocale(languageCodeMap[code].dateFnsLocale)

  this.$eventBus.$emit('change-lang', code)
  return true
}

Vue.prototype.$setLanguageCode = loadi18n

// Set the servers default language code, does not override users local language code
Vue.prototype.$setServerLanguageCode = () => {
  Vue.prototype.$languageCodes.server = defaultCode
}

// Initialize with language code in localStorage if valid
async function initialize() {
  const localLanguage = await $localStore.getLanguage()
  if (!localLanguage) return

  if (localLanguage !== defaultCode) {
    console.warn('Invalid local language code', localLanguage)
    $localStore.setLanguage(defaultCode)
  } else {
    Vue.prototype.$languageCodes.local = defaultCode
  }
}

export default ({ app, store }, inject) => {
  $localStore = app.$localStore
  initialize()
}
