import React from "react";
import test from "ava";
import { render } from "ink-testing-library";
import { SlashSuggestions } from "../../../../dist/cli/components/organisms/SlashSuggestions.js";
import { Command, CommandCategory } from "../../../../dist/core/domain/valueObjects/Command.js";
const executor = { execute: async () => {
} };
const commands = [
  new Command({ cmd: "/help", desc: "Show help", category: CommandCategory.SYSTEM }, executor),
  new Command({ cmd: "/clear", desc: "Clear screen", category: CommandCategory.SYSTEM }, executor)
];
test("renders suggestions", (t) => {
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(
      SlashSuggestions,
      {
        commands,
        selectedIndex: 0
      }
    )
  );
  t.true(lastFrame()?.includes("/help"));
  t.true(lastFrame()?.includes("Show help"));
  t.true(lastFrame()?.includes("/clear"));
});
test("highlights selected suggestion", (t) => {
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(
      SlashSuggestions,
      {
        commands,
        selectedIndex: 1
      }
    )
  );
  t.true(lastFrame()?.includes("\u203A "));
  t.true(lastFrame()?.includes("/clear"));
});
test("renders nothing when empty", (t) => {
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(
      SlashSuggestions,
      {
        commands: [],
        selectedIndex: 0
      }
    )
  );
  t.is(lastFrame(), "");
});
