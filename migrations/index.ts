import * as migration_20260505_015050 from './20260505_015050';
import * as migration_20260505_070813_task_08_collections from './20260505_070813_task_08_collections';
import * as migration_20260505_090038_task_06_wizard from './20260505_090038_task_06_wizard';
import * as migration_20260505_104511_task_10_hero_cta from './20260505_104511_task_10_hero_cta';
import * as migration_20260505_112853_task_12_gallery from './20260505_112853_task_12_gallery';
import * as migration_20260505_192313_task_14_contact from './20260505_192313_task_14_contact';
import * as migration_20260505_223425_task_15_press_kit_providers from './20260505_223425_task_15_press_kit_providers';
import * as migration_20260505_234318_task_17_instagram_posts from './20260505_234318_task_17_instagram_posts';
import * as migration_20260506_012220_task_18_theme_accent_preset from './20260506_012220_task_18_theme_accent_preset';
import * as migration_20260506_095315_task_23_stripe_billing from './20260506_095315_task_23_stripe_billing';
import * as migration_20260508_053258_task_35_themes_preset_id from './20260508_053258_task_35_themes_preset_id';
import * as migration_20260508_203914_task_35_festival_orange_preset from './20260508_203914_task_35_festival_orange_preset';

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
    name: '20260505_223425_task_15_press_kit_providers',
  },
  {
    up: migration_20260505_234318_task_17_instagram_posts.up,
    down: migration_20260505_234318_task_17_instagram_posts.down,
    name: '20260505_234318_task_17_instagram_posts',
  },
  {
    up: migration_20260506_012220_task_18_theme_accent_preset.up,
    down: migration_20260506_012220_task_18_theme_accent_preset.down,
    name: '20260506_012220_task_18_theme_accent_preset',
  },
  {
    up: migration_20260506_095315_task_23_stripe_billing.up,
    down: migration_20260506_095315_task_23_stripe_billing.down,
    name: '20260506_095315_task_23_stripe_billing',
  },
  {
    up: migration_20260508_053258_task_35_themes_preset_id.up,
    down: migration_20260508_053258_task_35_themes_preset_id.down,
    name: '20260508_053258_task_35_themes_preset_id',
  },
  {
    up: migration_20260508_203914_task_35_festival_orange_preset.up,
    down: migration_20260508_203914_task_35_festival_orange_preset.down,
    name: '20260508_203914_task_35_festival_orange_preset'
  },
];
