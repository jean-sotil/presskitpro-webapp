import type { CollectionConfig } from 'payload';

/**
 * Minimal auth collection required to log into /admin.
 * Downstream tasks (roles, profile fields, access control) extend this.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [],
};
