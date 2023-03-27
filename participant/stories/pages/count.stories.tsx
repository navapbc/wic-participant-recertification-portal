import Count from "app/routes/$localAgency/recertify/count";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Count",
  parameters: {},
};

export const PageWithoutLayout = Count;
export const FullPage = () => {
  return <Layout>{Count()}</Layout>;
};
