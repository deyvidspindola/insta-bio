#!/usr/bin/env python3
"""Otimiza a landing para conversão: remove redundâncias e adiciona FAQ/pacote."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "src" / "template-home.html"

WA = "https://wa.me/5519999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20insta-bio"
WA_VALORES = "https://wa.me/5519999999999?text=Quero%20saber%20os%20valores%20do%20insta-bio"
WA_PROPOSTA = "https://wa.me/5519999999999?text=Quero%20uma%20proposta%20do%20insta-bio"

NAV = """        <li class="py-2.5">
          <a href="#recursos" class="flex items-center gap-1 px-4 py-2 border border-transparent hover:border-stroke-2 dark:hover:border-stroke-7 rounded-full text-tagline-1 font-normal text-secondary/60 hover:text-secondary transition-all duration-200 dark:text-accent/60 dark:hover:text-accent">Recursos</a>
        </li>
        <li class="py-2.5">
          <a href="#como-funciona" class="flex items-center gap-1 px-4 py-2 border border-transparent hover:border-stroke-2 dark:hover:border-stroke-7 rounded-full text-tagline-1 font-normal text-secondary/60 hover:text-secondary transition-all duration-200 dark:text-accent/60 dark:hover:text-accent">Como funciona</a>
        </li>
        <li class="py-2.5">
          <a href="#pacote" class="flex items-center gap-1 px-4 py-2 border border-transparent hover:border-stroke-2 dark:hover:border-stroke-7 rounded-full text-tagline-1 font-normal text-secondary/60 hover:text-secondary transition-all duration-200 dark:text-accent/60 dark:hover:text-accent">Pacote</a>
        </li>
        <li class="py-2.5">
          <a href="#faq" class="flex items-center gap-1 px-4 py-2 border border-transparent hover:border-stroke-2 dark:hover:border-stroke-7 rounded-full text-tagline-1 font-normal text-secondary/60 hover:text-secondary transition-all duration-200 dark:text-accent/60 dark:hover:text-accent">FAQ</a>
        </li>"""

MOBILE_NAV = """          <li>
            <a href="#recursos" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Recursos</a>
          </li>
          <li>
            <a href="#como-funciona" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Como funciona</a>
          </li>
          <li>
            <a href="#pacote" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Pacote</a>
          </li>
          <li>
            <a href="#faq" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">FAQ</a>
          </li>"""

TRUST_STRIP = """
<section class="border-y border-stroke-4 dark:border-stroke-6 bg-background-2 dark:bg-background-5 py-6" aria-label="Diferenciais">
  <div class="main-container">
    <ul class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-tagline-2 text-secondary/70 dark:text-accent/70">
      <li class="flex items-center gap-2"><span class="ns-shape-34 text-lg text-secondary dark:text-accent"></span> Funciona na HostGator</li>
      <li class="flex items-center gap-2"><span class="ns-shape-10 text-lg text-secondary dark:text-accent"></span> Sem VPS · Sem banco de dados</li>
      <li class="flex items-center gap-2"><span class="ns-shape-36 text-lg text-secondary dark:text-accent"></span> Editor visual incluso</li>
      <li class="flex items-center gap-2"><span class="ns-shape-35 text-lg text-secondary dark:text-accent"></span> Você edita depois, sem programar</li>
    </ul>
  </div>
</section>
"""

PACOTE_SECTION = f"""
<section id="pacote" class="relative xl:py-[120px] lg:py-[90px] md:py-20 py-16 bg-background-2 dark:bg-background-5" aria-label="Pacote">
  <div class="main-container">
    <div class="max-w-[920px] mx-auto">
      <div class="text-center space-y-3 mb-10 md:mb-14">
        <span class="badge badge-green-v2">Pacote completo</span>
        <h2 data-ns-animate data-delay="0.1">Tudo para sua bio ficar no ar</h2>
        <p data-ns-animate data-delay="0.2" class="max-w-[560px] mx-auto">
          Um pacote pensado para quem quer resultado na bio do Instagram — sem mensalidade de plataforma cara.
        </p>
      </div>
      <div data-ns-animate data-delay="0.3" class="rounded-[24px] bg-white dark:bg-background-8 border border-stroke-4 dark:border-stroke-6 p-8 md:p-12">
        <div class="grid md:grid-cols-2 gap-10 items-start">
          <div class="space-y-6">
            <div>
              <p class="text-tagline-2 text-secondary/60 dark:text-accent/60 mb-1">Bio Profissional</p>
              <p class="text-heading-4 md:text-heading-3 text-secondary dark:text-accent">Investimento sob consulta</p>
              <p class="text-tagline-2 text-secondary/60 dark:text-accent/60 mt-3">
                O valor depende da quantidade de seções e do nível de personalização. Você recebe uma proposta clara antes de fechar — sem surpresas.
              </p>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start gap-2.5 text-secondary dark:text-accent"><span class="size-[18px] mt-0.5 rounded-full bg-ns-green shrink-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M4.31661 6.75605L9.74905 1.42144C10.0836 1.0959 10.0836 0.569702 9.74905 0.244158C9.41446 -0.081386 8.87363 -0.081386 8.53904 0.244158L3.7116 4.99012L1.46096 2.78807C1.12636 2.46253 0.585538 2.46253 0.250945 2.78807C-0.0836483 3.11362 -0.0836483 3.63982 0.250945 3.96536L3.1066 6.75605C3.27347 6.91841 3.49253 7 3.7116 7C3.93067 7 4.14974 6.91841 4.31661 6.75605Z" class="fill-white"/></svg></span> Setup inicial com logo, cores e textos</li>
              <li class="flex items-start gap-2.5 text-secondary dark:text-accent"><span class="size-[18px] mt-0.5 rounded-full bg-ns-green shrink-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M4.31661 6.75605L9.74905 1.42144C10.0836 1.0959 10.0836 0.569702 9.74905 0.244158C9.41446 -0.081386 8.87363 -0.081386 8.53904 0.244158L3.7116 4.99012L1.46096 2.78807C1.12636 2.46253 0.585538 2.46253 0.250945 2.78807C-0.0836483 3.11362 -0.0836483 3.63982 0.250945 3.96536L3.1066 6.75605C3.27347 6.91841 3.49253 7 3.7116 7C3.93067 7 4.14974 6.91841 4.31661 6.75605Z" class="fill-white"/></svg></span> Publicação na sua hospedagem (HostGator)</li>
              <li class="flex items-start gap-2.5 text-secondary dark:text-accent"><span class="size-[18px] mt-0.5 rounded-full bg-ns-green shrink-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M4.31661 6.75605L9.74905 1.42144C10.0836 1.0959 10.0836 0.569702 9.74905 0.244158C9.41446 -0.081386 8.87363 -0.081386 8.53904 0.244158L3.7116 4.99012L1.46096 2.78807C1.12636 2.46253 0.585538 2.46253 0.250945 2.78807C-0.0836483 3.11362 -0.0836483 3.63982 0.250945 3.96536L3.1066 6.75605C3.27347 6.91841 3.49253 7 3.7116 7C3.93067 7 4.14974 6.91841 4.31661 6.75605Z" class="fill-white"/></svg></span> Editor online com login e senha</li>
              <li class="flex items-start gap-2.5 text-secondary dark:text-accent"><span class="size-[18px] mt-0.5 rounded-full bg-ns-green shrink-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M4.31661 6.75605L9.74905 1.42144C10.0836 1.0959 10.0836 0.569702 9.74905 0.244158C9.41446 -0.081386 8.87363 -0.081386 8.53904 0.244158L3.7116 4.99012L1.46096 2.78807C1.12636 2.46253 0.585538 2.46253 0.250945 2.78807C-0.0836483 3.11362 -0.0836483 3.63982 0.250945 3.96536L3.1066 6.75605C3.27347 6.91841 3.49253 7 3.7116 7C3.93067 7 4.14974 6.91841 4.31661 6.75605Z" class="fill-white"/></svg></span> Suporte na entrega e orientação de uso</li>
            </ul>
          </div>
          <div class="rounded-2xl bg-background-2 dark:bg-background-5 p-6 space-y-4">
            <p class="text-tagline-1 font-medium text-secondary dark:text-accent">Referência de mercado</p>
            <p class="text-tagline-2 text-secondary/70 dark:text-accent/70">
              Links da bio profissionais costumam variar conforme complexidade. Por isso trabalhamos com <strong class="text-secondary dark:text-accent">proposta personalizada</strong> — você sabe exatamente o que está comprando antes de pagar.
            </p>
            <p class="text-tagline-2 text-secondary/70 dark:text-accent/70">
              Hospedagem na HostGator é por conta do cliente (planos a partir de ~R$ 15/mês). O insta-bio não cobra mensalidade de plataforma.
            </p>
            <a href="{WA_VALORES}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md w-full md:w-auto">
              <span>Consultar valores no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
"""

PARA_QUEM_SECTION = f"""
<section id="para-quem" class="relative xl:py-[120px] lg:py-[90px] md:py-20 py-16" aria-label="Para quem">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10 md:mb-14">
      <h2 data-ns-animate data-delay="0.1">Para quem é o insta-bio</h2>
      <p data-ns-animate data-delay="0.2" class="max-w-[520px] mx-auto">
        Se você usa o Instagram para atrair clientes, membros ou seguidores, sua bio precisa trabalhar por você.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 max-w-[1008px] mx-auto">
      <div data-ns-animate data-delay="0.3" class="rounded-[20px] bg-background-2 dark:bg-background-5 p-8 space-y-4">
        <span class="ns-shape-34 text-[40px] text-secondary dark:text-accent"></span>
        <h3 class="text-heading-6 text-secondary dark:text-accent">Igrejas e ministérios</h3>
        <p class="text-tagline-2">Cultos, grupos, eventos e WhatsApp organizados em um link só — com visual profissional.</p>
      </div>
      <div data-ns-animate data-delay="0.4" class="rounded-[20px] bg-background-2 dark:bg-background-5 p-8 space-y-4">
        <span class="ns-shape-35 text-[40px] text-secondary dark:text-accent"></span>
        <h3 class="text-heading-6 text-secondary dark:text-accent">Empresas e negócios locais</h3>
        <p class="text-tagline-2">Catálogo, horários, contato e redes sociais na bio — seus clientes acham tudo rápido.</p>
      </div>
      <div data-ns-animate data-delay="0.5" class="rounded-[20px] bg-background-2 dark:bg-background-5 p-8 space-y-4">
        <span class="ns-shape-36 text-[40px] text-secondary dark:text-accent"></span>
        <h3 class="text-heading-6 text-secondary dark:text-accent">Criadores e profissionais</h3>
        <p class="text-tagline-2">Portfólio, agenda, links de venda e WhatsApp na bio — para converter quem chega pelo Instagram.</p>
      </div>
    </div>
    <div data-ns-animate data-delay="0.6" class="text-center mt-10">
      <a href="{WA}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary dark:btn-transparent hover:btn-primary btn-md">
        <span>Falar no WhatsApp</span>
      </a>
    </div>
  </div>
</section>
"""

FAQ_SECTION = """
<section id="faq" class="relative xl:py-[120px] lg:py-[90px] md:py-20 py-16 bg-background-2 dark:bg-background-5" aria-label="Perguntas frequentes">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10 md:mb-14">
      <h2 data-ns-animate data-delay="0.1">Perguntas frequentes</h2>
      <p data-ns-animate data-delay="0.2" class="max-w-[480px] mx-auto">Tire suas dúvidas antes de falar conosco.</p>
    </div>
    <div data-ns-animate data-delay="0.3" class="max-w-[850px] space-y-4 accordion mx-auto">
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item active-accordion">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Preciso saber programar?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>Não. Montamos tudo para você e você edita depois pelo editor visual — textos, links, imagens e cores, sem código.</p>
          </div>
        </div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Funciona na HostGator?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>Sim. O insta-bio foi feito para hospedagem compartilhada como HostGator — sem VPS, sem Node.js e sem banco de dados em produção.</p>
          </div>
        </div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Quanto tempo leva para ficar pronto?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>Depende do briefing, mas na maioria dos casos sua bio fica no ar em poucos dias após recebermos logo, textos e links pelo WhatsApp.</p>
          </div>
        </div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Quanto custa?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>O investimento é sob consulta, conforme a complexidade do projeto. Enviamos proposta detalhada antes de você fechar. A hospedagem na HostGator é separada (cerca de R$ 15/mês em planos básicos).</p>
          </div>
        </div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Posso editar depois sozinho?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>Sim. Você recebe login e senha do editor online. Mudou um link ou texto? Salva e a bio atualiza na hora.</p>
          </div>
        </div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Preciso ter domínio próprio?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden">
          <div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8">
            <p>É recomendado ter um domínio (ex.: seunegocio.com.br ou bio.seunegocio.com.br). Se ainda não tiver, orientamos na contratação da hospedagem.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
"""

FLOATING_WA = f"""
<a href="{WA}" target="_blank" rel="noopener noreferrer" id="wa-float" class="fixed bottom-6 right-6 z-[998] size-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-105 transition-transform xl:hidden" aria-label="Falar no WhatsApp">
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>
"""

DEMO_INNER = f"""
        <div class="max-w-[420px] mx-auto relative z-10 px-5">
          <figure data-ns-animate data-delay="0.4" class="rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-white/10">
            <img src="/images/bio-preview.png" alt="Exemplo de bio profissional do insta-bio" class="w-full h-auto" />
          </figure>
          <div data-ns-animate data-delay="0.5" class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <a href="{WA}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md w-full sm:w-auto">
              <span>Falar no WhatsApp</span>
            </a>
            <a href="{WA_PROPOSTA}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary dark:btn-transparent hover:btn-primary btn-md w-full sm:w-auto">
              <span>Pedir proposta</span>
            </a>
          </div>
        </div>
"""


def remove_section(html: str, start_marker: str, end_marker: str) -> str:
    start = html.find(start_marker)
    if start == -1:
        return html
    end = html.find(end_marker, start)
    if end == -1:
        return html
    return html[:start] + html[end:]


def main() -> None:
    html = TEMPLATE.read_text(encoding="utf-8")

    # --- Hero: copy + CTAs invertidos ---
    html = html.replace(
        """        <h1 data-ns-animate data-delay="0.1">
          Seu link da bio <br />
          profissional para Instagram
        </h1>""",
        """        <h1 data-ns-animate data-delay="0.1">
          Sua bio profissional <br />
          no ar em poucos dias
        </h1>""",
    )
    html = html.replace(
        """          Página de links com editor visual para Instagram. Edite textos, imagens e links sem
          programar — ideal para igrejas, empresas e criadores que querem converter na bio.""",
        """          Montamos sua página de links para o Instagram com a sua marca. Depois você edita
          textos, imagens e links sozinho — sem programar.""",
    )
    # Swap hero CTA order and classes
    html = re.sub(
        r'<li\s+data-ns-animate\s+data-delay="0\.6"[\s\S]*?</li>\s*<li\s+data-ns-animate\s+data-delay="0\.8"[\s\S]*?</li>',
        f"""<li
          data-ns-animate
          data-delay="0.6"
          data-direction="left"
          data-offset="50"
          class="w-full sm:w-auto"
        >
          <a
            href="{WA}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary btn-md md:btn-xl hover:btn-secondary dark:hover:btn-accent md:w-auto w-[90%]"
            aria-label="Falar no WhatsApp sobre o insta-bio"
          >
            <span>Falar no WhatsApp</span>
          </a>
        </li>

        <li
          data-ns-animate
          data-delay="0.8"
          data-direction="left"
          data-offset="50"
          class="w-full sm:w-auto"
        >
          <a
            href="#demonstracao"
            class="btn btn-secondary btn-md md:btn-xl hover:btn-primary dark:btn-accent md:w-auto w-[90%]"
            aria-label="Ver demonstração do insta-bio"
          >
            <span>Ver demonstração</span>
          </a>
        </li>""",
        html,
        count=1,
    )
    # Hero image: show bio result
    html = html.replace('src="/images/editor-preview.png"', 'src="/images/bio-preview.png"', 2)

    # Trust strip after hero
    html = html.replace("</section>\n\n      <!-- =========================\nSteps section", f"</section>\n{TRUST_STRIP}\n      <!-- =========================\nSteps section")

    # Steps: fix copy + images + CTA
    html = html.replace(
        "Do briefing à publicação — sem complicação técnica para você ou seu cliente.",
        "Do briefing à publicação — simples para você, sem complicação técnica.",
    )
    html = html.replace("<span>Quero começar</span>", "<span>Falar no WhatsApp</span>")
    html = html.replace(
        'href="https://wa.me/5519999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20insta-bio" target="_blank" rel="noopener noreferrer"\n              class="btn hover:btn-primary dark:btn-transparent btn-secondary btn-md w-[85%] md:w-auto mx-auto"',
        f'href="{WA}" target="_blank" rel="noopener noreferrer"\n              class="btn btn-primary btn-md w-[85%] md:w-auto mx-auto"',
        1,
    )
    html = html.replace(
        '<img src="/images/editor-preview.png" alt="Editor do insta-bio" />',
        '<img src="/images/feat-editor.png" alt="Briefing e configuração" />',
        1,
    )
    html = html.replace(
        '<img src="/images/editor-preview.png" alt="Editor online do insta-bio" />',
        '<img src="/images/feat-update.png" alt="Editor online com autonomia" />',
        1,
    )

    # Recursos CTA
    html = html.replace("<span>Pedir proposta</span>", "<span>Falar no WhatsApp</span>", 1)
    html = html.replace(
        'href="https://wa.me/5519999999999?text=Quero%20uma%20proposta%20do%20insta-bio" target="_blank" rel="noopener noreferrer"\n            class="btn btn-secondary dark:btn-transparent hover:btn-primary btn-md w-[85%] md:w-auto mx-auto md:mx-0"',
        f'href="{WA}" target="_blank" rel="noopener noreferrer"\n            class="btn btn-primary btn-md w-[85%] md:w-auto mx-auto md:mx-0"',
        1,
    )
    # Recursos center image: editor
    html = html.replace(
        'src="/images/bio-preview.png"\n              class="w-full h-full object-contain"\n              alt="Bio profissional do insta-bio no celular"',
        'src="/images/editor-preview.png"\n              class="w-full h-full object-contain"\n              alt="Editor visual do insta-bio"',
        1,
    )

    # Remove feature v2 section entirely
    html = remove_section(
        html,
        "      <!-- =========================\nfeature v2 section",
        "      <!-- =========================\nServices section",
    )

    # Remove progress bar block inside services
    html = remove_section(html, "    <!-- Actions steps -->", "    <!-- Request demo -->")

    # Replace para-quem block
    html = re.sub(
        r'<div id="para-quem" class="my-24[\s\S]*?</div>\s*</div>\s*<!-- Download app -->',
        PARA_QUEM_SECTION + "\n    <!-- Download app -->",
        html,
        count=1,
    )

    # Replace demo inner content (QR -> bio preview)
    html = re.sub(
        r'<div class="text-center relative mb-\[70px\][\s\S]*?<div\s+class="absolute left-1/2 -translate-x-1/2 size-\[510px\]',
        f'<div class="text-center relative mb-10 z-0 space-y-5">\n          <span data-ns-animate data-delay="0.1" class="badge badge-blur">Demonstração ao vivo</span>\n          <div class="space-y-3">\n            <h3 data-ns-animate data-delay="0.2" class="lg:text-heading-2 md:text-heading-3 sm:text-heading-4 text-heading-5 text-white">Veja como fica na prática</h3>\n            <p data-ns-animate data-delay="0.3" class="text-accent/60 max-w-[480px] mx-auto">Este é um exemplo real de bio profissional — é assim que a sua pode ficar.</p>\n          </div>\n        </div>\n        {DEMO_INNER}\n          <div class="absolute left-1/2 -translate-x-1/2 size-[510px]',
        html,
        count=1,
    )

    # Insert pacote after recursos section
    html = html.replace(
        "</section>\n\n      <!-- =========================\nServices section",
        f"</section>\n{PACOTE_SECTION}\n      <!-- =========================\nServices section",
    )

    # Insert FAQ before testimonials
    html = html.replace(
        "      <!-- =========================\nTestimonial section",
        f"{FAQ_SECTION}\n      <!-- =========================\nTestimonial section",
    )

    # Testimonials -> casos de uso
    html = html.replace('id="depoimentos"', 'id="casos-de-uso"')
    html = html.replace("<h2 data-ns-animate data-delay=\"0.1\">Quem já confia</h2>", '<h2 data-ns-animate data-delay="0.1">Exemplos de uso</h2>')
    html = html.replace(
        '      <div class="text-center">\n        <h2 data-ns-animate data-delay="0.1">Exemplos de uso</h2>\n      </div>',
        '      <div class="text-center space-y-3">\n        <h2 data-ns-animate data-delay="0.1">Exemplos de uso</h2>\n        <p data-ns-animate data-delay="0.15" class="text-tagline-2 text-secondary/60 dark:text-accent/60 max-w-md mx-auto">Cenários ilustrativos — depoimentos reais em breve.</p>\n      </div>',
    )
    # Remove per-slide CTAs, add one below carousel
    html = re.sub(
        r'\s*<div class="absolute bottom-14 left-1/2 -translate-x-1/2">\s*<a[\s\S]*?<span>Quero uma igual</span>\s*</a>\s*</div>',
        "",
        html,
    )
    html = html.replace(
        '<div class="reviews-fade-in-pagination"></div>',
        f'<div class="reviews-fade-in-pagination"></div>\n        </div>\n      </div>\n      <div data-ns-animate data-delay="0.3" class="text-center mt-10">\n        <a href="{WA}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md">\n          <span>Falar no WhatsApp</span>\n        </a>\n      </div>\n    </div>\n  </div>\n</section>\n\nPLACEHOLDER_REMOVE',
    )
    # Fix duplicate closing from replacement - need cleaner approach

    html = re.sub(r"</section>\s*PLACEHOLDER_REMOVE[\s\S]*?</section>\s*\n\s*<!-- =========================\nCTA section", "\n      <!-- =========================\nCTA section", html)

    # Update testimonial names to illustrative
    html = html.replace("Pastor André", "Exemplo: ministério")
    html = html.replace("Igreja Comunidade Vida", "Cultos, grupos e WhatsApp")
    html = html.replace("Carla Mendes", "Exemplo: loja local")
    html = html.replace("Loja Artesanato &amp; Cia", "Catálogo e contato na bio")
    html = html.replace("Rafael Souza", "Exemplo: freelancer")
    html = html.replace("Designer freelancer", "Portfólio e agenda")

    # Remove avatar photos - use icons instead via hiding or replace with colored circles
    html = re.sub(
        r'<figure\s+class="size-28[\s\S]*?</figure>',
        '<div class="size-28 sm:mb-[42px] mb-4 mx-auto bg-background-2 dark:bg-background-6 border-4 border-white dark:border-background-5 rounded-full flex items-center justify-center"><span class="ns-shape-34 text-3xl text-secondary dark:text-accent"></span></div>',
        html,
    )

    # CTA final - client focused
    html = html.replace(
        "Pronto para vender mais pelo Instagram?",
        "Pronto para ter uma bio profissional?",
    )
    html = html.replace(
        "Fale conosco e receba uma proposta para o seu projeto ou do seu cliente.",
        "Fale conosco pelo WhatsApp e receba uma proposta personalizada para o seu perfil.",
    )
    html = html.replace("<span>Pedir proposta</span>", "<span>Falar no WhatsApp</span>")
    html = html.replace(WA_PROPOSTA, WA, 1)  # only first in CTA if proposta

    # Nav update
    html = re.sub(
        r"<nav class=\"hidden xl:flex items-center\">[\s\S]*?</nav>",
        f"<nav class=\"hidden xl:flex items-center\">\n      <ul class=\"flex items-center\">\n{NAV}\n      </ul>\n    </nav>",
        html,
        count=1,
    )
    html = re.sub(
        r'<div class="h-\[85vh\][\s\S]*?</ul>\s*</div>',
        lambda m: m.group(0).split("</ul>")[0].replace(
            re.search(r"<ul>[\s\S]*", m.group(0)).group(0).split("</ul>")[0],
            f"<ul>\n{MOBILE_NAV}\n          <li class=\"pt-4\">\n            <a href=\"{WA}\" class=\"btn btn-md btn-primary w-full\" target=\"_blank\" rel=\"noopener noreferrer\">\n              <span>Falar no WhatsApp</span>\n            </a>\n          </li>",
        )
        if False else f"""      <div class="h-[85vh] w-full overflow-y-auto overflow-x-hidden pb-10 scroll-bar">
        <ul>
{MOBILE_NAV}
          <li class="pt-4">
            <a href="{WA}" class="btn btn-md btn-primary w-full" target="_blank" rel="noopener noreferrer">
              <span>Falar no WhatsApp</span>
            </a>
          </li>
        </ul>
      </div>""",
        html,
        count=1,
    )

    # Header CTA primary
    html = html.replace(
        'class="btn btn-md btn-secondary hover:btn-primary dark:btn-accent" target="_blank"',
        'class="btn btn-md btn-primary hover:btn-secondary dark:hover:btn-accent" target="_blank"',
        1,
    )

    # Footer links
    html = html.replace("#depoimentos", "#casos-de-uso")
    html = html.replace("Depoimentos", "Exemplos", 1)

    # Floating WA + dark default hint on html in template body end
    html = html.replace(
        '<button\n  id="theme-toggle"',
        FLOATING_WA + '\n<button\n  id="theme-toggle"',
    )

    # Wrap services section - only demo left
    html = html.replace(
        "<section class=\"relative xl:py-[100px] lg:py-[90px] md:py-20 py-16\">",
        '<section class="relative xl:py-[80px] lg:py-[70px] md:py-16 py-12">',
        1,
    )

    TEMPLATE.write_text(html, encoding="utf-8")
    print(f"Otimizado: {TEMPLATE}")


if __name__ == "__main__":
    main()
