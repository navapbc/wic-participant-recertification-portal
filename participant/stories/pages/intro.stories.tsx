import Intro from "app/routes/$localAgency/recertify/intro";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Intro",
  parameters: {},
};

export const PageWithoutLayout = Intro;
export const FullPage = () => {
  return <Layout>{Intro()}</Layout>;
};
