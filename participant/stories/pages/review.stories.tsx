import Review from "app/routes/$localAgency/recertify/review";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Review",
  parameters: {},
};

export const PageWithoutLayout = Review;
export const FullPage = () => {
  return <Layout>{Review()}</Layout>;
};
