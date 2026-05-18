---
title: "Borrow or Take?"
date: "2025-11-05"
description: "Building the mental model of how data is handled in Rust."
slug: rust-iterators
tags: ["Rust"]
authors: ["milad"]
---

## The Problem
At first, I was lost, should I `iter()` or `into_iter()`? 

I don't want to memorize, I want to understand.
I just look at **what I have** (a reference, a value, or a mutable reference), then ask **what kind of items I want to pull out**.

Rust gives us three main entry points:
- `.iter()` -> iterate over `&T` or yields reference
- `.iter_mut()` -> iterate over `&mut T` or yields mutable reference
- `.into_iter()` -> consume and yield `T`

Everything else is a variant of these.

### Example 1: Consuming 
```rust
fn main() { 
  let v = vec![10, 20, 30];



  // calls .into_iter() under the hood
  for i  in v {
    println!("{i}")
  }
  // Prints: 
  // 10
  // 20
  // 30
// but then v is gone (moved)!

// so 
dbg!(v);
// would fail (value used after move).

}
```
To prevent i from happen, borrow v:

### Example 2: Borrowing

```rust
fn main() {

  let v = vec!{1,2,3};

  // equal to .iter()
  for i in &v {
    println!("{i}");
  }

  for i in v.iter() {
    println!("{i}");
  }

  // then v is still available in the scope

  dbg!(v);
  // which will print: v = [ 1, 2, 3]
}
```

## Takeaway

Keep container (`v`):
- Read only -> `.iter()`
- Modify in place -> `.iter_mut()`
Drop container:
- Take ownership -> `.into_iter()`


