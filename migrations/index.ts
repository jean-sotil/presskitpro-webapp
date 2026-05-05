import * as migration_20260505_015050 from './20260505_015050';

export const migrations = [
  {
    up: migration_20260505_015050.up,
    down: migration_20260505_015050.down,
    name: '20260505_015050'
  },
];
