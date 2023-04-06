import Changes from "app/routes/$localAgency/recertify/changes";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Changes",
  parameters: {},
};

export const PageWithoutLayout = Changes;
export const FullPage = () => {
  return <Layout>{Changes()}</Layout>;
};
