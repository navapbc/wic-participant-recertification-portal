import About from "app/routes/$localAgency/recertify/about";
import Layout from "app/components/Layout";
export default {
  title: "Pages/About",
  parameters: {},
};

export const PageWithoutLayout = About;
export const FullPage = () => {
  return <Layout>{About()}</Layout>;
};
