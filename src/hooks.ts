import { useContext } from 'react';

import { TranslationBundle } from '@jupyterlab/translation';

import TranslatorContext from './context';

export function useTranslator(bundleId: string): TranslationBundle {
  const translator = useContext(TranslatorContext);
  return translator.load(bundleId);
}
