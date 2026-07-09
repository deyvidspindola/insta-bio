import { createContext, useContext, type ReactNode } from 'react'

const DemoModeContext = createContext(false)

export function DemoModeProvider({ children, value }: { children: ReactNode; value: boolean }) {
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
