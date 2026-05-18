---
title: "Algorithm choice > implementation optimization"
date: "2025-08-09"
description: "Everyone says “Rust is fast”, but is it guaranteed? Not necessarily, unless you choose the right algorithm for the underlying problem."
slug: algorithm-beats-language
tags: ["Software Engineering & Practices", "Rust"]
authors: ["milad"]
---
# Rust Code Million Times Faster — How the Right Algorithm Beats Raw Language Speed

Everyone says *“Rust is fast”* — but that alone isn’t enough.  
Raw language speed can be dwarfed by the choice of **algorithm** for the underlying problem.

In this post, we’ll benchmark five different Rust Fibonacci implementations —  
from textbook recursion to fast doubling with big integers —  
to demonstrate how algorithmic complexity shapes real-world performance.

---

## Why Benchmark

Never trust assumptions about speed or complexity without benchmarking your actual use case.
Even in a language like Rust, the difference between a naive and optimized algorithm can be *millions of times* faster.  
This is the power of algorithmic thinking combined with Rust’s performance.

> **Note on Benchmarking Accuracy:**  
> We use Criterion.rs for benchmarking, which leverages [`black_box`](https://doc.rust-lang.org/std/hint/fn.black_box.html) to prevent compiler optimizations that could eliminate or inline computations, ensuring benchmarks measure true runtime costs.


---

## Problem Definition

> Given an integer `n`, calculate the n-th Fibonacci number:
>
> ```rust
> F(0) = 0, F(1) = 1
> F(n) = F(n-1) + F(n-2) for n > 1
> ```
In practice, constraints drastically affect which approach is appropriate:

- **Small `n` (≤ 40):** recursion may suffice.
- **Large `n` (≥ 10⁷):** naive recursion is impossible; need iterative or advanced methods.
- **Performance goals:** is correctness enough, or do we require *fastest possible*?

---

## Approaches

### 1. Recursive O(2ⁿ)

```rust
/// Naive recursive; Exponential time | O(2ⁿ)
pub fn fibo_1(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        n => fibo_1(n - 1) + fibo_1(n - 2),
    }
}
```

#### Benchmark

| n  | Time      |
| -- | --------- |
| 10 | 95 ns     |
| 20 | 12.3 µs   |
| 30 | 1.40 ms   |
| 40 | 184.4 ms  |

:::warning Why this fails
    Every subproblem is recomputed many times.
    fib(4) computes fib(3) twice, fib(2) three times, etc.
    This causes exponential runtime explosion.
:::

### 2. Memoized Recursion O(n)

```rust 
/// Use cache to avoid recomputation | Linear | O(n) time & space
pub fn fibo_2(n: u32, cache: &mut Vec<u128>) -> u128 {
    if cache[n as usize] != u128::MAX {
        return cache[n as usize];
    }
    cache[n as usize] = fibo_2(n - 1, cache) + fibo_2(n - 2, cache);
    cache[n as usize]
}

```
#### Benchmark

| n     | Time    |
| ----- | ------- |
| 10    | 57 ns   |
| 20    | 107 ns  |
| 30    | 222 ns  |
| 40    | 319 ns  |
| 100   | 0.99 µs |

Big improvement — now `n` values into the thousands are feasible, but with some downsides::
- Recursion overhead remains.
- Cache initialization and maintenance cost exist.


### 3. Iterative O(n)

```rust 
/// Fast, simple iteration using u128 | Linear | O(n)
pub fn fibo_3(n: u64) -> u128 {
    if n < 2 { return n as u128; }
    let (mut prev, mut curr) = (0u128, 1u128);
    for _ in 2..=n {
        let next = prev + curr;
        prev = curr;
        curr = next;
    }
    curr
}
```

#### Benchmark
| n     | Time   |
| ----- | ------ |
| 50    | 30 ns  |
| 60    | 34 ns  |
| 70    | 38 ns  |
| 80    | 43 ns  |
| 90    | 48 ns  |
| 100   | 53 ns  |

:::warning Limitation
    u128 overflows at around n ≈ 186.
    For larger `n`, _BigUint_ or other big-integer types are necessary, with higher costs.
:::

### 4. Big Integer O(n), scalable to huge n

```rust
/// Iterative (BigUint)
pub fn fibo_3_scaled(n: u64) -> BigUint {
    if n < 2 { return n.into(); }
    let (mut prev, mut curr) = (BigUint::ZERO, BigUint::ONE);
    for _ in 2..=n {
        let next = &prev + &curr;
        prev = curr;
        curr = next;
    }
    curr
}
```
#### Benchmark
| n     | Time   |
| ----- | ------ |
| 10    | 100 ns |
| 100   | 1.03 µs|
| 1000  | 11.0 µs|


While the algorithm remains `O(n)`, each addition involves expensive big-integer operations.
This slows down performance compared to fixed-size integer arithmetic.

### 5. Fast Doubling O(log n)
```rust 
/// Logarithmic O(log n) using Fast Doubling
pub fn fibo_4(n: u64) -> BigUint {
    fn fib_pair(n: u64) -> (BigUint, BigUint) {
        if n == 0 {
            (BigUint::ZERO, BigUint::ONE)
        } else {
            let (a, b) = fib_pair(n >> 1);
            let two = BigUint::from(2u8);
            let c = &a * (&b * &two - &a);
            let d = &a * &a + &b * &b;
            if n & 1 == 0 { (c, d) } else { (d.clone(), &c + &d) }
        }
    }
    fib_pair(n).0
}
```
This method efficiently handles massive `n` values (millions or billions) —
the runtime grows logarithmically with `n`, plus the cost of big-integer multiplications.

#### Benchmark
|   n       |  Time  |
| --------- | ------ |
| 10        | 269 ns |
| 100       | 577 ns |
| 1000      | 995 ns |
| 10_000    | 6.8 µs |
| 1_000_000 | 8.34 ms|
| 10_000_000| 260 ms |
|100_000_000| 7 s    |

---

### Summary

| Method         | Complexity | n=40     | n=100   | n=1,000 | n=1,000,000 |
| -------------- | ---------- | -------- | ------- | ------- | ----------- |
| fibo\_1        | O(2ⁿ)      | 184.4 ms | 🚫      | 🚫      | 🚫          |
| fibo\_2        | O(n)       | 319 ns   | 0.99 µs | 🚫      | 🚫          |
| fibo\_3        | O(n)       | 199 ns   | 53 ns   | 🚫      | 🚫          |
| fibo\_3\_scaled| O(n)       | 100 ns   | 1.03 µs | 11.0 µs | 🚫          |
| fibo\_4        | O(log n)   | 269 ns   | 577 ns  | 995 ns  | 8.34 ms     |

“–” indicates impractical runtime or integer overflow.


## Takeaway
1. Don’t trust raw language speed alone: algorithm complexity dominates runtime.
2. Recursion without memoization grows exponentially and quickly becomes unusable.
3. Iterative methods eliminate recursion overhead and scale much better.
4. Big integer arithmetic is costly but necessary for very large Fibonacci numbers.
5. Fast doubling (O(log n)) is the asymptotically fastest exact method and handles massive inputs.
6. Always benchmark with your real input sizes and constraints before choosing an approach.


## Impossible → Instant
Comparing runtimes for various inputs:
* `fibo_1(40)` → 184.4 ms
* `fibo_3_scaled(40)` → 100 ns
* `fibo_4(1,000,000)` → 8.34 ms

This means the optimized implementation (`fibo_3`) is over 22,000× faster than the naive recursive method on the same input, and orders of magnitude faster even when computing a problem 25,000 times larger.

If we compare computing n=1,000,000 using naive recursion (**impossible in practice**) vs. fast doubling, the theoretical speedup exceeds 10²⁰× —
effectively turning a computation that would take longer than the age of the universe into milliseconds.

:::note
When scale grows, algorithmic complexity consistently outperforms raw language speed — every time.
:::


## Reproduce & Explore
Want to dive deeper or run the benchmarks yourself?
Check out the full source code and Criterion benchmarks here:

GitHub repo: https://github.com/0xsecaas/algs

Benchmark code: [benches/fib_bench.rs](https://github.com/0xsecaas/algs/blob/main/benches/fib_bench.rs)

Feel free to clone, experiment, and customize!
