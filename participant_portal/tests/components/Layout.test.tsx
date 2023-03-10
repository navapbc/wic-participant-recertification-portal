import Layout from "app/components/Layout";
import { renderWithRouter } from "tests/helpers/setup";

import { testAccessibility } from "../helpers/sharedTests";

it("should match snapshot", () => {
  const { container } = renderWithRouter(
    <Layout children={<h1>'child'</h1>} />
  );
  expect(container).toMatchSnapshot();
});

// eslint-disable-next-line jest/expect-expect
it("should pass accessibility scan", async () => {
  // testAccessibility does have an assertion (expect(results).toHaveNoViolations)
  await testAccessibility(<Layout children={<h1>'child'</h1>} />);
});
