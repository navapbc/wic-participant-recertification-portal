import Index from "~/routes/index";
import Layout from "~/components/Layout";
export default {
  title: "Pages/Index",
  parameters: {},
};

export const PageWithoutLayout = Index;
export const FullPage = () => {
  return <Layout>{Index()}</Layout>;
};
