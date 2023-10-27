import { useContext } from 'react';

import { TranslationBundle } from '@jupyterlab/translation';

import TranslatorContext, { Logger, LogContext } from './context';

export function useTranslator(bundleId: string): TranslationBundle {
  const translator = useContext(TranslatorContext);
  return translator.load(bundleId);
}

export function useEventLogger(): Logger {
  const logger: Logger = useContext(LogContext);
  return logger;
}
