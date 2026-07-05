# @tael/types

The shared **domain kernel**. Everything the rest of the system agrees on lives here: value
objects, zod schemas, and the error taxonomy.

## Contents

- `Money` — a `bigint`-backed value object for USDC (7 decimals), safe from float rounding.
- `wallet` / `capability` / `payment` / `policy` — zod schemas + inferred types for the core domain.
- `errors` — `TaelError` and typed subclasses used across every layer.

## Rules

- **Belongs here:** types/schemas/value-objects shared by two or more workspaces.
- **Never here:** runtime side effects, I/O, framework code, or anything importing another `@tael/*`
  package. This package is the root of the dependency graph and stays dependency-free (except zod).
