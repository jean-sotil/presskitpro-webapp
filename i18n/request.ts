import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl skeleton — task-29 will wire locale routing, message catalogs,
 * and the public `[locale]` segment. For now this resolves to a fixed `en`
 * locale with empty messages so the plugin compiles cleanly.
 */
export default getRequestConfig(async () => ({
  locale: 'en',
  messages: {},
}));
