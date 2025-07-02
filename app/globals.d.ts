
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(className: string): R;
      toHaveValue(value: string | number): R;
      toHaveTextContent(text: string): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeRequired(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveStyle(css: { [property: string]: any } | string): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}
