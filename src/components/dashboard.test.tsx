// src/components/dashboard.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Dashboard from "./dashboard";

describe("Dashboard", () => {
  it(
    "renders 24 LED cards and toggles one",
    async () => {
      const publishLight = vi.fn().mockResolvedValue(undefined);
      render(<Dashboard baseFromServer="Fc3" publishLight={publishLight} />);

      // дочекайся карток
      const cards = await screen.findAllByTestId("led-card", {}, { timeout: 10000 });
      expect(cards.length).toBe(24);

      // клік по першій картці (або кнопці всередині неї)
      const first = cards[0];
      const btn = within(first).getByRole("button");
      await userEvent.click(btn);

      expect(publishLight).toHaveBeenCalledTimes(1);
    },
    20000 // збільшений таймаут на CI
  );

  it(
    "switch ON calls publish with ON",
    async () => {
      const publishLight = vi.fn().mockResolvedValue(undefined);
      render(<Dashboard baseFromServer="Fc3" publishLight={publishLight} />);

      // знайдемо конкретну картку, наприклад, #5
      const cards = await screen.findAllByTestId("led-card", {}, { timeout: 10000 });
      const card5 = cards[5];
      const onBtn = within(card5).getByRole("button", { name: /on/i });
      await userEvent.click(onBtn);

      expect(publishLight).toHaveBeenCalledWith({
        index: 5,
        state: "ON",
      });
    },
    20000
  );
});
