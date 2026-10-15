'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/lib/translations'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLang: () => void
  t: typeof translations['th']
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('th')

  useEffect(() => {
    const saved = localStorage.getItem('pipelinedeal_lang') as Language
    if (saved === 'th' || saved === 'en') {
      setLangState(saved)
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('pipelinedeal_lang', newLang)
  }

  const toggleLang = () => {
    const nextLang = lang === 'th' ? 'en' : 'th'
    setLang(nextLang)
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: translations[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
