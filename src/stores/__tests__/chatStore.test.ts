import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "@stores/chatStore";

vi.mock("@hooks/useTelemetry", () => ({
  sendTelemetryEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@utils/typingSimulation", async () => {
  const actual = await vi.importActual<typeof import("@utils/typingSimulation")>(
    "@utils/typingSimulation",
  );
  return {
    ...actual,
    humanDelay: vi.fn(() => 1),
  };
});

const streamChunks = (chunks: string[]) => {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
  );
};

const streamResponse = (events: string[]) =>
  streamChunks([events.map((event) => `data: ${event}`).join("\n\n")]);

const getLastRequestBody = () => {
  const fetchMock = vi.mocked(fetch);
  const body = fetchMock.mock.calls.at(-1)?.[1]?.body;
  expect(typeof body).toBe("string");
  return JSON.parse(body as string);
};

describe("chat store streaming", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const localStorageStub = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
    vi.stubGlobal("localStorage", localStorageStub);
    useChatStore.getState().clear();
    useChatStore.setState({
      isOpen: true,
      isMinimized: false,
      loading: false,
      messages: [],
      input: "",
      unread: 0,
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends null history on the first chat turn", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(["[DONE]"])));

    await useChatStore.getState().sendMessage("What work do you avoid taking on?");

    expect(getLastRequestBody()).toEqual({
      tone: "non-technical",
      history: null,
      message: "What work do you avoid taking on?",
    });
  });

  it("ignores stale saved response style state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(["[DONE]"])));
    useChatStore.setState({
      tone: "technical",
    } as never);

    await useChatStore.getState().sendMessage("How should I explain the project?");

    expect(getLastRequestBody()).toEqual({
      tone: "non-technical",
      history: null,
      message: "How should I explain the project?",
    });
  });

  it("removes legacy response style when migrating persisted chat state", async () => {
    const migrate = useChatStore.persist.getOptions().migrate;
    expect(migrate).toBeTypeOf("function");

    const migrated = await migrate?.(
      {
        tone: "technical",
        messages: [],
        input: "saved draft",
      },
      1,
    );

    expect(migrated).toEqual({
      messages: [],
      input: "saved draft",
    });
  });

  it("sends only prior turns as history on later chat turns", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamResponse(["[DONE]"])));
    useChatStore.setState({
      messages: [
        {
          id: "first-user",
          role: "user",
          content: "What work do you avoid taking on?",
          createdAt: 1,
        },
        {
          id: "first-assistant",
          role: "assistant",
          content: "I avoid work where I cannot be useful or safe.",
          createdAt: 2,
        },
      ],
    });

    await useChatStore.getState().sendMessage("Can you give examples?");

    expect(getLastRequestBody()).toEqual({
      tone: "non-technical",
      history: [
        {
          role: "user",
          content: "What work do you avoid taking on?",
        },
        {
          role: "assistant",
          content: "I avoid work where I cannot be useful or safe.",
        },
      ],
      message: "Can you give examples?",
    });
  });

  it("does not start a second request while a response is loading", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    useChatStore.setState({
      loading: true,
      input: "Second message",
      messages: [
        {
          id: "streaming",
          role: "assistant",
          content: "Partial",
          createdAt: 1,
        },
      ],
    });

    await useChatStore.getState().sendMessage();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useChatStore.getState().input).toBe("Second message");
  });

  it("renders streamed response deltas exactly once in order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamResponse([
          JSON.stringify({ response: "You" }),
          JSON.stringify({ response: " can" }),
          JSON.stringify({ response: " start" }),
          JSON.stringify({ response: " by" }),
          JSON.stringify({ response: " telling" }),
          JSON.stringify({ response: " me" }),
          JSON.stringify({ response: " a" }),
          JSON.stringify({ response: " bit" }),
          JSON.stringify({ response: " about" }),
          JSON.stringify({ response: " your" }),
          JSON.stringify({ response: " project" }),
          JSON.stringify({ response: "." }),
          JSON.stringify({ response: "", usage: { total_tokens: 42 } }),
          "[DONE]",
        ]),
      ),
    );

    await useChatStore.getState().sendMessage("Where should I start?");
    await vi.runAllTimersAsync();

    const assistantMessages = useChatStore
      .getState()
      .messages.filter((message) => message.role === "assistant");

    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0].content).toBe(
      "You can start by telling me a bit about your project.",
    );
  });

  it("preserves streamed response data split across network chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamChunks([
          'data: {"res',
          'ponse":"Hel"}\n\ndata: {"response":"lo"}\n\ndata: [DONE]',
        ]),
      ),
    );

    await useChatStore.getState().sendMessage("Say hello");
    await vi.runAllTimersAsync();

    const assistantMessages = useChatStore
      .getState()
      .messages.filter((message) => message.role === "assistant");

    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0].content).toBe("Hello");
  });
});
