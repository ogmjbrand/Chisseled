#!/usr/bin/env bash
# Recreates a local test database, migrates it and creates the test owner.
set -euo pipefail
: "${PGHOST:=127.0.0.1}" "${PGUSER:=postgres}" "${DB:=chisseled}"
psql -h "$PGHOST" -U "$PGUSER" -qc "drop database if exists $DB with (force)" -c "create database $DB"
psql -h "$PGHOST" -U "$PGUSER" -d "$DB" -qf supabase/local-bootstrap.sql
export DATABASE_URL="postgres://$PGUSER@$PGHOST:5432/$DB"
node scripts/db-migrate.mjs
ADMIN_PASSWORD="${OWNER_PASSWORD:-OwnerPass12345}" node scripts/create-owner.mjs --email "${OWNER_EMAIL:-owner@chisseled.test}" --name "Test Owner"
