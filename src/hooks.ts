import { useContext } from 'react';
import TranslatorContext from './context';

export const useTranslator = (bundleId: string) => {
  const translator = useContext(TranslatorContext);
  return translator.load(bundleId);
};
