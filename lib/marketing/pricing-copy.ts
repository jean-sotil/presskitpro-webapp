/**
 * Centralized PT-BR copy for the pricing page (task-22).
 *
 * Same shape as `marketing/copy.ts` — task-29 swaps the lookup for
 * next-intl with a one-line edit.
 *
 * Pure module — safe for RSC + client.
 */

import type { PlanId } from '@/lib/pricing/plans';

export const pricingCopy = {
  hero: {
    eyebrow: 'Planos & preços',
    title: 'Comece grátis. Pague quando converter.',
    body:
      'Tudo o que você precisa para um press kit profissional, desde o teste grátis até a conta de agência.',
  },
  toggle: {
    monthly: 'Mensal',
    annual: 'Anual (~2 meses grátis)',
    hint: 'Anual em breve no Stripe — por enquanto, o checkout segue mensal.',
  },
  perMonth: '/mês',
  free: 'Grátis',
  plans: {
    trial: {
      name: 'Trial',
      tagline: '14 dias completos. Sem cartão.',
      cta: 'Começar grátis',
      includes: [
        'Acesso completo a todos os recursos do Pro',
        'Página pública ativa durante o teste',
        'Sem cartão no cadastro',
        'Upgrade quando quiser',
      ],
    },
    pro: {
      name: 'Pro',
      eyebrow: 'Mais escolhido',
      tagline: 'Um perfil, recursos completos.',
      cta: 'Continuar com Pro',
      includes: [
        'Um perfil profissional ativo',
        'Tema customizável (cores, fontes, layout)',
        'Todas as integrações (SoundCloud, Instagram, Press kit)',
        'Analytics básico',
        'Sem branding presskit.pro no rodapé',
      ],
    },
    agency: {
      name: 'Agency',
      tagline: 'Até 10 perfis sob um login.',
      cta: 'Falar com vendas',
      includes: [
        'Até 10 perfis no mesmo login',
        'Switcher de perfis no painel',
        'Cobrança consolidada',
        'Suporte prioritário',
      ],
    },
  } satisfies Record<
    PlanId,
    {
      name: string;
      tagline: string;
      cta: string;
      includes: string[];
      eyebrow?: string;
    }
  >,
  faq: {
    eyebrow: 'Cobrança',
    title: 'Tira-dúvidas de cobrança.',
    items: [
      {
        q: 'Posso cancelar a qualquer momento?',
        a: 'Sim. O cancelamento é imediato; você mantém o acesso até o fim do período pago e nada é renovado.',
      },
      {
        q: 'E se eu não converter no fim do trial?',
        a: 'No dia 14 a página fica pausada com uma mensagem "Press kit pausado" — não dá 404, então links que você compartilhou continuam funcionando. Você tem 90 dias para reativar antes do slug voltar a ficar disponível.',
      },
      {
        q: 'Existe reembolso?',
        a: 'Reembolso integral nos 7 primeiros dias da primeira cobrança. Para o anual, reembolso pro-rata até 30 dias.',
      },
      {
        q: 'E domínio próprio?',
        a: 'Não em v1. O link é sempre presskit.pro/seu-nome. Domínio próprio entra na próxima fase.',
      },
    ],
  },
} as const;
