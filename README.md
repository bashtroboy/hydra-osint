# HYDRA

**Hybrid Y-Service Data Research & Analysis** — An Open Source Intelligence (OSINT) collection and analysis platform.

---

## Project Summary

HYDRA is a web-based platform that collects publicly available intelligence data from multiple sources, correlates events across data streams, performs traffic analysis, and integrates historical/educational signals intelligence content.

**Core Capabilities:**
- Real-time collection from aviation (ADS-B), maritime (AIS), network (BGP), and seismic (USGS) data sources
- Geospatial visualization with entity tracking and pattern detection
- Correlation engine linking events across time, space, and data types
- Traffic analysis demonstrating metadata intelligence techniques
- Educational integration with historical SIGINT materials

**Technology Stack:**
- Node.js + TypeScript (relaxed strictness)
- Fastify (REST API) + React (dashboard)
- PostgreSQL + PostGIS + TimescaleDB
- Redis + BullMQ (queues)
- MapLibre GL (mapping)
- Docker (containerized deployment)

---

## Development Setup

### Quick Start (Demo Mode)

Run the platform with in-memory sample data — no database required:

```bash
pnpm install
pnpm demo
```

This starts:
- **API** at http://localhost:3000 (Swagger docs at `/docs`)
- **Web frontend** at http://localhost:5173

### Full Development Setup

For persistent data with PostgreSQL and Redis:

**1. Create environment file:**
```bash
cp docker/.env.example docker/.env
```

**2. Start PostgreSQL and Redis:**
```bash
cd docker
docker-compose up -d
```

**3. Verify services are running:**
```bash
docker-compose ps
```

**4. Run database migrations:**
```bash
cd ..
pnpm db:migrate
```

**5. Create API environment file:**
```bash
cp apps/api/.env.example apps/api/.env
```

**6. Start the full dev environment:**
```bash
pnpm dev
```

### Connection Details (Defaults)

| Service    | Host      | Port | Credentials                |
|------------|-----------|------|----------------------------|
| PostgreSQL | localhost | 5432 | hydra / hydra_dev_password |
| Redis      | localhost | 6379 | (no auth)                  |

**Database URL:**
```
postgresql://hydra:hydra_dev_password@localhost:5432/hydra_dev
```

### Useful Docker Commands

```bash
# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## Implementation Stages

### Stage 1: Foundation
**Goal:** Core infrastructure and basic data collection

| Task | Description |
|------|-------------|
| Monorepo setup | Turborepo + pnpm workspace configuration |
| Database | PostgreSQL + PostGIS + TimescaleDB via Docker |
| Schema design | Drizzle ORM with core tables (intel_records, entities, correlations) |
| API skeleton | Fastify server with authentication (Lucia) |
| First collector | ADS-B via OpenSky Network API |
| Second collector | AIS via AISHub community feed |
| Job queue | BullMQ for scheduled collection tasks |

**Milestone:** API collecting and storing real aircraft/vessel data

---

### Stage 2: Visualization
**Goal:** Web dashboard with maps and real-time updates

| Task | Description |
|------|-------------|
| Frontend init | React + Vite project setup |
| Component library | shadcn/ui integration |
| Map integration | MapLibre GL with entity markers |
| WebSocket | Real-time data feed to browser |
| Track visualization | Historical paths for entities |
| Dashboard layout | Activity feed, source status, search/filter |

**Milestone:** Interactive map showing live aircraft and vessel positions

---

### Stage 3: Intelligence Features
**Goal:** Correlation engine and traffic analysis

| Task | Description |
|------|-------------|
| Temporal correlation | Detect events occurring within time windows |
| Spatial clustering | DBSCAN-based geographic clustering via PostGIS |
| Entity co-occurrence | Track when entities appear together |
| Traffic analysis | Timing patterns, metadata analysis, behavioral baselines |
| Alerting system | Geofence triggers, entity watchlists, anomaly detection |
| Correlation UI | Visualization of linked events |

**Milestone:** System detecting and surfacing correlated events automatically

---

### Stage 4: Educational & Archives
**Goal:** Historical context and learning materials

| Task | Description |
|------|-------------|
| Archive scraper | Pull declassified documents (NSA VENONA, NARA) |
| Archive browser | Search and view historical materials |
| Educational content | SIGINT history, traffic analysis primers |
| Context integration | Sidebars linking live data to historical concepts |
| Numbers stations | Integration with archive.org recordings |

**Milestone:** Educational platform with historical SIGINT context

---

### Stage 5: CLI & Polish
**Goal:** Terminal tools and production readiness

| Task | Description |
|------|-------------|
| CLI framework | Commander.js with Ink TUI |
| Query commands | Search intel from terminal |
| Export functionality | Data export in various formats |
| Security audit | Review OWASP compliance, audit logging |
| E2E testing | Playwright test suite |
| Documentation | API docs, deployment guides |

**Milestone:** Complete platform ready for demonstration

---

### Stage 6: Extended Features (Future)
**Goal:** Advanced capabilities for differentiation

| Task | Description |
|------|-------------|
| BGP anomaly detection | RIPE RIS Live integration |
| Weather satellite | NOAA imagery integration |
| HF propagation | Amateur radio propagation prediction |
| NOTAM/SIGMET | Aviation notices integration |
| Network graph | Entity relationship visualization |
| Report generation | PDF export of analysis |

---

## Acronym Library

| Acronym | Full Term | Description |
|---------|-----------|-------------|
| **ADS-B** | Automatic Dependent Surveillance-Broadcast | Aircraft position broadcasting system using GPS |
| **AIS** | Automatic Identification System | Maritime vessel tracking system |
| **API** | Application Programming Interface | Standard interface for software communication |
| **BGP** | Border Gateway Protocol | Internet routing protocol between networks |
| **CDN** | Content Delivery Network | Distributed system for serving static assets |
| **CLI** | Command Line Interface | Text-based interface for software interaction |
| **CORS** | Cross-Origin Resource Sharing | HTTP header mechanism for cross-domain requests |
| **CSE** | Communications Security Establishment | Canadian signals intelligence agency |
| **CSP** | Content Security Policy | HTTP header to prevent XSS attacks |
| **DBSCAN** | Density-Based Spatial Clustering of Applications with Noise | Clustering algorithm for spatial data |
| **DF** | Direction Finding | Technique to determine signal origin location |
| **E2E** | End-to-End | Complete system testing from user perspective |
| **ECHELON** | — | Five Eyes signals intelligence collection program |
| **FFT** | Fast Fourier Transform | Algorithm for frequency analysis |
| **GCHQ** | Government Communications Headquarters | UK signals intelligence agency |
| **GCP** | Google Cloud Platform | Cloud computing services provider |
| **GPS** | Global Positioning System | Satellite-based navigation system |
| **HF** | High Frequency | Radio band (3-30 MHz) for long-range communication |
| **HSTS** | HTTP Strict Transport Security | Security header enforcing HTTPS |
| **HTTPS** | Hypertext Transfer Protocol Secure | Encrypted web communication protocol |
| **ICAO** | International Civil Aviation Organization | UN agency for aviation standards |
| **INT** | Intelligence | General term for intelligence disciplines |
| **JSON** | JavaScript Object Notation | Lightweight data interchange format |
| **JWT** | JSON Web Token | Compact token format for authentication |
| **MFA** | Multi-Factor Authentication | Authentication requiring multiple verification methods |
| **MMSI** | Maritime Mobile Service Identity | Unique vessel identifier for AIS |
| **NARA** | National Archives and Records Administration | US federal records archive |
| **NMEA** | National Marine Electronics Association | Standard for marine electronics data |
| **NOAA** | National Oceanic and Atmospheric Administration | US weather and ocean agency |
| **NOTAM** | Notice to Air Missions | Aviation safety notices |
| **NSA** | National Security Agency | US signals intelligence agency |
| **ORM** | Object-Relational Mapping | Database abstraction layer |
| **OSINT** | Open Source Intelligence | Intelligence from publicly available sources |
| **OTP** | One-Time Pad | Theoretically unbreakable encryption method |
| **OWASP** | Open Web Application Security Project | Web security standards organization |
| **RBAC** | Role-Based Access Control | Permission system based on user roles |
| **REST** | Representational State Transfer | Architectural style for web APIs |
| **RIPE** | Réseaux IP Européens | European internet registry |
| **RIS** | Routing Information Service | RIPE's BGP data collection |
| **RSA** | Rivest-Shamir-Adleman | Public-key cryptography algorithm |
| **SATCOM** | Satellite Communications | Communication via satellite relay |
| **SDR** | Software Defined Radio | Radio using software for signal processing |
| **SIGINT** | Signals Intelligence | Intelligence from intercepted signals |
| **SIGMET** | Significant Meteorological Information | Aviation weather warnings |
| **SINCGARS** | Single Channel Ground and Airborne Radio System | US military tactical radio |
| **SQL** | Structured Query Language | Database query language |
| **SSRF** | Server-Side Request Forgery | Security vulnerability type |
| **TA** | Traffic Analysis | Intelligence from communication patterns |
| **TDOA** | Time Difference of Arrival | Geolocation technique using signal timing |
| **TLS** | Transport Layer Security | Cryptographic protocol for secure communication |
| **TUI** | Terminal User Interface | Text-based graphical interface |
| **UHF** | Ultra High Frequency | Radio band (300 MHz - 3 GHz) |
| **URL** | Uniform Resource Locator | Web address format |
| **USGS** | United States Geological Survey | US earth science agency |
| **VENONA** | — | US/UK program decrypting Soviet communications |
| **VHF** | Very High Frequency | Radio band (30-300 MHz) |
| **WebSocket** | — | Protocol for real-time bidirectional communication |
| **WGS84** | World Geodetic System 1984 | Standard coordinate reference system |
| **XSS** | Cross-Site Scripting | Security vulnerability injecting malicious scripts |

---

## Documentation

Additional documentation available in `/docs/`:

- `project-overview.md` — Detailed project plan and architecture
- `primer-typescript.md` — TypeScript quick-start for JS developers
- `primer-fastify.md` — Express to Fastify migration guide
- `tsconfig-notes.md` — Our relaxed TypeScript approach

---

## License

MIT
