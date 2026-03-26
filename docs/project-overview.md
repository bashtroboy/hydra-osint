# HYDRA: OSINT Collection & Analysis Platform

## Project Overview

A web-based OSINT (Open Source Intelligence) platform that collects public intelligence data from multiple sources (ADS-B, AIS, RSS, BGP, seismic), correlates events, performs traffic analysis, and integrates historical/educational SIGINT content.

**Purpose**: Portfolio project demonstrating technical capability and domain knowledge for a Canadian government security/intelligence position.

**Background**: Built by a former Canadian Navy radio communications specialist with amateur radio operator certification and deep interest in signals intelligence history.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20 LTS + TypeScript | Familiar stack, excellent for async I/O |
| **Monorepo** | Turborepo + pnpm | Modern package management, efficient builds |
| **API** | Fastify | 2x faster than Express, TypeScript-first |
| **Database** | PostgreSQL + PostGIS + TimescaleDB | Geospatial + time-series capabilities |
| **Cache/Queue** | Redis + BullMQ | Real-time pub/sub, job scheduling |
| **Frontend** | React + Vite + MapLibre GL + shadcn/ui | Modern, performant, open-source mapping |
| **CLI** | Commander.js + Ink | Professional terminal interface |
| **Validation** | Zod | Runtime type safety |
| **ORM** | Drizzle | Type-safe, lightweight, SQL-like |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Web Dashboard│  │  CLI Tool   │  │  REST API   │              │
│  │ (React/Maps) │  │ (Ink TUI)   │  │ (Fastify)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                              │
│  Collection | Correlation | Analysis | Enrichment | Educational │
├─────────────────────────────────────────────────────────────────┤
│  DATA INGESTION LAYER                                           │
│  ADS-B | AIS | RSS | BGP | USGS | NOTAM | Archives              │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  PostgreSQL + PostGIS | Redis | TimescaleDB                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
hydra/
├── apps/
│   ├── api/              # Fastify REST API + WebSocket
│   ├── web/              # React dashboard with maps
│   └── cli/              # Terminal tool with TUI
├── packages/
│   ├── core/             # Shared business logic
│   ├── collectors/       # Data collection plugins
│   ├── database/         # Drizzle schemas + migrations
│   ├── schemas/          # Zod validation schemas
│   └── security/         # Auth, audit, RBAC
├── workers/              # Background job processors
├── docs/
│   ├── architecture/
│   ├── api/              # OpenAPI spec
│   └── educational/      # SIGINT history, traffic analysis
└── docker/
```

---

## Data Sources

### Primary (Free/Open)

| Source | Type | Description |
|--------|------|-------------|
| **OpenSky Network** | ADS-B | Global aircraft positions via REST API |
| **AISHub** | AIS | Community vessel tracking (NMEA feeds) |
| **RIPE RIS Live** | BGP | Real-time routing updates via WebSocket |
| **USGS** | Seismic | Earthquake data (REST/GeoJSON) |
| **NOAA** | Weather | Weather alerts and satellite data |

### Historical/Educational

| Source | Type | Description |
|--------|------|-------------|
| **NSA.gov** | VENONA | Declassified Soviet cryptanalysis |
| **archive.org** | Numbers Stations | Historical SIGINT recordings |
| **NARA** | Archives | National Archives declassified materials |

### Canadian-Specific (Bonus)

- Transport Canada NOTAM
- Environment Canada weather alerts
- Canadian Coast Guard AIS

---

## Key Features

### 1. Intelligence Collection
- Real-time ADS-B aircraft tracking with entity persistence
- AIS vessel monitoring with track history
- RSS/news feed aggregation with keyword alerting
- BGP anomaly detection for network intelligence
- Geospatial event clustering using PostGIS

### 2. Correlation Engine
- **Temporal Proximity**: Events occurring within configurable time windows
- **Spatial Clustering**: DBSCAN-based geographic clustering
- **Entity Co-occurrence**: Track when entities appear together
- **Multi-source Fusion**: Correlate signals across different data types

### 3. Traffic Analysis
Demonstrates SIGINT concepts without accessing content:
- Communication timing patterns (regular vs. irregular)
- Metadata analysis (who, when, where - not what)
- Pattern-of-life detection
- Anomaly flagging based on behavioral baselines

### 4. Educational Integration
- Historical SIGINT context (VENONA, numbers stations, WWII Y-Service)
- In-app educational sidebars linking current data to historical concepts
- Archive document browser with declassified materials
- Interactive learning modules on traffic analysis

### 5. Security (Demonstrating Awareness)
- Defense in depth (TLS 1.3, CSP headers, rate limiting)
- OWASP Top 10 mitigations documented in code
- Comprehensive audit logging with hash chain integrity
- RBAC with role-based API permissions
- Encrypted credential storage (no hardcoded secrets)

---

## Development Phases

### Phase 1: Foundation (Weeks 1-3)
- Monorepo setup (Turborepo + pnpm)
- PostgreSQL + PostGIS + TimescaleDB via Docker
- Database schemas with Drizzle ORM
- Fastify API skeleton with authentication
- ADS-B and AIS collectors
- BullMQ job queues

### Phase 2: Visualization (Weeks 4-6)
- React + Vite frontend
- MapLibre GL geospatial display
- Real-time WebSocket data feed
- Entity markers and track visualization
- Dashboard layout with shadcn/ui

### Phase 3: Intelligence Features (Weeks 7-9)
- Correlation service implementation
- Traffic analysis module
- Correlation visualization UI
- Alerting system (geofence, entity watch, anomaly)

### Phase 4: Educational & Archives (Weeks 10-11)
- Archive document scraper
- Archive search interface
- Educational content writing
- Sidebar integration

### Phase 5: CLI & Polish (Weeks 12-13)
- Commander.js CLI with Ink TUI
- Query/export commands
- Security audit
- E2E tests (Playwright)
- Documentation finalization

---

## What Makes This Impressive

### For Government Security Evaluators

1. **Security-First Architecture**
   - Audit logging with integrity verification
   - OWASP mitigations documented in code
   - No hardcoded credentials

2. **Domain Knowledge Demonstration**
   - SIGINT collection disciplines
   - Traffic analysis implementation
   - Geospatial intelligence fundamentals
   - Radio communications expertise (HF, ADS-B, AIS)

3. **Analytical Capability**
   - Multi-source intelligence fusion
   - Temporal and spatial pattern detection
   - Entity relationship mapping
   - Anomaly detection frameworks

4. **Professional Engineering**
   - Clean architecture with separation of concerns
   - TypeScript strict mode
   - Comprehensive testing
   - CI/CD with security scanning

5. **Unique Differentiator**
   - Educational integration shows teaching ability
   - Historical context demonstrates research capability
   - Military background integration

---

## Interview Talking Points

**Technical Discussions:**
- "I implemented defense-in-depth security across all layers..."
- "The correlation engine uses temporal and spatial clustering to..."
- "The audit logging is tamper-evident using hash chains..."

**Domain Knowledge:**
- "Having worked with HF communications in the Navy, I understood..."
- "The VENONA materials demonstrate how traffic analysis revealed..."
- "ADS-B and AIS share similar broadcast characteristics..."

**Security Awareness:**
- "I addressed OWASP Top 10 specifically by..."
- "The credential management approach ensures no secrets in code..."

**Analytical Capability:**
- "The correlation engine links events across multiple data sources..."
- "Traffic analysis can detect patterns without accessing content..."

---

## Getting Started

```bash
# Clone and setup
pnpm install

# Start database services
docker-compose up -d

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

---

## License

MIT (or as appropriate for government portfolio demonstration)
