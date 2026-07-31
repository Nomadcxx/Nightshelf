const pkg = require('./package.json')

export default {
  ssr: false,
  target: 'static',
  telemetry: false,
  env: {
    PROD: '1',
    ANDROID_APP_URL: 'https://play.google.com/store/apps/details?id=com.nightshelf.app',
    IOS_APP_URL: ''
  },

  publicRuntimeConfig: {
    version: pkg.version
  },

  head: {
    title: 'Nightshelf',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1' }, { hid: 'description', name: 'description', content: '' }, { name: 'format-detection', content: 'telephone=no' }],
    script: [
      {
        src: '/libs/sortable.js'
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  css: ['@/assets/tailwind.css', '@/assets/app.css'],

  plugins: ['@/plugins/server.js', '@/plugins/db.js', '@/plugins/localStore.js', '@/plugins/init.client.js', '@/plugins/axios.js', '@/plugins/capacitor/index.js', '@/plugins/capacitor/AbsAudioPlayer.js', '@/plugins/nativeHttp.js', '@/plugins/toast.js', '@/plugins/constants.js', '@/plugins/haptics.js', '@/plugins/i18n.js'],

  components: true,

  hooks: {
    // Auto-imported components are discovered with globby, which returns
    // whatever order the filesystem hands back. That order ends up baked into
    // the vendor bundle as the registration sequence, so two builds of the
    // same commit can differ purely because the files were laid down
    // differently. Git checkouts happen to be consistent, which is why this
    // never showed up until a build ran against a copied tree, but it is not
    // something to rely on when the point is a byte-identical rebuild.
    'components:extend'(components) {
      components.sort((a, b) => (a.pascalName < b.pascalName ? -1 : a.pascalName > b.pascalName ? 1 : 0))
    }
  },

  modules: ['@nuxtjs/axios'],

  axios: {},

  build: {
    // Name JavaScript chunks after the chunk, not after a content hash.
    //
    // Nuxt's default is `[contenthash:7].js`, and that hash turns out to
    // depend on the absolute directory the build ran in: building the same
    // commit with the same Node in the same container at two different paths
    // renames 70 of 114 chunks while their contents stay byte for byte
    // identical. F-Droid builds at their own path, so the APK could never
    // match the one released here, which is what a reproducible build has to
    // do. Everything else already matched, down to the dex.
    //
    // Nothing is lost by dropping the hash. These files are read from the APK
    // over file://, so there is no HTTP cache to bust, and the APK is
    // versioned as a whole.
    filenames: {
      app: ({ isDev }) => (isDev ? '[name].js' : '[name].js'),
      chunk: ({ isDev }) => (isDev ? '[name].js' : '[name].js')
    },
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {}
        }
      }
    },
    babel: {
      plugins: [['@babel/plugin-proposal-private-property-in-object', { loose: true }]]
    }
  }
}
