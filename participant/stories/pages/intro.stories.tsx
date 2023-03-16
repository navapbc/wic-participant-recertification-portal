import Intro from "~/routes/intro";
import Layout from "~/components/Layout";
export default {
  title: "Pages/Intro",
  parameters: {},
};

export const PageWithoutLayout = Intro;
export const FullPage = () => {
  return <Layout>{Intro()}</Layout>;
};
