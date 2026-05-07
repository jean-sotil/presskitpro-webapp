/**
 * Legal copy — PT-BR placeholder structure for `/privacy` and `/terms`.
 *
 * PRD §14: "Privacy policy + Terms pages (drafted by legal — engineering
 * wires the routes)." This file ships the route shape with section
 * headings so the eventual legal review can drop content in without
 * touching the components. Sections marked DRAFT must be reviewed
 * before flipping the marketing footer to production-grade.
 */

export const legalCopy = {
  privacy: {
    title: 'Política de Privacidade',
    updatedLabel: 'Atualizado em',
    updatedAt: '2026-04-29',
    draftBadge: 'Rascunho — pendente de revisão jurídica.',
    intro:
      'Esta política descreve como a PressKit Pro coleta, usa e protege seus dados pessoais quando você usa o serviço. Ao criar uma conta ou navegar nas páginas públicas, você concorda com os termos desta política.',
    sections: [
      {
        heading: 'Dados que coletamos',
        body:
          'Coletamos o e-mail informado no cadastro e o conteúdo que você publica no seu press kit (bio, fotos, links, faixas). Não coletamos dados de localização, dispositivo ou navegação para fins de publicidade.',
      },
      {
        heading: 'Cookies',
        body:
          'Usamos apenas dois cookies essenciais: o cookie de sessão de autenticação e o cookie de preferência de idioma. Não definimos cookies de rastreamento ou de publicidade. O cookie `cookie_consent` armazena seu reconhecimento desse aviso.',
      },
      {
        heading: 'Compartilhamento',
        body:
          'Não vendemos nem alugamos seus dados. Compartilhamos apenas com provedores essenciais para o funcionamento do serviço (hospedagem, processamento de pagamento), sob contratos com obrigações de confidencialidade.',
      },
      {
        heading: 'Seus direitos (LGPD)',
        body:
          'Você pode acessar, corrigir, exportar ou apagar seus dados a qualquer momento. As ferramentas de exportação e exclusão self-serve estão na próxima versão (task-33). Até lá, escreva para contato@presskit.pro.',
      },
      {
        heading: 'Contato',
        body: 'Dúvidas sobre esta política: contato@presskit.pro.',
      },
    ],
  },
  terms: {
    title: 'Termos de Uso',
    updatedLabel: 'Atualizado em',
    updatedAt: '2026-04-29',
    draftBadge: 'Rascunho — pendente de revisão jurídica.',
    intro:
      'Estes termos regulam o uso da PressKit Pro. Ao criar uma conta, você aceita as condições abaixo. Se não concordar, não use o serviço.',
    sections: [
      {
        heading: 'Conta e conteúdo',
        body:
          'Você é responsável pelo conteúdo publicado no seu press kit, incluindo direitos sobre fotos, faixas e textos. Conteúdo que infrinja direitos de terceiros, viole leis ou seja ofensivo pode ser removido sem aviso prévio.',
      },
      {
        heading: 'Plano e cobrança',
        body:
          'A PressKit Pro oferece um período gratuito de 14 dias. Ao final, é necessário assinar um plano para manter o press kit no ar. O cancelamento pode ser feito a qualquer momento e produz efeito ao fim do ciclo de cobrança.',
      },
      {
        heading: 'Slug e link público',
        body:
          'O endereço presskit.pro/seu-nome é reservado enquanto sua conta está ativa. Em caso de inatividade prolongada, o slug pode ser liberado conforme a política de reciclagem (task-32).',
      },
      {
        heading: 'Suspensão e encerramento',
        body:
          'Podemos suspender ou encerrar contas que violem estes termos. Em caso de encerramento por violação, não há reembolso pro-rata.',
      },
      {
        heading: 'Limitação de responsabilidade',
        body:
          'O serviço é fornecido "como está". Não garantimos disponibilidade contínua, embora façamos o possível para manter SLAs alinhados ao tier do plano.',
      },
      {
        heading: 'Foro e legislação',
        body:
          'Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo - SP para dirimir eventuais conflitos.',
      },
      {
        heading: 'Contato',
        body: 'Dúvidas sobre estes termos: contato@presskit.pro.',
      },
    ],
  },
} as const;

export type LegalCopy = typeof legalCopy;
