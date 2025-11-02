// src/components/dashboard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "./dashboard"; // шляхи під себе

describe("Dashboard", () => {
  it("renders 24 LED cards and toggles one", async () => {
    const publishLight = vi.fn().mockResolvedValue(undefined);
    render(<Dashboard baseFromServer="Fc3" publishLight={publishLight} />);

    // 24 назви LED (може бути кілька елементів з таким текстом, але кількість перевіримо)
    const labels = await screen.findAllByText(/LED\s+\d+/i);
    expect(labels.length).toBeGreaterThanOrEqual(24); // мінімальна перевірка

    // тиснемо першу кнопку TOGGLE (вважаємо, що відповідає LED 0)
    const toggleBtns = screen.getAllByRole("button", { name: "TOGGLE" });
    fireEvent.click(toggleBtns[0]);

    expect(publishLight).toHaveBeenCalledWith("lights/0/set", "TOGGLE");
  });

  it("switch ON calls publish with ON", async () => {
    const publishLight = vi.fn().mockResolvedValue(undefined);
    render(<Dashboard baseFromServer="Fc3" publishLight={publishLight} />);

    const onBtns = screen.getAllByRole("button", { name: "ON" });
    fireEvent.click(onBtns[1]); // для LED 1

    expect(publishLight).toHaveBeenCalledWith("lights/1/set", "ON");
  });
});
