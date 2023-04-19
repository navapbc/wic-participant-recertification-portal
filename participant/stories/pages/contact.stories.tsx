import Contact from "app/routes/$localAgency/recertify/contact";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Contact",
  parameters: {},
};

export const PageWithoutLayout = Contact;
export const FullPage = () => {
  return <Layout>{Contact()}</Layout>;
};
