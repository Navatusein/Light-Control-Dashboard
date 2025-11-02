// src/components/bindings-editor.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import * as actions from "@/app/actions";
import BindingsEditor from "./bindings-editor";

vi.mock("@/app/actions", () => ({
  publishBindingsSingle: vi.fn().mockResolvedValue(undefined),
}));

describe("BindingsEditor", () => {
  it(
    "publishes single JSON to Fc3/config/bindings",
    async () => {
      // @ts-ignore
      const spy = actions.publishBindingsSingle as unknown as vi.Mock;

      render(<BindingsEditor baseFromServer="Fc3" />);

      // 1) Підставляємо дефолтні зв’язки (кнопка вже є в UI)
      await userEvent.click(
        screen.getByRole("button", { name: /Завантажити дефолт/i })
      );

      // 2) Публікація одним повідомленням
      await userEvent.click(
        screen.getByRole("button", { name: /Опублікувати одним повідомленням/i })
      );

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

      // Перевіряємо аргументи
      const [rowsArg, opts] = spy.mock.calls[0];
      expect(Array.isArray(rowsArg)).toBe(true);
      // дефолт у тебе містить 16 правил — перевіримо хоч би >0
      expect(rowsArg.length).toBeGreaterThan(0);
      // очікуємо retain=true
      expect(opts).toMatchObject({ retain: true });
    },
    15000 // збільшений таймаут для повільного рендеру antd у jsdom
  );
});
