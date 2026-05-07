/**
 * Centralized PT-BR copy for the marketing landing (task-21).
 *
 * Every visible string on `/` references this object. Task-29 will swap
 * the lookup for a `next-intl` `t('hero.title')` call, mapping the same
 * key tree onto a `messages.json` catalog. No component churn.
 *
 * Pure module — safe for RSC + client.
 */

export const copy = {
  hero: {
    eyebrow: 'Press kit profissional para artistas',
    title: 'Seu press kit em 5 minutos.',
    tagline:
      'Crie uma página pública de press kit com sua bio, fotos, faixas, redes e link para download — tudo no seu domínio presskit.pro/seu-nome.',
    cta: 'Crie seu press kit',
    ctaHint: 'Grátis por 14 dias. Sem cartão.',
  },
  whatIsPressKit: {
    eyebrow: 'O que é um press kit?',
    title: 'Tudo que um booker precisa para fechar.',
    body:
      'Um press kit reúne bio, fotos profissionais, faixas em destaque, links das redes e contato em uma página só — pronta pra mandar pra qualquer casa, festival ou produtor. PressKit Pro entrega isso num link curto, otimizado pra SEO e leve no celular.',
  },
  howItWorks: {
    eyebrow: 'Como funciona',
    title: 'Três passos.',
    steps: [
      {
        n: '01',
        title: 'Reserve seu link',
        body:
          'Escolha presskit.pro/seu-nome no onboarding. Reservado por 7 dias enquanto você termina o cadastro.',
      },
      {
        n: '02',
        title: 'Monte seu press kit',
        body:
          'Suba bio, fotos, faixas, redes e o link do seu material em alta. Sem código, sem template difícil — tudo em PT-BR.',
      },
      {
        n: '03',
        title: 'Compartilhe',
        body:
          'Mande o link para bookers, festivais ou no DM. Você atualiza quando quiser; o link nunca muda.',
      },
    ],
  },
  examples: {
    eyebrow: 'Quem já usa',
    title: 'Inspire-se em quem já está no ar.',
    empty:
      'Nenhum perfil publicado ainda. Rode `pnpm seed` no ambiente de dev para popular exemplos.',
    seeAll: 'Ver todos os exemplos',
  },
  pricingTeaser: {
    eyebrow: 'Plano único',
    title: 'R$ 19/mês. Tudo incluso.',
    body:
      'Hospedagem, domínio presskit.pro/seu-nome, atualizações ilimitadas, suporte em PT. Cancele quando quiser.',
    cta: 'Ver detalhes do plano',
    href: '/pricing',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Perguntas frequentes.',
    items: [
      {
        q: 'Preciso saber programar?',
        a: 'Não. O editor é totalmente visual. Em 5 minutos seu press kit está no ar.',
      },
      {
        q: 'Posso usar meu próprio domínio?',
        a: 'No plano atual o link é presskit.pro/seu-nome. Domínio próprio entra na próxima fase do produto.',
      },
      {
        q: 'Os bookers conseguem baixar minhas fotos?',
        a: 'Sim. Você cola o link do seu Drive/Dropbox e nós validamos que está público antes de salvar.',
      },
      {
        q: 'Funciona no celular?',
        a: 'Sim — desktop, celular e tablet. As páginas públicas têm Lighthouse 95+ em mobile.',
      },
      {
        q: 'O conteúdo está em português?',
        a: 'Tudo em PT-BR. Suporte para EN chega em breve via toggle de idioma.',
      },
      {
        q: 'Posso despublicar a qualquer momento?',
        a: 'Sim. Despublicar tira do ar imediatamente — o link público volta a 404.',
      },
    ],
  },
  consent: {
    body:
      'Usamos apenas cookies essenciais — sessão de login e preferência de idioma. Não usamos cookies de rastreamento ou publicidade.',
    cta: 'Entendido',
    learnMore: 'Saiba mais',
    learnMoreHref: '/privacy',
  },
  footer: {
    tagline: 'Press kits, do jeito certo.',
    nav: {
      privacy: { label: 'Privacidade', href: '/privacy' },
      terms: { label: 'Termos', href: '/terms' },
      status: { label: 'Status', href: 'https://status.presskit.pro' },
      contact: { label: 'Contato', href: 'mailto:contato@presskit.pro' },
    },
    social: {
      instagram: { label: 'Instagram', href: 'https://www.instagram.com/presskitpro' },
      twitter: { label: 'Twitter / X', href: 'https://x.com/presskitpro' },
    },
    lang: {
      label: 'Idioma',
      pt: 'Português',
      en: 'English',
      hint: 'Em breve',
    },
    copyright: '© PressKit Pro. Todos os direitos reservados.',
  },
} as const;

export type MarketingCopy = typeof copy;
