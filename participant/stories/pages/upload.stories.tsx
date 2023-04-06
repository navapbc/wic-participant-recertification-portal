import Upload from "app/routes/$localAgency/recertify/upload";
import Layout from "app/components/Layout";
export default {
  title: "Pages/Upload",
  parameters: {},
};

export const PageWithoutLayout = Upload;
export const FullPage = () => {
  return <Layout>{Upload()}</Layout>;
};
