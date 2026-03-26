# Fastify Primer for Express Developers

Everything you know transfers. This guide shows the differences.

---

## Why Fastify?

| Feature | Express | Fastify |
|---------|---------|---------|
| Speed | ~15,000 req/sec | ~30,000 req/sec |
| Async/Await | Manual wrapping | Native support |
| Validation | Middleware (express-validator) | Built-in (JSON Schema) |
| TypeScript | Bolted on | First-class |
| Plugins | Middleware | Encapsulated plugins |

For this project, the main benefits are: built-in validation, cleaner async handling, and better TypeScript integration.

---

## Side-by-Side Comparison

### Basic Server Setup

**Express:**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Fastify:**
```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });  // Built-in logging

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running on port 3000');
});
```

---

### Route Handlers

**Express:**
```javascript
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, name: 'John' });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: '123', name, email });
});
```

**Fastify:**
```typescript
app.get('/users/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  return { id, name: 'John' };  // No res.json() needed, just return
});

app.post('/users', async (request, reply) => {
  const { name, email } = request.body as { name: string; email: string };
  reply.code(201);
  return { id: '123', name, email };
});
```

**Key differences:**
- `req/res` → `request/reply`
- Handlers are `async` by default
- Just `return` the data (no `res.json()`)
- Use `reply.code()` instead of `res.status()`

---

### Route with Validation (Fastify's Superpower)

**Express (with express-validator):**
```javascript
const { body, validationResult } = require('express-validator');

app.post('/users',
  body('email').isEmail(),
  body('name').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... handle request
  }
);
```

**Fastify (built-in JSON Schema):**
```typescript
app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const { name, email } = request.body;  // Already validated!
  reply.code(201);
  return { id: '123', name, email };
});
```

Validation happens automatically. Invalid requests get a 400 response without your handler ever running.

---

### Middleware → Plugins & Hooks

**Express middleware:**
```javascript
// Global middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Route-specific
app.use('/admin', authMiddleware);
```

**Fastify hooks:**
```typescript
// Global hook (runs on every request)
app.addHook('onRequest', async (request, reply) => {
  console.log(`${request.method} ${request.url}`);
  // No next() needed - just return or throw
});

// Throw to stop the request
app.addHook('onRequest', async (request, reply) => {
  if (!request.headers.authorization) {
    reply.code(401);
    throw new Error('Unauthorized');
  }
});
```

**Fastify plugins (encapsulated middleware):**
```typescript
// plugins/auth.ts
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request, reply) => {
    const token = request.headers.authorization;
    if (!token) {
      reply.code(401);
      throw new Error('Missing token');
    }
    // Verify token, attach user to request
    request.user = await verifyToken(token);
  });
});

// Usage in routes
app.get('/protected', {
  preHandler: [app.authenticate]
}, async (request, reply) => {
  return { user: request.user };
});
```

---

### Error Handling

**Express:**
```javascript
app.get('/users/:id', (req, res, next) => {
  try {
    const user = findUser(req.params.id);
    if (!user) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Error handler middleware (at the end)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});
```

**Fastify:**
```typescript
app.get('/users/:id', async (request, reply) => {
  const user = findUser(request.params.id);
  if (!user) {
    reply.code(404);
    throw new Error('Not found');  // Just throw
  }
  return user;
});

// Custom error handler (optional)
app.setErrorHandler((error, request, reply) => {
  reply.code(error.statusCode || 500);
  return { error: error.message };
});
```

**Key difference**: Just throw errors. Fastify catches them automatically.

---

### Query Parameters & Body Parsing

**Express:**
```javascript
app.use(express.json());  // Need to add manually
app.use(express.urlencoded({ extended: true }));

app.get('/search', (req, res) => {
  const { q, limit } = req.query;  // Always strings
  res.json({ query: q, limit: parseInt(limit) });
});
```

**Fastify:**
```typescript
// JSON parsing is automatic

app.get('/search', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        q: { type: 'string' },
        limit: { type: 'integer', default: 10 }  // Coerced to number!
      }
    }
  }
}, async (request, reply) => {
  const { q, limit } = request.query;  // limit is already a number
  return { query: q, limit };
});
```

---

### Registering Routes from Separate Files

**Express:**
```javascript
// routes/users.js
const router = express.Router();
router.get('/', getUsers);
router.post('/', createUser);
module.exports = router;

// app.js
app.use('/users', require('./routes/users'));
```

**Fastify:**
```typescript
// routes/users.ts
import { FastifyInstance } from 'fastify';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', getUsers);
  fastify.post('/', createUser);
}

// app.ts
app.register(import('./routes/users'), { prefix: '/users' });
```

---

### Common Express Packages → Fastify Equivalents

| Express | Fastify |
|---------|---------|
| `express.json()` | Built-in |
| `cors` | `@fastify/cors` |
| `helmet` | `@fastify/helmet` |
| `express-rate-limit` | `@fastify/rate-limit` |
| `express-session` | `@fastify/session` |
| `cookie-parser` | `@fastify/cookie` |
| `express-validator` | Built-in JSON Schema |
| `multer` | `@fastify/multipart` |
| `express-ws` | `@fastify/websocket` |

**Registration pattern:**
```typescript
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

app.register(cors, { origin: true });
app.register(helmet);
```

---

## Full Example: REST API

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

// Plugins
app.register(cors);

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [];

// Routes
app.get('/users', async () => {
  return { users };
});

app.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
  const user = users.find(u => u.id === request.params.id);
  if (!user) {
    reply.code(404);
    throw new Error('User not found');
  }
  return user;
});

app.post<{ Body: { name: string; email: string } }>('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  }
}, async (request, reply) => {
  const { name, email } = request.body;
  const user: User = { id: crypto.randomUUID(), name, email };
  users.push(user);
  reply.code(201);
  return user;
});

app.delete<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
  const index = users.findIndex(u => u.id === request.params.id);
  if (index === -1) {
    reply.code(404);
    throw new Error('User not found');
  }
  users.splice(index, 1);
  reply.code(204);
});

// Start server
app.listen({ port: 3000 });
```

---

## Quick Reference Cheat Sheet

| Express | Fastify |
|---------|---------|
| `req` | `request` |
| `res` | `reply` |
| `res.json(data)` | `return data` |
| `res.status(201)` | `reply.code(201)` |
| `res.send()` | `return` or `reply.send()` |
| `next(err)` | `throw err` |
| `app.use(middleware)` | `app.addHook('onRequest', ...)` |
| `app.use('/path', router)` | `app.register(routes, { prefix: '/path' })` |
| `express.Router()` | `async function(fastify) { ... }` |

---

## Migration Strategy

1. **Start with Fastify structure** for new code
2. **Keep patterns familiar**: routes still look like routes
3. **Add validation schemas gradually** - they're optional
4. **Use hooks sparingly at first** - add as needed
5. **Leverage built-in features** instead of adding middleware

The mental model is the same: receive request, process, return response. The syntax is just slightly different.
