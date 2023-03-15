import Count from "~/routes/count";
import Layout from "~/components/Layout";
export default {
  title: "Pages/Count",
  parameters: {},
};

export const PageWithoutLayout = Count;
export const FullPage = () => {
  return <Layout>{Count()}</Layout>;
};
