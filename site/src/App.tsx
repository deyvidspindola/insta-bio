import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { WhatsAppFloat } from './components/WhatsAppFloat'
import { Hero } from './components/sections/Hero'
import { Compare } from './components/sections/Compare'
import { HowItWorks } from './components/sections/HowItWorks'
import { EditorShowcase } from './components/sections/EditorShowcase'
import { Clients } from './components/sections/Clients'
import { Pricing } from './components/sections/Pricing'
import { Faq } from './components/sections/Faq'
import { FinalCta } from './components/sections/FinalCta'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Compare />
        <HowItWorks />
        <EditorShowcase />
        <Clients />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
