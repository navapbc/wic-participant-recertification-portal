import Layout from "~/components/Layout";
import type { LayoutProps } from "~/components/Layout";
export default {
  component: Layout,
  title: "Layout/Layout",
  parameters: {},
  argTypes: {
    children: {
      description: "Child elements for the page layout",
    },
    demoMode: {
      description: "Enable / disable the Demo Mode banner",
      table: {
        defaultValue: {
          summary: "false",
        },
      },
      control: "select",
      options: ["false", "true"],
    },
    missingData: {
      description: "Enable / disable the Error banner",
      table: {
        defaultValue: {
          summary: "false",
        },
      },
      control: "select",
      options: ["false", "true"],
    },
  },
};

const LayoutTemplate = {
  render: (props: LayoutProps) => {
    return <Layout {...props} />;
  },
};

const defaultLayoutProps: LayoutProps = {
  children: (
    <div>
      <h1>Example Heading</h1>
      <p>This is example page content</p>
    </div>
  ),
  demoMode: "false",
  missingData: "false",
};

export const Default = {
  ...LayoutTemplate,
  args: {
    ...defaultLayoutProps,
  },
};

export const DemoMode = {
  ...LayoutTemplate,
  args: {
    ...defaultLayoutProps,
    demoMode: "true",
  },
};

export const MissingData = {
  ...LayoutTemplate,
  args: {
    ...defaultLayoutProps,
    missingData: "true",
  },
};

export const MissingDataDemoMode = {
  ...LayoutTemplate,
  args: {
    ...defaultLayoutProps,
    demoMode: "true",
    missingData: "true",
  },
};
