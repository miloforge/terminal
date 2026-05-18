---
title: "Tradeoffs when Designing"
date: "2025-04-20"
slug: design-tradeoffs
description: "What EVM's LOG0 to LOG4 opcodes can teach us about API design, performance, and trade-offs in low-level systems."
tags: ["Architecture & System Design"]
authors: ["milad"]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

When designing software interfaces—especially APIs—it's tempting to favor flexibility and abstraction. But there are domains where performance, predictability, and simplicity demand a different mindset.

This is what **design is about**: the **Tradeoffs**.

Let's take Ethereum Virtual Machine (EVM) as an example:

<!--truncate-->

The `EVM` provides `LOG` opcodes to emit events—data that is not stored on-chain but is accessible to off-chain clients via logs. Each `LOG`n takes a fixed number of indexed topics (for filtering) and a pointer to data in `memory` (for payload).
Rather than a single flexible `LOG` opcode with dynamic topic handling, the EVM defines five fixed variants—`LOG0` through `LOG4`—each hardwired for a specific number of indexed topics.

- `LOG0`: emits a log with 0 indexed topics
- `LOG1`: emits a log with 1 indexed topic
- `LOG2`: emits a log with 2 indexed topics
- `LOG3`: emits a log with 3 indexed topics
- `LOG4`: emits a log with 4 indexed topics

This design decision might seem peculiar at first. Why not just define a single opcode that takes a dynamic array of topics?

Let’s break this down.

---

## 🧠 the Why

> Simplicity, Performance, and Determinism

### 1. Performance

The EVM is optimized for **maximum execution efficiency**. Each opcode in the EVM has a **fixed `gas` cost** and a **static `stack` signature** (i.e., the number and type of parameters it consumes).

With `LOG0` to `LOG4`, the number of topics is known **at compile time**. That means the EVM avoids runtime checks and can apply simpler `stack` operations, which improves both predictability and speed.

In a `gas`-constrained environment like Ethereum, these savings matter.

### 2. Simplicity

Fixed-function opcodes are easier to implement and reason about. If the EVM supported a dynamic array of topics:

- It would need to verify the array length at runtime
- More edge cases and attack vectors could appear
- The internal complexity of the EVM would increase

Instead, by limiting the options to exactly five cases, the system remains **lean and predictable**.

### 3. Determinism

Every Ethereum node runs the same transactions, verifying them independently to reach consensus. Deterministic behavior—where execution outcomes are 100% predictable—is **non-negotiable**.

Having fixed opcodes helps guarantee that behavior is **repeatable and unambiguous**, regardless of who’s running the node.

---

## ⚖️ The Trade-Off

> Flexibility vs. Predictability

:::warning
While this trade-off leans toward simplicity, some modern systems attempt to bridge the gap—using JITs, intermediate representations, or lazy evaluation. But in consensus-critical environments like blockchains, those complexities carry greater risk.
:::

From a high-level API perspective—especially if you’re coming from modern languages like Python, TypeScript, or Rust—it might feel natural to want a single, generic `log(topics: Topic[])` method.

But that kind of flexibility would require:

- Dynamic `memory` management
- Array bounds checking
- Variable `gas` computation

In high-performance, low-level systems (like the EVM), these conveniences come at too high a cost. So instead, the EVM designers **sacrificed flexibility** for **raw performance and simplicity**.

> It’s not elegant—but it’s fast, secure, and predictable.

Example: Protocol Buffers, hardware interrupts, syscalls, etc., often favor fixed schemas over flexibility to preserve determinism and speed.

:::note
In higher-level environments where developer speed or evolving requirements matter more than raw performance, the tradeoff can tilt the other way.
:::

---

## 🧪 The Takeaway

for API Designers:

This design teaches us a broader lesson: when creating APIs, especially for performance-critical environments, it's often better to:

- Avoid general-purpose solutions if they introduce runtime overhead
- Favor **specialized, explicit methods** that are easier to optimize and reason about
- Be honest about the trade-offs you’re making

<Tabs>
  <TabItem value="junior" label="👶 For Juniors" default>

Don’t worry if LOG0-LOG4 feels weird. Just know that:

- They're how Solidity emits events.
- More topics = more filtering power.
- Each topic is an indexed parameter you can search for on-chain.

You don’t need to memorize all this right away—but keep the idea in your toolbox for when you’re designing your own code.

  </TabItem>
  <TabItem value="midlevel" label="🧑‍💻 For Mid-Level Devs">

Think of it like syscall design or embedded programming: tighter control beats abstraction when `gas`, `memory`, or latency is on the line. These opcode patterns are a peek behind Solidity’s high-level sugar and hint at where abstraction starts and ends.

  </TabItem>
  <TabItem value="cto" label="👨‍💼 For Non developers">

This example illustrates how a thoughtful developer approaches trade-offs—not just writing code, but understanding how abstraction decisions impact performance, security, and system behavior.

If you're looking for engineers who think beyond the framework and understand constraints at the metal level—this is the kind of thinking to look for.

  </TabItem>
</Tabs>

---

## ⚖️🤔 Philosophical tension

Systems engineers often ask: how much should we trade predictability for ease of use? Predictable systems are easier to test, debug, and secure. But making things easier for developers—like flexible APIs or smart defaults—can add hidden risks or slow things down. In areas like blockchains or real-time systems, even small surprises can cause big problems. That’s why engineers sometimes give up convenience to keep things simple and clear. It’s not just about code—it’s about trust and control. The right choice depends on what matters more: speed of building, or safety in running.

---

## 📌 Final Thought

In environments where every cycle counts, the best design isn't always the most elegant—it’s the one that removes ambiguity, enforces limits, and still gets the job done.

---

## 🔗 Further Reading

- [Solidity Docs: Events and Logging](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EVM Opcodes Reference](https://www.evm.codes/)
