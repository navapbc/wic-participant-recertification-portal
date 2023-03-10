import userEvent from "@testing-library/user-event";

import React from "react";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "app/i18n"; // your i18n configuration file
import { BrowserRouter } from "react-router-dom";
import common from "public/locales/en/common.json";
export const i18nwrapper = ({
  children,
}: {
  children: React.ReactNode;
}): ReactElement => {
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
            transLine: {
              plainStringOneLink: {
                text: "first <0>second</0> third",
                links: ["https://external.com"],
              },
              plainStringLinks: {
                text: "first <0>second</0> <1>third</1>",
                links: ["https://external.com", "/relative/link"],
              },
              plainStringLinksComplicated: {
                text: "<1>first</1> <0>second</0> third <0>fourth</0> <1>fifth</1>",
                links: ["https://external.com", "/relative/link"],
              },
              styledStringOneLink: {
                text: "first <strong>second</strong> <0>third</0>",
                links: ["https://external.com"],
              },
              styledLink: {
                text: "first <strong><0>second</0></strong>",
                links: ["https://external.com"],
              },
            },
          },
        },
      },
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
    })
    .catch(() => "Failed to initialize i18next in Jest Setup");

  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </BrowserRouter>
  );
};

/* testing-react supports an alternate renderer, and this
 * renderer wraps the object under test in a BrowserRouter and I18NextProvider
 * so that React hooks and i18n calls function
 */
export const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: i18nwrapper, ...options });

/*
 * Types
 */
// Return type taken from
// https://github.com/testing-library/user-event/pull/983#issuecomment-1185537044
export type UserEventReturn = ReturnType<(typeof userEvent)["setup"]>;

/*
 * Mocks
 */

// Setup userEvent
// See https://testing-library.com/docs/user-event/intro#writing-tests-with-userevent
export function setupUserEvent(): UserEventReturn {
  // Set up userEvent
  const user = userEvent.setup();
  return user;
}

export type FormObject = {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  [inputName: string]: any;
};

// This is a helper to take an object like this one:
/* const contact: FormObject = {
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      comments: "",
    };
 * and turn it into a FormData object, like what is returned on a Request
 * and what a withZod validator requires
 */
export function createForm(obj: FormObject): FormData {
  const parsedForm = new FormData();
  for (const key in obj) {
    // -- We don't know what this object contains, so we can't type it
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (obj[key].forEach) {
      // This lets us pass in arrays or strings and build correct form data
      // (we DO know that it has a forEach method)
      // eslint-disable-next-line
      obj[key].forEach((item: string) => {
        parsedForm.append(key, item);
      });
    } else {
      parsedForm.append(key, obj[key] as string);
    }
  }
  return parsedForm;
}
