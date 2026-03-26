# TypeScript Primer for JavaScript Developers

A practical guide to get productive quickly. No fluff.

---

## The Core Idea

TypeScript = JavaScript + Types. Your JS code is already valid TS. You're just adding annotations that help catch bugs before runtime.

```javascript
// JavaScript
function greet(name) {
  return `Hello, ${name}`;
}
```

```typescript
// TypeScript - same thing, with type annotation
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

The `: string` tells TypeScript (and other developers) what goes in and comes out.

---

## The Basics (90% of what you'll use)

### Primitive Types

```typescript
let name: string = "Darren";
let age: number = 35;
let isActive: boolean = true;
let data: null = null;
let value: undefined = undefined;
```

### Arrays

```typescript
let numbers: number[] = [1, 2, 3];
let names: string[] = ["Alice", "Bob"];

// Alternative syntax (same thing)
let scores: Array<number> = [100, 95, 88];
```

### Objects with Interfaces

This is where TypeScript shines. Define the shape of your data once, use it everywhere.

```typescript
// Define the shape
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;        // ? means optional
  role: "admin" | "user";  // Union type - only these values allowed
}

// Use it
const user: User = {
  id: "123",
  name: "Darren",
  email: "darren@example.com",
  role: "admin"
  // age is optional, so we can skip it
};

// TypeScript will yell if you try:
// user.role = "superuser";  // Error: not "admin" or "user"
// user.foo = "bar";         // Error: 'foo' doesn't exist on User
```

### Functions

```typescript
// Parameters and return type
function add(a: number, b: number): number {
  return a + b;
}

// Arrow functions
const multiply = (a: number, b: number): number => a * b;

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}`;
}

// Default parameters (same as JS)
function greet2(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}`;
}

// Function that doesn't return anything
function log(message: string): void {
  console.log(message);
}

// Async functions
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

---

## Type Inference (Let TypeScript Do the Work)

You don't always need to annotate. TypeScript is smart.

```typescript
// TypeScript infers these automatically
let name = "Darren";        // inferred as string
let count = 42;             // inferred as number
let items = ["a", "b"];     // inferred as string[]

// You only need annotations when:
// 1. TypeScript can't figure it out
// 2. You want to be explicit for readability
// 3. Function parameters (always annotate these)

function process(data) {     // Error: 'data' has implicit 'any'
  return data.value;
}

function process(data: { value: string }) {  // Good
  return data.value;
}
```

---

## Common Patterns You'll Use

### Working with API Responses

```typescript
// Define what the API returns
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface Aircraft {
  icao24: string;
  callsign: string | null;  // Can be string OR null
  latitude: number;
  longitude: number;
}

// Use it
async function fetchAircraft(): Promise<ApiResponse<Aircraft[]>> {
  const res = await fetch("/api/aircraft");
  return res.json();
}

// Now TypeScript knows exactly what you get back
const response = await fetchAircraft();
if (response.success) {
  response.data.forEach(aircraft => {
    console.log(aircraft.callsign);  // TypeScript knows this exists
  });
}
```

### Extending Interfaces

```typescript
// Base interface
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend it
interface Aircraft extends Entity {
  icao24: string;
  callsign: string | null;
  position: {
    lat: number;
    lon: number;
  };
}

// Aircraft now has id, createdAt, updatedAt, plus its own fields
```

### Union Types (This OR That)

```typescript
// Value can be one of these
type Status = "pending" | "active" | "completed";

// Parameter can be string or number
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.toUpperCase();
}
```

### Type for Object Keys

```typescript
// When you have dynamic keys
interface Config {
  [key: string]: string | number | boolean;
}

const config: Config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: true
};
```

---

## The "Relaxed" TypeScript Config

Our tsconfig.json will be forgiving:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": false,           // Not enforcing all strict checks
    "noImplicitAny": false,    // 'any' is allowed when you're stuck
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**What this means**: If you get stuck, you can use `any` to bypass type checking temporarily. As you learn, you can tighten these settings.

---

## Escape Hatches (When You're Stuck)

### The `any` Type

```typescript
// When you don't know or don't care about the type
let data: any = fetchSomething();
data.whatever.you.want;  // No errors, no help

// Use sparingly - it defeats the purpose of TypeScript
```

### Type Assertions

```typescript
// When you know better than TypeScript
const element = document.getElementById("app") as HTMLDivElement;

// Or when parsing JSON
const data = JSON.parse(jsonString) as User;
```

### Ignoring Errors

```typescript
// Skip the next line's type check (last resort)
// @ts-ignore
someProblematicCode();

// Or skip the whole file
// @ts-nocheck (at top of file)
```

---

## Quick Reference Cheat Sheet

```typescript
// Primitives
let s: string;
let n: number;
let b: boolean;

// Arrays
let arr: string[];
let arr2: Array<number>;

// Objects
interface Thing {
  required: string;
  optional?: number;
}

// Functions
function fn(param: string): number { return 0; }
const arrow = (x: number): string => x.toString();
async function asyncFn(): Promise<Data> { }

// Union (OR)
type Status = "on" | "off";
let value: string | number;

// Generics (type placeholder)
interface Box<T> {
  contents: T;
}
let stringBox: Box<string> = { contents: "hello" };
let numberBox: Box<number> = { contents: 42 };

// Extending
interface Child extends Parent { }

// Type from existing object
const config = { url: "", port: 3000 };
type Config = typeof config;  // { url: string; port: number }
```

---

## Learning Path

1. **Week 1**: Just add `: string`, `: number`, `: boolean` to function parameters
2. **Week 2**: Create interfaces for your data shapes (API responses, database records)
3. **Week 3**: Use generics for reusable code (`Promise<T>`, `Array<T>`)
4. **Week 4**: Explore union types and type guards
5. **Ongoing**: Gradually tighten tsconfig as you get comfortable

You don't need to master TypeScript before starting. Write JavaScript, add types where it helps, and learn as you go.
