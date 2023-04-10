import { renderWithRouter } from "tests/helpers/setup";
import RequiredQuestionStatement from "app/components/RequiredQuestionStatement";

it("should match snapshot", () => {
  const { container } = renderWithRouter(<RequiredQuestionStatement />);
  expect(container).toMatchSnapshot();
});
