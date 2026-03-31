import { z } from 'zod';

export { aircraftEntitySchema, type AircraftEntity } from './aircraft.js';
export { vesselEntitySchema, type VesselEntity } from './vessel.js';
export { networkEntitySchema, type NetworkEntity } from './network.js';
export { seismicEntitySchema, type SeismicEntity } from './seismic.js';

import { aircraftEntitySchema } from './aircraft.js';
import { vesselEntitySchema } from './vessel.js';
import { networkEntitySchema } from './network.js';
import { seismicEntitySchema } from './seismic.js';

/**
 * Discriminated union of all HYDRA entity types.
 * Discriminates on the `type` field.
 */
export const entitySchema = z
  .discriminatedUnion('type', [
    aircraftEntitySchema,
    vesselEntitySchema,
    networkEntitySchema,
    seismicEntitySchema,
  ])
  .describe('Any HYDRA entity (discriminated on "type")');

/** Union type of all HYDRA entities. */
export type Entity = z.infer<typeof entitySchema>;
