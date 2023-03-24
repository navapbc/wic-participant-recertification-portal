export default {
  // This is the list of languages your application supports
  supportedLngs: ["en", "es"],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: "en",
  // The default namespace of i18next is "translation", but you can customize it here
  defaultNS: "common",
  react: {
    // Disabling suspense is recommended
    useSuspense: false,
    // Add support for <em>.
    // See https://react.i18next.com/latest/trans-component#using-for-less-than-br-greater-than-and-other-simple-html-elements-in-translations-v-10-4-0
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "em"],
  },
};
