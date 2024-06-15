import { ui, defaultLang, showDefaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export type KeyTranslation = keyof typeof ui[typeof defaultLang];

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: KeyTranslation) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: keyof typeof ui, url: URL) {
  const currentLang = getLangFromUrl(url);
  return function translatePath(path: string, l: string = lang) {
    if (showDefaultLang) {
      const [,, ...pathWithoutLang] = path.split('/');
      return `/${l}/${pathWithoutLang.join('/')}`;
    }
    if (l === defaultLang && currentLang === defaultLang) {
      const [, ...pathWithoutLang] = path.split('/');
      return `/${pathWithoutLang.join('/')}`;
    }
    if (l === defaultLang) {
      const [,, ...pathWithoutLang] = path.split('/');
      return `/${pathWithoutLang.join('/')}`;
    }
    return `/${l}${path}`;
  };
}

export function useLocalceStaticPaths(locale: string) {
  if (showDefaultLang) {
    return locale;
  }
  if (locale === defaultLang) {
    return undefined;
  }
  return locale;
}
