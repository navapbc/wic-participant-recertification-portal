import Details from "~/routes/details";
import Layout from "~/components/Layout";
export default {
  title: "Pages/Details",
  parameters: {},
};

export const PageWithoutLayout = Details;
export const FullPage = () => {
  return <Layout>{Details()}</Layout>;
};
