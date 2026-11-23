// The wizard creator (D36): a name, the game's name (D290), a girl or a boy, and a
// look among the game's. The game's name follows the wizard's, as the name a game
// takes from its wizard (D291), until the child writes it. Done keeps the wizard and
// the game's name together and goes on; when a wizard exists already, the screen
// opens with it and the game's name, and Back leaves both as they were.

import { looksFor } from '../engine/looks';
import { t } from '../i18n';
import * as progress from '../progress/progress';
import { GAME_NAME_MAX, isNameCharacter, NAME_MAX, type Wizard, wizardName } from '../progress/store';
import { element } from './dom';
import { portrait } from './portraits';
import type { Screen } from './screen';

export interface WizardScreenParts {
  /** Called once the wizard is kept: the page goes where the child was going. */
  onDone: () => void;
}

/** A row of radio buttons with one checked, moved by the arrow keys too. */
function radioGroup<T extends string>(
  id: string,
  label: string,
  options: { value: T; content: (Node | string)[]; label?: string }[],
  checked: T | null,
  onChange: (value: T) => void,
): HTMLElement {
  const group = element('div', { id, className: 'radio-group' });
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', label);
  const buttons = options.map((option) => {
    const button = element('button', { type: 'button', className: 'radio' }, option.content);
    button.setAttribute('role', 'radio');
    button.dataset.value = option.value;
    if (option.label) button.setAttribute('aria-label', option.label);
    return button;
  });
  const check = (value: T | null, focus = false) => {
    buttons.forEach((button, index) => {
      const on = button.dataset.value === value;
      button.setAttribute('aria-checked', String(on));
      // One stop for Tab in the group: the checked button, or the first.
      button.tabIndex = on || (value === null && index === 0) ? 0 : -1;
      if (on && focus) button.focus();
    });
  };
  buttons.forEach((button, index) => {
    const value = options[index]?.value as T;
    button.addEventListener('click', () => {
      check(value);
      onChange(value);
    });
    button.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const next = options[(index + step + options.length) % options.length]?.value as T;
      check(next, true);
      onChange(next);
    });
  });
  check(checked);
  group.append(...buttons);
  return group;
}

/** A look's portrait (D194). */
function figure(lookId: string, className: string): HTMLImageElement {
  return portrait(`wizard-${lookId}`, className);
}

export function wizardScreen(parts: WizardScreenParts): Screen {
  const node = element('div', { className: 'wizard-screen' });
  const before = progress.wizard();
  // What the child has chosen so far: a name to start from, *Kydux*; the gender is
  // theirs to choose, never preset; the look is one of that gender's (D61).
  let name = before?.name ?? t('wizard.default_name');
  let gender: Wizard['gender'] | null = before?.gender ?? null;
  let look: string | null = before?.look ?? null;
  // The game's name (D290): a game's own, or the one its wizard's name gives (D291)
  // until the child writes in the field.
  let written = before !== null;
  const offered = () => {
    const kept = wizardName(name);
    return kept === null ? '' : progress.offeredGameName(kept);
  };
  let gameName = before ? (progress.currentGameName() ?? offered()) : offered();
  // The names a wizard may not take: the story's, the levels', the world's (D61).
  let reserved = new Set<string>();
  void fetch(`${import.meta.env.BASE_URL}reserved.json`)
    .then((response) => (response.ok ? response.json() : []))
    .then((names: string[]) => {
      reserved = new Set(names);
      draw();
    })
    .catch(() => {});
  const taken = (said: string) => reserved.has(said.trim().toLowerCase());

  const done = () => {
    const kept = wizardName(name);
    if (kept === null || gender === null || look === null || taken(kept)) return;
    if (!progress.keepWizard({ name: kept, gender, look }, gameName)) return;
    parts.onDone();
  };

  const draw = () => {
    document.title = t('wizard.page_title');
    const input = element('input', {
      id: 'wizard-name',
      type: 'text',
      value: name,
      maxLength: NAME_MAX,
      autocomplete: 'off',
      spellcheck: false,
    });
    const rule = element('p', { id: 'wizard-name-rule', className: 'wizard-rule', hidden: true }, [
      t('wizard.name_rule'),
    ]);
    const preview = figure(look ?? '', 'big');
    preview.hidden = look === null;
    // A look chosen shows its portrait at once, large beside the name.
    preview.addEventListener('load', () => {
      preview.hidden = look === null;
    });
    const takenWords = element('p', { id: 'wizard-name-taken', className: 'wizard-rule', hidden: true }, [
      t('wizard.name_taken'),
    ]);
    preview.id = 'wizard-preview';
    const previewName = element('p', { id: 'wizard-preview-name', className: 'wizard-preview-name' }, [name]);
    const finish = element('button', { id: 'wizard-done', type: 'button', className: 'big-button' }, [
      t('wizard.done'),
    ]);
    const gameInput = element('input', {
      id: 'game-name',
      type: 'text',
      value: gameName,
      maxLength: GAME_NAME_MAX,
      autocomplete: 'off',
      spellcheck: false,
    });
    const gameRule = element('p', { id: 'game-name-rule', className: 'wizard-rule', hidden: true }, [
      t('wizard.game_name_rule'),
    ]);
    const gameTaken = element('p', { id: 'game-name-taken', className: 'wizard-rule', hidden: true }, [
      t('wizard.game_name_taken'),
    ]);
    const ready = () => {
      takenWords.hidden = !taken(name);
      const named = progress.checkGameName(gameName);
      gameTaken.hidden = named !== 'taken';
      finish.disabled =
        wizardName(name) === null || gender === null || look === null || taken(name) || named !== 'ok';
    };
    /** What is typed in a name's field, the characters the rule refuses taken out
     * and the rule said. */
    const typedName = (field: HTMLInputElement, said: HTMLElement): string => {
      const typed = field.value;
      const allowed = [...typed].filter(isNameCharacter).join('');
      said.hidden = allowed === typed;
      if (allowed !== typed) field.value = allowed;
      return allowed;
    };
    input.addEventListener('input', () => {
      name = typedName(input, rule);
      previewName.textContent = name.trim();
      // The game's name follows the wizard's until the child writes it (D291).
      if (!written) {
        gameName = offered();
        gameInput.value = gameName;
      }
      ready();
    });
    gameInput.addEventListener('input', () => {
      written = true;
      gameName = typedName(gameInput, gameRule);
      ready();
    });
    for (const field of [input, gameInput]) {
      field.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') done();
      });
    }
    // The name to start from is chosen whole on entering the field, so that typing
    // a name of one's own replaces it rather than adding to it.
    input.addEventListener('focus', () => {
      if (input.value === t('wizard.default_name')) input.select();
    });
    const genders = radioGroup<Wizard['gender']>(
      'wizard-gender',
      t('wizard.gender'),
      [
        { value: 'girl', content: [t('wizard.girl')] },
        { value: 'boy', content: [t('wizard.boy')] },
      ],
      gender,
      (value) => {
        // The looks shown are the gender's; a look of the other is set aside.
        if (value !== gender) {
          gender = value;
          look = looksFor(value)[0]?.id ?? null;
          draw();
          node.querySelector<HTMLElement>(`#wizard-gender [data-value="${value}"]`)?.focus();
        }
      },
    );
    const looks = gender
      ? radioGroup(
          'wizard-looks',
          t('wizard.looks'),
          looksFor(gender).map((option, index) => ({
            value: option.id,
            content: [figure(option.id, 'small')],
            label: t('wizard.look_n', { n: index + 1 }),
          })),
          look,
          (value) => {
            look = value;
            preview.src = figure(look, 'big').src;
            preview.dataset.portrait = `wizard-${look}`;
            preview.hidden = false;
            ready();
          },
        )
      : element('p', { id: 'wizard-looks-first', className: 'wizard-rule muted' }, [t('wizard.gender_first')]);
    finish.addEventListener('click', done);
    const buttons: HTMLElement[] = [finish];
    if (before) {
      buttons.unshift(
        element('a', { id: 'wizard-back', className: 'quiet-button', href: '#start' }, [t('wizard.back')]),
      );
    }
    ready();
    node.replaceChildren(
      element('h2', {}, [t('wizard.title')]),
      element('div', { className: 'wizard-layout' }, [
        element('div', { className: 'wizard-choices' }, [
          element('label', { className: 'wizard-field', htmlFor: 'wizard-name' }, [t('wizard.name')]),
          input,
          rule,
          takenWords,
          element('label', { className: 'wizard-field', htmlFor: 'game-name' }, [t('wizard.game_name')]),
          gameInput,
          gameRule,
          gameTaken,
          element('p', { className: 'wizard-field' }, [t('wizard.gender')]),
          genders,
          element('p', { className: 'wizard-field' }, [t('wizard.looks')]),
          looks,
        ]),
        element('div', { className: 'wizard-preview' }, [preview, previewName]),
      ]),
      element('div', { className: 'wizard-buttons' }, buttons),
    );
  };

  // Escape leaves a wizard that exists as it was.
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && before) location.hash = '#start';
  };
  draw();
  return {
    node,
    mount: () => {
      document.addEventListener('keydown', onKey);
      node.querySelector<HTMLInputElement>('#wizard-name')?.focus();
    },
    relabel: () => {
      draw();
      node.querySelector<HTMLInputElement>('#wizard-name')?.focus();
    },
    destroy: () => document.removeEventListener('keydown', onKey),
  };
}
