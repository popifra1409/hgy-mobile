import React, { createContext, useContext, useState } from 'react'

type Lang = 'fr' | 'en'
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; toggleLang: () => void }>({
  lang: 'fr', setLang: () => {}, toggleLang: () => {}
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  const toggleLang = () => setLang(l => l === 'fr' ? 'en' : 'fr')
  return <LangContext.Provider value={{ lang, setLang, toggleLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
