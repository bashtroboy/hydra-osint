-- Add 'radiosonde' and 'satellite' entity types to the entities table.
ALTER TABLE entities
    DROP CONSTRAINT IF EXISTS entities_type_check;

ALTER TABLE entities
    ADD CONSTRAINT entities_type_check
    CHECK (type IN ('aircraft', 'vessel', 'network', 'seismic', 'radiosonde', 'satellite'));
