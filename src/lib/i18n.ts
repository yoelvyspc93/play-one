import { useEffect, useState } from 'react';
import { TEXTS_EN, TEXTS_ES } from '@/engine/texts';
import { GameLanguage, loadSettings } from './settings';

export const TEXTS_BY_LANGUAGE = {
  es: TEXTS_ES,
  en: TEXTS_EN,
};

export type TextDictionary = typeof TEXTS_ES;

export function getTextsForLanguage(language: GameLanguage): TextDictionary {
  return TEXTS_BY_LANGUAGE[language] ?? TEXTS_ES;
}

export function useTexts() {
  const [language, setLanguage] = useState<GameLanguage>('es');

  useEffect(() => {
    setLanguage(loadSettings().language);
  }, []);

  return getTextsForLanguage(language);
}
