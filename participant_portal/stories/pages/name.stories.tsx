import Name from "~/routes/name";
import Layout from "~/components/Layout";
export default {
  title: "Pages/Name",
  parameters: {},
};

export const PageWithoutLayout = Name;
export const FullPage = () => {
  return <Layout>{Name()}</Layout>;
};
