// The screen's guide's words (D68): content/guide/text.<lang>.json, falling back to
// English, made for the wizard like every text the child reads.

import { fallbackLanguage, forWizard, type Language } from '../i18n';
import type { GuideText } from '../ui/guide';

async function fetched(lang: Language): Promise<GuideText | null> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/guide/text.${lang}.json`);
  return response.ok ? ((await response.json()) as GuideText) : null;
}

export async function loadGuideText(lang: Language): Promise<GuideText> {
  const text = (await fetched(lang)) ?? (await fetched(fallbackLanguage)) ?? { steps: {} };
  const steps = Object.fromEntries(
    Object.entries(text.steps).map(([key, step]) => [
      key,
      { title: forWizard(step.title), text: forWizard(step.text) },
    ]),
  );
  return { steps };
}
