import React from "react";
import test from "ava";
import { render } from "ink-testing-library";
import InputBox from "../../../../dist/cli/components/molecules/InputBox.js";
import sinon from "sinon";
import { ShortcutProvider } from "../../../../dist/core/input/ShortcutContext.js";
test("renders with placeholder", (t) => {
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { placeholder: "Type here..." }))
  );
  t.true(lastFrame()?.includes("Type here..."));
});
test("renders with value", (t) => {
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { value: "Hello" }))
  );
  t.true(lastFrame()?.includes("Hello"));
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
test("updates input on key press", async (t) => {
  const onChange = sinon.spy();
  const { lastFrame, stdin } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { onChange }))
  );
  stdin.write("A");
  await delay(100);
  t.true(lastFrame()?.includes("A"));
  t.true(onChange.calledWith("A"));
});
test("calls onSubmit on enter", async (t) => {
  const onSubmit = sinon.spy();
  const { stdin } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { onSubmit }))
  );
  stdin.write("Test");
  await delay(100);
  stdin.write("\r");
  await delay(100);
  t.true(onSubmit.calledWith("Test"));
});
test("respects maxLength", async (t) => {
  const { lastFrame, stdin } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { maxLength: 3 }))
  );
  await delay(100);
  stdin.write("A");
  await delay(100);
  stdin.write("B");
  await delay(100);
  stdin.write("C");
  await delay(100);
  stdin.write("D");
  await delay(200);
  t.log(lastFrame());
  t.true(lastFrame()?.includes("ABC"));
  t.false(lastFrame()?.includes("D"));
});
test("shows character counter when enabled", async (t) => {
  const { lastFrame, stdin } = render(
    /* @__PURE__ */ React.createElement(ShortcutProvider, null, /* @__PURE__ */ React.createElement(InputBox, { showCounter: true, maxLength: 10 }))
  );
  stdin.write("Hi");
  await delay(100);
  t.true(lastFrame()?.includes("2/10 characters"));
});
