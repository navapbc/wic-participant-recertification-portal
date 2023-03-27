import Details from "app/routes/$localAgency/recertify/details";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Details",
  parameters: {},
};

export const PageWithoutLayout = Details;
export const FullPage = () => {
  return <Layout>{Details()}</Layout>;
};
