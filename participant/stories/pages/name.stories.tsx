import Name from "app/routes/$localAgency/recertify/name";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Name",
  parameters: {},
};

export const PageWithoutLayout = Name;
export const FullPage = () => {
  return <Layout>{Name()}</Layout>;
};
