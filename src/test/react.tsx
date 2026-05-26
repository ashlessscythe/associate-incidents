import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

interface RenderWithRouterOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  { route = "/", ...renderOptions }: RenderWithRouterOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
    ...renderOptions,
  });
}
