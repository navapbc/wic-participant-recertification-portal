import i18next from "i18next";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "../app/i18n"; // your i18n configuration file
import common from "../public/locales/en/common.json";
import test from "../tests/fixtures/test-i18n.json";
import React from "react";
import "app/styles/styles.css";
import "./breadcrumbs.css";

i18next
  .use(initReactI18next) // Tell i18next to use the react-i18next plugin
  .init({
    ...i18n, // spread the configuration
    ns: ["common", "test"],
    defaultNS: "common",
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        common: common,
        test: test, // Unifying strings for both Jest and Storybook here
      },
    },
  });

export const decoratorFunc = (Story) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18next}>
      <Story />
    </I18nextProvider>
  </BrowserRouter>
);

export const decorators = [decoratorFunc];
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      order: [
        "Docs",
        [
          "📝 Intro",
          "🛠️ Development",
          "🗂 Application Internals",
          "🧹 Formatting",
          "🧪 Testing",
          "👟 Remix Stack",
          "Pages",
          [
            "Index",
            "About",
            "Name",
            "Count",
            "Details",
            "Changes",
            "Upload",
            "Contact",
            "Review",
            "Confirm",
          ],
        ],
        "Pages",
        [
          "Index",
          "About",
          "Name",
          "Count",
          "Details",
          "Changes",
          "Upload",
          "Contact",
          "Review",
          "Confirm",
        ],
        "Layout",
        "Components",
      ],
    },
  },
};
