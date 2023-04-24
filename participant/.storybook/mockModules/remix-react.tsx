// Using the WebPack shim to push this file in instead of Remix-React
// means that we need these re-exports for hooks and components that do
// work to continue working without modification
export {
  Link,
  useLocation,
  useCatch,
  useTransition,
  useMatches,
} from "../../node_modules/@remix-run/react";
import { FormProps } from "../../node_modules/@remix-run/react";
import React from "react";
import { ReactElement } from "react";

// You could return Action data here, though note that
// ALL useActionData calls in all routes rendered in Storybook
// receive the contents of this response
export const useActionData = () => {};

// Can't use a real submit hook in Storybook
export const useSubmit = () => {};

// There are almost certainly more elegant or flexible solutions
// to providing loader data to pages in Storybook, but I
// settled for legibility and shallow call stack depth

// Add your loader parameters necessary for your Storybook stories here
// Using unique variable names in your pages is important
export function useLoaderData<T>() {
  return {
    // Insert your useLoaderData variable names / values here
    participantCount: 2,
    proofRequired: ["address", "identity", "income"],
    previousUploads: [
      {
        url: "https://user-images.githubusercontent.com/723391/232950499-77b965c6-5a3a-4b01-94dd-162784ae3220.png",
        name: "avatar.jpg",
      },
    ],
  };
}

// The purpose of this is two-fold - to centralize
// deactivating forms in Storybook, and to prevent another Remix
// component (Form) from complaining about where it's being rendered
export const Form = (props: FormProps): ReactElement => {
  const { children, method, onSubmit, ...rest } = props;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </form>
  );
};
