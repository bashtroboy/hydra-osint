# TypeScript Configuration Notes

## Our Approach: Relaxed Strictness

We're using a forgiving TypeScript configuration that allows gradual adoption.

### Current Settings (Relaxed)

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

**What this means:**
- You can use `any` when you're stuck
- Implicit `any` won't cause errors
- You can gradually add types as you learn

### Future Tightening (Optional)

As you get comfortable, you can progressively enable stricter checks:

```json
// Phase 1: Require explicit any
{ "noImplicitAny": true }

// Phase 2: Enable null checks
{ "strictNullChecks": true }

// Phase 3: Full strict mode
{ "strict": true }
```

### Per-File Escape Hatches

If one file is giving you trouble:

```typescript
// @ts-nocheck
// Put this at the top of a file to disable ALL type checking
```

Or for a single line:

```typescript
// @ts-ignore
problematicLine();
```

### Recommended Approach

1. Write code naturally
2. Add types where obvious (function parameters, interfaces for data)
3. Use `any` temporarily when stuck
4. Come back and fix `any` usage when you understand the types better
5. Eventually enable stricter settings

There's no rush. Working code is more important than perfect types.
