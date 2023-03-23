import About from "~/routes/about";
import Layout from "~/components/Layout";
export default {
  title: "Pages/About",
  parameters: {},
};

export const PageWithoutLayout = About;
export const FullPage = () => {
  return <Layout>{About()}</Layout>;
};
