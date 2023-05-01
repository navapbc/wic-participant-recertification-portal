import Confirm from "app/routes/$localAgency/recertify/confirm";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Confirm",
  parameters: {},
};

export const PageWithoutLayout = Confirm;
export const FullPage = () => {
  return <Layout>{Confirm()}</Layout>;
};
