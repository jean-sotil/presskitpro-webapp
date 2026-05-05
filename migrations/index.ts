import * as migration_20260505_015050 from './20260505_015050';
import * as migration_20260505_070813_task_08_collections from './20260505_070813_task_08_collections';
import * as migration_20260505_090038_task_06_wizard from './20260505_090038_task_06_wizard';

export const migrations = [
  {
    up: migration_20260505_015050.up,
    down: migration_20260505_015050.down,
    name: '20260505_015050',
  },
  {
    up: migration_20260505_070813_task_08_collections.up,
    down: migration_20260505_070813_task_08_collections.down,
    name: '20260505_070813_task_08_collections',
  },
  {
    up: migration_20260505_090038_task_06_wizard.up,
    down: migration_20260505_090038_task_06_wizard.down,
    name: '20260505_090038_task_06_wizard'
  },
];
