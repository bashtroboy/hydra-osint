# CLAUDE.md

This file provides guidance for Claude Code when working on the HYDRA OSINT platform.

## Project Overview

HYDRA is a web-based OSINT (Open Source Intelligence) platform that collects public intelligence data from multiple sources (ADS-B, AIS, RSS, BGP, seismic), correlates events, performs traffic analysis, and integrates historical/educational SIGINT content.

**Tech Stack**: Node.js 20 LTS, TypeScript, Turborepo, pnpm, Fastify, PostgreSQL/PostGIS/TimescaleDB, Redis, BullMQ, React, Drizzle ORM, Zod

## Coding Standards

### TypeScript
- Strict mode enabled (`strict: true`) - no exceptions
- No `any` types - use `unknown` with type guards if type is truly unknown
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `as const` for literal types and enums
- Explicit return types on exported functions

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`, `adsb-collector.ts`)
- **Directories**: kebab-case (`data-sources/`, `job-queues/`)
- **Classes/Interfaces/Types**: PascalCase (`UserService`, `AircraftEntity`)
- **Functions/Variables**: camelCase (`fetchAircraftPositions`, `entityCount`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS`)
- **Database tables**: snake_case (`audit_logs`, `data_sources`)

### Code Organization
- One exported class/major function per file
- Group related utilities in a single file with named exports
- Index files (`index.ts`) only for re-exporting public API
- Keep files under 300 lines - split if larger

### Error Handling
- Use custom error classes from `@hydra/core`
- Never swallow errors silently - log or rethrow
- Use Result types for operations that can fail expectedly
- Validate all external input at system boundaries

### Async/Promises
- Prefer `async/await` over `.then()` chains
- Always handle promise rejections
- Use `Promise.all()` for independent concurrent operations
- Add timeouts to external service calls

## Documentation Requirements

### Code Documentation
- JSDoc comments on all exported functions, classes, and types
- Include `@param`, `@returns`, and `@throws` tags
- Add `@example` for non-obvious usage
- Inline comments only for "why", not "what"

### When to Update Docs
- New feature: Update relevant docs before PR
- API changes: Update OpenAPI spec and any affected docs
- Bug fixes: Add note if it affects documented behavior
- Schema changes: Update schema documentation

### Documentation Locations
- `docs/` - Project documentation, architecture decisions
- `docs/api/` - OpenAPI specifications
- `README.md` files in each package - Package-specific usage
- JSDoc in code - Function/type documentation

## Testing

### Requirements
- All new code requires unit tests
- Integration tests for API endpoints
- Collectors require both unit tests and integration tests with mocked external APIs
- Target 80%+ code coverage for new code

### Test Organization
- Test files adjacent to source: `user-service.ts` -> `user-service.test.ts`
- Or in `__tests__/` directory within the package
- Name tests descriptively: `"should return 404 when entity not found"`

### Test Practices
- One assertion per test when practical
- Use factories/fixtures for test data
- Mock external services, not internal modules
- Clean up test data after tests

## Git & Workflow

### Branch Naming
- `feature/<issue-number>-short-description` (e.g., `feature/7-adsb-collector`)
- `fix/<issue-number>-short-description`
- `docs/<description>`
- `refactor/<description>`

### Commit Messages
Use conventional commits:
```
feat(adsb): add OpenSky Network API client
fix(api): handle rate limit errors gracefully
docs(readme): add development setup instructions
refactor(core): extract geo utilities to separate module
test(ais): add NMEA parser unit tests
chore(deps): update drizzle-orm to 0.30.0
```

### Pull Requests
- Reference the issue number in PR description
- Include summary of changes
- Add test plan or verification steps
- Keep PRs focused - one feature/fix per PR

## Security Considerations

### Sensitive Data
- Never log passwords, tokens, or API keys
- Use environment variables for all secrets
- Redact sensitive fields in audit logs
- No secrets in code or commits

### Input Validation
- Validate all user input with Zod schemas
- Sanitize data before database queries (Drizzle handles this)
- Use parameterized queries only
- Validate file uploads (type, size, content)

### Dependencies
- Prefer well-maintained packages with security track records
- Run `pnpm audit` before adding new dependencies
- Keep dependencies updated

## Project-Specific Patterns

### Database Access
- Use Drizzle ORM for all database operations
- Define schemas in `@hydra/database`
- Use transactions for multi-table operations
- Add appropriate indexes for query patterns

### API Design
- RESTful endpoints under `/api/v1/`
- Use Zod schemas for request/response validation
- Consistent error response format
- Include correlation IDs in responses

### Job Processing
- Use BullMQ for all background jobs
- Implement idempotent job handlers
- Add appropriate retry strategies
- Log job start/completion/failure

### Collectors
- Implement graceful shutdown
- Respect rate limits of external APIs
- Cache entity lookups to reduce DB load
- Emit metrics for monitoring

## Monorepo Structure

```
hydra/
├── apps/           # Deployable applications
│   ├── api/        # Fastify REST API
│   ├── web/        # React frontend
│   └── cli/        # Command-line tool
├── packages/       # Shared libraries
│   ├── core/       # Utilities, errors, constants
│   ├── collectors/ # Data collection modules
│   ├── database/   # Drizzle schemas, migrations
│   ├── schemas/    # Zod validation schemas
│   └── security/   # Auth, RBAC, audit logging
├── workers/        # Background job processors
└── docs/           # Documentation
```

### Package Dependencies
- `apps/` can depend on `packages/`
- `packages/` should minimize inter-dependencies
- `workers/` can depend on `packages/`
- Circular dependencies are not allowed

## Commands Reference

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development servers
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Run linting
pnpm typecheck        # Run TypeScript checks
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate migration from schema changes
```

## Notes & Preferences

<!-- Add any additional preferences, context, or notes here -->

