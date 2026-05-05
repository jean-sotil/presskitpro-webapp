import * as migration_20260505_015050 from './20260505_015050';
import * as migration_20260505_070813_task_08_collections from './20260505_070813_task_08_collections';
import * as migration_20260505_090038_task_06_wizard from './20260505_090038_task_06_wizard';
import * as migration_20260505_104511_task_10_hero_cta from './20260505_104511_task_10_hero_cta';
import * as migration_20260505_112853_task_12_gallery from './20260505_112853_task_12_gallery';
import * as migration_20260505_192313_task_14_contact from './20260505_192313_task_14_contact';
import * as migration_20260505_223425_task_15_press_kit_providers from './20260505_223425_task_15_press_kit_providers';

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
    name: '20260505_090038_task_06_wizard',
  },
  {
    up: migration_20260505_104511_task_10_hero_cta.up,
    down: migration_20260505_104511_task_10_hero_cta.down,
    name: '20260505_104511_task_10_hero_cta',
  },
  {
    up: migration_20260505_112853_task_12_gallery.up,
    down: migration_20260505_112853_task_12_gallery.down,
    name: '20260505_112853_task_12_gallery',
  },
  {
    up: migration_20260505_192313_task_14_contact.up,
    down: migration_20260505_192313_task_14_contact.down,
    name: '20260505_192313_task_14_contact',
  },
  {
    up: migration_20260505_223425_task_15_press_kit_providers.up,
    down: migration_20260505_223425_task_15_press_kit_providers.down,
    name: '20260505_223425_task_15_press_kit_providers'
  },
];
