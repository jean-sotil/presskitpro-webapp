import type { EditorBundle } from '@/lib/editor/bundle';

export function ContactRender({ bundle }: { bundle: EditorBundle }) {
  // Contact form / WhatsApp / email derive from SocialLinks in v1.
  const contact = bundle.socialLinks.find(
    (link) => link.platform === 'email' || link.platform === 'whatsapp',
  );
  if (!contact) return null;
  const url = contact.url as string;
  const platform = contact.platform as string;
  return (
    <section className="px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Contato</h2>
      <p className="mt-4">
        <a
          href={platform === 'email' && !url.startsWith('mailto:') ? `mailto:${url}` : url}
          className="inline-flex h-12 items-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast"
        >
          {platform === 'whatsapp' ? 'Chamar no WhatsApp' : 'Enviar e-mail'}
        </a>
      </p>
    </section>
  );
}
