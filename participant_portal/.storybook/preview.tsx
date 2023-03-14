import i18next from "i18next";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "../app/i18n"; // your i18n configuration file
import common from "../public/locales/en/common.json";
import React from "react";
import "app/styles/styles.css";

i18next
  .use(initReactI18next) // Tell i18next to use the react-i18next plugin
  .init({
    ...i18n, // spread the configuration
    ns: ["common"],
    defaultNS: "common",
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        common: common,
        test: {
          adjunctive: {
            label: "Are they enrolled in any of these programs?",
            programs: [
              "Medicaid / Healthy Montana Kids Plus",
              "SNAP (Supplemental Nutrition Assistance Program",
              "TANF (Temporary Assistance for Needy Families)",
              "FDPIR (Food Distribution Program on Indian Reservations",
            ],
            yes: "Yes",
            no: "No",
          },
          dateinput: {
            month: "Month",
            day: "Day",
            year: "Year",
            hintMDY: "For Example: 4 28 1986",
            legend: "Date of Birth",
            hintDMY: "For Example: 28 4 1986",
          },
          inputchoice: {
            label1: "Option 1",
            label2: "Option 2",
            label3: "Option 3",
            labelRadio: "Example Radio",
            labelCheckbox: "Example Checkbox",
            helpHeader: "What does this mean?",
            helpBody:
              "<p><strong>Here is some information about what it means</strong></p><p>This is very helpful</p>",
          },
          nameinput: {
            firstname: "First name",
            lastname: "Last name",
            legal: "Legally as it appears on their ID.",
            legend: "Name",
            preferred: "Preferred name (optional)",
          },
          participantcard: {
            header: "Participant",
            footer: "Add another participant?",
          },
          relationship: {
            label: "Relationship to you",
            self: "Self",
            child: "Child",
            grandchild: "Grandchild",
            foster: "Foster child",
            other: "Other",
          },
          textfield: {
            inputbox: "Text input label:",
            textarea: "This is a text area:",
          },
          translinks: {
            plainStringLinks: {
              text: "first <0>second</0> <1>third</1>",
              links: ["https://external.com", "/relative/link"],
            },
            plainStringLinksComplicated: {
              text: "<1>first</1> <0>second</0> third <0>fourth</0> <1>fifth</1>",
              links: ["https://external.com", "/relative/link"],
            },
            styledString: {
              text: "first <strong>second</strong> <0>third</0>",
              links: ["https://external.com"],
            },
            styledLink: {
              text: "first <strong><0>second</0></strong>",
              links: ["https://external.com"],
            },
          }, // Add test namespace localization here as needed
        },
      },
    },
  });

export const decorators = [
  (Story) => (
    <BrowserRouter>
      <I18nextProvider i18n={i18next}>
        <Story />
      </I18nextProvider>
    </BrowserRouter>
  ),
];
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
      order: ["Docs", ["Intro"], "Pages", "Layout", "Components"],
    },
  },
};
