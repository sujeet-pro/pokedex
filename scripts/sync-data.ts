#!/usr/bin/env tsx
// Data sync is a no-op in v3: data/api/v2/ is committed and kept in sync manually.
// Re-add rsync-from-pokeapi if needed.
process.stdout.write("data/api/v2/ is already present. Nothing to sync.\n");
