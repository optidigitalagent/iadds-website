'use client';
import { createContext, useContext } from 'react';
import type { Dictionary } from '@/content/en/site';
import type { Locale } from '@/types/content';
const Context = createContext<{ locale: Locale; ui: Dictionary['ui'] } | null>(null);
export function LocaleProvider({ locale, ui, children }: { locale: Locale; ui: Dictionary['ui']; children: React.ReactNode }) {
  return <Context.Provider value={{ locale, ui }}>{children}</Context.Provider>;
}
export function useSiteLocale() { const context = useContext(Context); if (!context) throw new Error('Missing locale provider'); return context; }
