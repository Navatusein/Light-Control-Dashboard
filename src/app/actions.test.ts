import { vi, describe, it, expect } from "vitest";

// Мокаємо publishAsync до реального MQTT не підключаємось
vi.mock("@/lib/mqtt", () => ({
  publishAsync: vi.fn().mockResolvedValue(undefined),
  MQTT_BASE: "Fc3",
}));

import { publishAsync } from "@/lib/mqtt";
import {publishBindingsSingle, publishLight} from "./actions";

describe("server actions", () => {
  it("publishBindingsSingle sends single retained JSON", async () => {
    const bindings = [
      { switch: "sw1/btn1", leds: [0, 1], mode: "toggle" as const },
      { switch: "sw1/sw1",  leds: [8, 16], mode: "momentary" as const },
    ];

    await publishBindingsSingle(bindings, { retain: true });
    expect(publishAsync).toHaveBeenCalledWith(
      "Fc3/config/bindings",
      JSON.stringify({ bindings }),
      expect.objectContaining({ retain: true }),
    );
  });

  it("publishLight builds proper topic", async () => {
    await publishLight("lights/5/set", "TOGGLE");
    expect(publishAsync).toHaveBeenCalledWith("Fc3/lights/5/set", "TOGGLE");
  });
});
