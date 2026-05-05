import { notFound, redirect } from 'next/navigation';

import { StepRail } from '@/components/onboarding/StepRail';
import { StepShell } from '@/components/onboarding/StepShell';
import { payload } from '@/lib/payload';
import {
  type OnboardingProgress,
  resumeStep,
  type WizardStep,
} from '@/lib/onboarding/state';
import { supabaseServer } from '@/lib/supabase/server';

import { MediaStep } from '../steps/MediaStep';
import { ServicesStep } from '../steps/ServicesStep';
import { SlugStep } from '../steps/SlugStep';
import { SocialStep } from '../steps/SocialStep';
import { TaglineStep } from '../steps/TaglineStep';

const STEP_TITLES: Record<WizardStep, { title: string; helper: string }> = {
  1: {
    title: 'Sua URL pública',
    helper:
      'Esta é a parte da URL que vem depois de presskit.pro/. Pode ser seu nome artístico ou um apelido. Pode mudar depois (com redirect dos antigos por 90 dias).',
  },
  2: {
    title: 'Adicione suas imagens',
    helper:
      'Foto principal e logo (opcional). Você pode pular este passo e enviar depois.',
  },
  3: {
    title: 'Tagline',
    helper:
      'Uma frase curta que aparece logo abaixo do seu nome. Em português, máximo 140 caracteres.',
  },
  4: {
    title: 'Quais serviços você oferece?',
    helper:
      'Selecione tudo o que se aplica. Você pode adicionar até 3 serviços customizados.',
  },
  5: {
    title: 'Adicione um link',
    helper:
      'Pelo menos uma rede social ou contato. Mais podem ser adicionados no editor.',
  },
};

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepParam } = await params;
  const step = parseStep(stepParam);
  if (step === null) notFound();

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/onboarding');

  const p = await payload();
  const result = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: user.id } },
    limit: 1,
    depth: 0,
  });
  const userDoc = result.docs[0];
  const progress = (userDoc?.onboardingProgress ?? null) as
    | OnboardingProgress
    | null;

  // Don't let the user jump ahead — bounce to the first incomplete step.
  const allowed = resumeStep(progress);
  if (step > allowed) {
    redirect(`/onboarding/${allowed}`);
  }

  const meta = STEP_TITLES[step];
  const highest = (progress?.step ?? 0) as number;

  return (
    <>
      <aside className="md:w-56 md:shrink-0">
        <StepRail current={step} highestCompleted={highest} />
      </aside>
      <main className="flex-1">
        <StepShell step={step} total={5} title={meta.title} helper={meta.helper}>
          {renderIsland(step, progress, user.id)}
        </StepShell>
      </main>
    </>
  );
}

function parseStep(value: string): WizardStep | null {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n as WizardStep;
}

function renderIsland(
  step: WizardStep,
  progress: OnboardingProgress | null,
  supabaseUserId: string,
) {
  switch (step) {
    case 1:
      return <SlugStep initialSlug={progress?.slug} />;
    case 2:
      return (
        <MediaStep
          supabaseUserId={supabaseUserId}
          initialPortraitId={progress?.portraitId ?? null}
          initialLogoId={progress?.logoId ?? null}
        />
      );
    case 3:
      return <TaglineStep initial={progress?.taglinePtBR} />;
    case 4:
      return (
        <ServicesStep
          initialSelected={progress?.services ?? []}
          initialCustom={progress?.customServices ?? []}
        />
      );
    case 5:
      return (
        <SocialStep
          initialPlatform={progress?.socialPlatform}
          initialUrl={progress?.socialUrl}
        />
      );
  }
}
