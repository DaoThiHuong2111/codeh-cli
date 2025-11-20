import React from "react";
import test from "ava";
import { render } from "ink-testing-library";
import { ConversationArea } from "../../../../dist/cli/components/organisms/ConversationArea.js";
import { Message } from "../../../../dist/core/domain/models/Message.js";
test("renders empty state", (t) => {
  const { lastFrame } = render(/* @__PURE__ */ React.createElement(ConversationArea, { messages: [], isLoading: false }));
  t.false(lastFrame()?.includes("You"));
  t.false(lastFrame()?.includes("Assistant"));
});
test("renders user message", (t) => {
  const msg = Message.user("Hello world");
  const { lastFrame } = render(/* @__PURE__ */ React.createElement(ConversationArea, { messages: [msg], isLoading: false }));
  t.true(lastFrame()?.includes("Hello world"));
  t.true(lastFrame()?.includes("You"));
});
test("renders assistant message", (t) => {
  const msg = Message.assistant("I am AI");
  const { lastFrame } = render(/* @__PURE__ */ React.createElement(ConversationArea, { messages: [msg], isLoading: false }));
  t.true(lastFrame()?.includes("I am AI"));
  t.true(lastFrame()?.includes("Assistant"));
});
test("renders loading state", (t) => {
  const { lastFrame } = render(/* @__PURE__ */ React.createElement(ConversationArea, { messages: [], isLoading: true }));
  t.true(lastFrame()?.includes("Thinking..."));
});
test("renders streaming state", (t) => {
  const msg = Message.assistant("Streaming...");
  const { lastFrame } = render(
    /* @__PURE__ */ React.createElement(
      ConversationArea,
      {
        messages: [msg],
        isLoading: true,
        streamingMessageId: msg.id
      }
    )
  );
  t.true(lastFrame()?.includes("Streaming..."));
  t.false(lastFrame()?.includes("Thinking..."));
});
