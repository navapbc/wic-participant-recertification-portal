import Index from "app/routes/$localAgency/recertify/index";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Index",
  parameters: {},
};

export const PageWithoutLayout = Index;
export const FullPage = () => {
  return <Layout>{Index()}</Layout>;
};
