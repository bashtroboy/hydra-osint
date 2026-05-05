-- 0001_initial.sql
-- HYDRA OSINT Platform — initial schema migration
-- Creates all core tables, indexes, and required extensions.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- NOTE: TimescaleDB must be available in the PostgreSQL instance.
-- Enable it only when running against a TimescaleDB-enabled server.
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- ---------------------------------------------------------------------------
-- entities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type          TEXT NOT NULL CHECK (type IN ('aircraft', 'vessel', 'network', 'seismic')),
    identifier    TEXT NOT NULL,
    name          TEXT,
    metadata      JSONB,
    first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS entities_type_identifier_idx
    ON entities (type, identifier);

-- ---------------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id   UUID NOT NULL REFERENCES entities(id),
    timestamp   TIMESTAMPTZ NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    altitude    DOUBLE PRECISION,
    speed       DOUBLE PRECISION,
    heading     DOUBLE PRECISION,
    source      TEXT NOT NULL,
    raw         JSONB
);

CREATE INDEX IF NOT EXISTS positions_entity_id_idx ON positions (entity_id);
CREATE INDEX IF NOT EXISTS positions_timestamp_idx ON positions (timestamp);

-- NOTE: Uncomment the following line when running on a TimescaleDB-enabled
-- PostgreSQL instance to convert positions into a hypertable for efficient
-- time-series queries.
-- SELECT create_hypertable('positions', 'timestamp', if_not_exists => TRUE);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        TEXT NOT NULL,
    severity    TEXT NOT NULL DEFAULT 'info'
                CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    title       TEXT NOT NULL,
    description TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    radius      DOUBLE PRECISION,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- data_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    type          TEXT NOT NULL CHECK (type IN ('adsb', 'ais', 'rss', 'bgp', 'seismic', 'archive')),
    config        JSONB,
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync     TIMESTAMPTZ,
    status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'error', 'disabled')),
    error_message TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'viewer',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMPTZ,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
