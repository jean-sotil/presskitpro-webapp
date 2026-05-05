import * as migration_20260505_015050 from './20260505_015050';
import * as migration_20260505_070813_task_08_collections from './20260505_070813_task_08_collections';

export const migrations = [
  {
    up: migration_20260505_015050.up,
    down: migration_20260505_015050.down,
    name: '20260505_015050',
  },
  {
    up: migration_20260505_070813_task_08_collections.up,
    down: migration_20260505_070813_task_08_collections.down,
    name: '20260505_070813_task_08_collections'
  },
];
