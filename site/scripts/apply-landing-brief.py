#!/usr/bin/env python3
"""Substitui o conteúdo <main> do template-home.html pelo brief comercial."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "src" / "template-home.html"
SNIPPET = ROOT / "src" / "landing-main.snippet.html"

WA_SOLICITAR = "https://wa.me/5519982624408?text=Ol%C3%A1!%20Quero%20solicitar%20minha%20p%C3%A1gina%20profissional%20para%20Instagram."
WA_ORGANIZAR = "https://wa.me/5519982624408?text=Ol%C3%A1!%20Quero%20organizar%20minha%20bio%20no%20Instagram."
WA_ORCAMENTO = "https://wa.me/5519982624408?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento."
WA_ESPECIALISTA = "https://wa.me/5519982624408?text=Ol%C3%A1!%20Quero%20falar%20com%20um%20especialista%20sobre%20minha%20p%C3%A1gina."

CHECK = """<span class="size-[18px] rounded-full bg-secondary shrink-0 flex items-center justify-center dark:bg-accent"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M4.31661 6.75605L9.74905 1.42144C10.0836 1.0959 10.0836 0.569702 9.74905 0.244158C9.41446 -0.081386 8.87363 -0.081386 8.53904 0.244158L3.7116 4.99012L1.46096 2.78807C1.12636 2.46253 0.585538 2.46253 0.250945 2.78807C-0.0836483 3.11362 -0.0836483 3.63982 0.250945 3.96536L3.1066 6.75605C3.27347 6.91841 3.49253 7 3.7116 7C3.93067 7 4.14974 6.91841 4.31661 6.75605Z" class="fill-white dark:fill-secondary"/></svg></span>"""

MAIN = f"""
    <main>
<!-- Hero -->
<section class="relative pt-36 lg:pt-[150px] md:pt-[180px] pb-12 sm:pb-0" aria-label="Hero">
  <div class="main-container md:mb-[70px] mb-10">
    <div class="text-center md:space-y-14 space-y-8">
      <div class="space-y-4 relative z-20">
        <h1 data-ns-animate data-delay="0.1">Transforme o único link do seu Instagram em uma página profissional.</h1>
        <p data-ns-animate data-delay="0.2" class="lg:max-w-[818px] md:max-w-[618px] sm:max-w-[518px] max-w-[450px] w-full mx-auto">
          Reúna WhatsApp, catálogo, redes sociais, localização e outros links em uma única página.
          Nós criamos tudo para você e, depois da publicação, você pode editar quando quiser.
        </p>
        <ul class="flex items-center lg:gap-9 sm:gap-6 gap-4 justify-center flex-wrap">
          <li data-ns-animate data-delay="0.3" class="flex items-center gap-1.5">{CHECK}<span class="text-secondary/60 text-tagline-2 dark:text-accent/60">Página criada para você</span></li>
          <li data-ns-animate data-delay="0.35" class="flex items-center gap-1.5">{CHECK}<span class="text-secondary/60 text-tagline-2 dark:text-accent/60">Hospedagem inclusa</span></li>
          <li data-ns-animate data-delay="0.4" class="flex items-center gap-1.5">{CHECK}<span class="text-secondary/60 text-tagline-2 dark:text-accent/60">Editor simples</span></li>
          <li data-ns-animate data-delay="0.45" class="flex items-center gap-1.5">{CHECK}<span class="text-secondary/60 text-tagline-2 dark:text-accent/60">Suporte em português</span></li>
        </ul>
      </div>
      <ul class="relative z-20 flex items-center justify-center sm:flex-row flex-col sm:gap-4 gap-y-5">
        <li data-ns-animate data-delay="0.5" class="w-full sm:w-auto">
          <a href="{WA_SOLICITAR}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md md:btn-xl hover:btn-secondary dark:hover:btn-accent md:w-auto w-[90%]">
            <span>Solicitar minha página</span>
          </a>
        </li>
        <li data-ns-animate data-delay="0.6" class="w-full sm:w-auto">
          <a href="#demonstracao" data-demo-link class="btn btn-secondary btn-md md:btn-xl hover:btn-primary dark:btn-accent md:w-auto w-[90%]">
            <span>Experimentar demonstração</span>
          </a>
        </li>
      </ul>
      <p data-ns-animate data-delay="0.65" class="text-tagline-2 text-secondary/50 dark:text-accent/50">Atendimento humano · Orçamento sem compromisso</p>
    </div>
  </div>
  <div data-ns-animate data-delay="0.7" class="lp:max-w-[1290px] xl:max-w-[1140px] lg:max-w-[940px] md:max-w-[640px] sm:max-w-[500px] max-w-[420px] w-full mx-auto">
    <figure class="w-full rounded-xl md:rounded-[20px] overflow-hidden border border-stroke-4 dark:border-stroke-6 shadow-2xl mb-8 md:mb-10">
      <img src="/images/bio-preview.png" alt="Exemplo de página profissional para Instagram" class="w-full h-auto object-contain" />
    </figure>
  </div>
</section>

<!-- Problema -->
<section id="problema" class="py-16 md:py-20 bg-background-2 dark:bg-background-5" aria-label="O problema">
  <div class="main-container max-w-[920px]">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Seu Instagram merece mais do que apenas um único link.</h2>
      <p data-ns-animate data-delay="0.2" class="site-muted-copy max-w-[640px] mx-auto">
        Quando alguém visita seu perfil, você tem poucos segundos para causar uma boa impressão.
        Uma página organizada facilita o contato, transmite profissionalismo e ajuda seus clientes a encontrarem rapidamente as informações que procuram.
      </p>
    </div>
    <div data-ns-animate data-delay="0.3" class="site-compare-grid">
      <div class="site-compare-card site-compare-card--muted">
        <h3 class="text-heading-6 text-secondary dark:text-accent mb-4">Hoje</h3>
        <ul class="space-y-3 text-tagline-2 site-muted-copy">
          <li>Apenas um link</li>
          <li>Informações espalhadas</li>
          <li>Perfil amador</li>
        </ul>
      </div>
      <div class="site-compare-card site-compare-card--accent">
        <h3 class="text-heading-6 text-secondary dark:text-accent mb-4">Com links na bio</h3>
        <ul class="space-y-3 text-tagline-2">
          <li>Todos os links organizados</li>
          <li>WhatsApp em destaque</li>
          <li>Visual profissional</li>
        </ul>
      </div>
    </div>
    <div data-ns-animate data-delay="0.4" class="text-center mt-10">
      <a href="{WA_ORGANIZAR}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md">Quero organizar minha bio</a>
    </div>
  </div>
</section>

<!-- Solução -->
<section id="solucao" class="py-16 md:py-20" aria-label="Nossa solução">
  <div class="main-container max-w-[920px] text-center">
    <h2 data-ns-animate data-delay="0.1" class="mb-4">Nós fazemos o trabalho pesado. Você só precisa compartilhar seu link.</h2>
    <p data-ns-animate data-delay="0.2" class="site-muted-copy max-w-[640px] mx-auto mb-10">
      Nossa equipe cria sua página inicial, publica tudo para você e deixa tudo pronto para uso.
      Depois disso, você mesmo pode atualizar textos, imagens e links através de um editor simples.
    </p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      <div data-ns-animate data-delay="0.25" class="site-feature-chip"><strong>Página personalizada</strong><span>Criada para o seu negócio</span></div>
      <div data-ns-animate data-delay="0.3" class="site-feature-chip"><strong>Editor simples</strong><span>Atualize quando quiser</span></div>
      <div data-ns-animate data-delay="0.35" class="site-feature-chip"><strong>Hospedagem inclusa</strong><span>Sua página sempre no ar</span></div>
      <div data-ns-animate data-delay="0.4" class="site-feature-chip"><strong>Atendimento humano</strong><span>Suporte em português</span></div>
    </div>
  </div>
</section>

<!-- Demonstração -->
<section id="demonstracao" class="relative xl:py-[100px] lg:py-[80px] md:py-16 py-12 dark:bg-black" aria-label="Demonstração do editor">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10 max-w-[720px] mx-auto">
      <span class="badge badge-green-v2">Demonstração</span>
      <h2 data-ns-animate data-delay="0.1">Veja como é fácil editar sua página.</h2>
      <p data-ns-animate data-delay="0.2" class="site-muted-copy">
        Experimente nosso editor antes de contratar.
        As alterações realizadas na demonstração não são salvas.
      </p>
    </div>
    <div data-ns-animate data-delay="0.3" class="site-editor-showcase mb-10 max-w-[900px] mx-auto">
      <figure class="site-editor-showcase__frame site-editor-showcase__frame--desktop">
        <img src="/images/editor-preview-desktop.png" alt="Editor do links na bio no computador" class="w-full h-auto" loading="lazy" />
      </figure>
      <figure class="site-editor-showcase__frame site-editor-showcase__frame--mobile">
        <img src="/images/editor-preview-mobile.png" alt="Editor do links na bio no celular" class="w-full h-auto" loading="lazy" />
      </figure>
    </div>
    <div data-ns-animate data-delay="0.4" class="text-center">
      <a href="#demonstracao" data-demo-link class="btn btn-primary btn-md"><span>Abrir demonstração</span></a>
    </div>
  </div>
</section>

<!-- Recursos -->
<section id="recursos" class="py-16 md:py-20 bg-background-2 dark:bg-background-5" aria-label="Recursos">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Tudo o que você precisa para ter uma página profissional.</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1008px] mx-auto">
      <div data-ns-animate data-delay="0.15" class="site-resource-card"><span class="ns-shape-34 text-2xl text-secondary dark:text-accent"></span><p>Criação da página</p></div>
      <div data-ns-animate data-delay="0.2" class="site-resource-card"><span class="ns-shape-35 text-2xl text-secondary dark:text-accent"></span><p>Hospedagem</p></div>
      <div data-ns-animate data-delay="0.25" class="site-resource-card"><span class="ns-shape-36 text-2xl text-secondary dark:text-accent"></span><p>Editor</p></div>
      <div data-ns-animate data-delay="0.3" class="site-resource-card"><span class="ns-shape-10 text-2xl text-secondary dark:text-accent"></span><p>WhatsApp em destaque</p></div>
      <div data-ns-animate data-delay="0.35" class="site-resource-card"><span class="ns-shape-34 text-2xl text-secondary dark:text-accent"></span><p>Organização dos links</p></div>
      <div data-ns-animate data-delay="0.4" class="site-resource-card"><span class="ns-shape-35 text-2xl text-secondary dark:text-accent"></span><p>Visual profissional</p></div>
      <div data-ns-animate data-delay="0.45" class="site-resource-card"><span class="ns-shape-36 text-2xl text-secondary dark:text-accent"></span><p>Responsivo</p></div>
      <div data-ns-animate data-delay="0.5" class="site-resource-card"><span class="ns-shape-10 text-2xl text-secondary dark:text-accent"></span><p>Suporte</p></div>
    </div>
  </div>
</section>

<!-- Como funciona -->
<section id="como-funciona" class="py-16 md:py-20" aria-label="Como funciona">
  <div class="main-container max-w-[720px]">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Sua página pronta em poucos passos.</h2>
    </div>
    <ol data-ns-animate data-delay="0.2" class="site-steps-list">
      <li><span class="site-steps-list__num">1</span><span>Fale conosco pelo WhatsApp.</span></li>
      <li><span class="site-steps-list__num">2</span><span>Conte sobre seu negócio.</span></li>
      <li><span class="site-steps-list__num">3</span><span>Nossa equipe cria sua página.</span></li>
      <li><span class="site-steps-list__num">4</span><span>Você aprova.</span></li>
      <li><span class="site-steps-list__num">5</span><span>Publicamos.</span></li>
      <li><span class="site-steps-list__num">6</span><span>Você edita quando quiser.</span></li>
    </ol>
    <div data-ns-animate data-delay="0.3" class="text-center mt-10">
      <a href="{WA_SOLICITAR}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md">Solicitar minha página</a>
    </div>
  </div>
</section>

<!-- Pacotes -->
<section id="pacote" class="py-16 md:py-20 bg-background-2 dark:bg-background-5" aria-label="Pacotes">
  <div class="main-container max-w-[920px]">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Pacotes</h2>
      <p data-ns-animate data-delay="0.15" class="site-muted-copy text-tagline-2">Valores podem variar conforme a personalização.</p>
    </div>
    <div class="grid md:grid-cols-2 gap-6">
      <div data-ns-animate data-delay="0.2" class="site-pricing-card">
        <h3 class="text-heading-5 text-secondary dark:text-accent mb-4">Essencial</h3>
        <p class="text-tagline-2 site-muted-copy mb-1">Implantação</p>
        <p class="text-heading-4 text-secondary dark:text-accent mb-4">R$ 197</p>
        <p class="text-tagline-2 site-muted-copy mb-1">Mensalidade</p>
        <p class="text-heading-5 text-secondary dark:text-accent">R$ 29</p>
      </div>
      <div data-ns-animate data-delay="0.25" class="site-pricing-card site-pricing-card--featured">
        <span class="site-editor-pill site-editor-pill--accent mb-3">Mais popular</span>
        <h3 class="text-heading-5 text-secondary dark:text-accent mb-4">Profissional</h3>
        <p class="text-tagline-2 site-muted-copy mb-1">Implantação</p>
        <p class="text-heading-4 text-secondary dark:text-accent mb-4">R$ 297</p>
        <p class="text-tagline-2 site-muted-copy mb-1">Mensalidade</p>
        <p class="text-heading-5 text-secondary dark:text-accent">R$ 39</p>
      </div>
    </div>
    <div data-ns-animate data-delay="0.3" class="text-center mt-10">
      <a href="{WA_ORCAMENTO}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-md">Solicitar orçamento</a>
    </div>
  </div>
</section>

<!-- Para quem é -->
<section id="para-quem" class="py-16 md:py-20" aria-label="Para quem é">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Para quem é</h2>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1008px] mx-auto">
      <div data-ns-animate data-delay="0.15" class="site-audience-card">Salões</div>
      <div data-ns-animate data-delay="0.18" class="site-audience-card">Barbearias</div>
      <div data-ns-animate data-delay="0.21" class="site-audience-card">Clínicas</div>
      <div data-ns-animate data-delay="0.24" class="site-audience-card">Restaurantes</div>
      <div data-ns-animate data-delay="0.27" class="site-audience-card">Lojas</div>
      <div data-ns-animate data-delay="0.3" class="site-audience-card">Academias</div>
      <div data-ns-animate data-delay="0.33" class="site-audience-card">Corretores</div>
      <div data-ns-animate data-delay="0.36" class="site-audience-card">Fotógrafos</div>
      <div data-ns-animate data-delay="0.39" class="site-audience-card">Criadores de conteúdo</div>
      <div data-ns-animate data-delay="0.42" class="site-audience-card">Igrejas</div>
      <div data-ns-animate data-delay="0.45" class="site-audience-card sm:col-span-2 lg:col-span-2">Pequenos negócios</div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-16 md:py-20 bg-background-2 dark:bg-background-5" aria-label="Perguntas frequentes">
  <div class="main-container">
    <div class="text-center space-y-3 mb-10">
      <h2 data-ns-animate data-delay="0.1">Perguntas frequentes</h2>
    </div>
    <div data-ns-animate data-delay="0.2" class="max-w-[850px] space-y-4 accordion mx-auto">
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item active-accordion">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Preciso saber criar sites?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Não.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Posso editar depois?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Sim.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Em quanto tempo fica pronta?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Até 24h úteis para projetos básicos.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">A hospedagem está inclusa?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Sim.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Funciona no Instagram?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Sim.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Posso colocar meu WhatsApp?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Sim.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Existe fidelidade?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Consultar condições comerciais.</p></div></div>
      </div>
      <div class="dark:bg-black bg-white rounded-[20px] px-6 md:px-8 accordion-item">
        <button class="accordion-action flex items-center cursor-pointer justify-between py-6 md:py-8 w-full">
          <span class="flex-1 text-left text-lg sm:text-heading-6 font-normal text-secondary dark:text-accent">Posso experimentar antes?</span>
          <span class="sm:ml-auto ml-2.5 block accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" class="stroke-secondary dark:stroke-accent"/></svg></span>
        </button>
        <div class="accordion-content hidden"><div class="border-t border-t-stroke-2 dark:border-t-stroke-6 pt-6 pb-8"><p>Sim. Existe uma demonstração pública.</p></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA final -->
<section class="relative lg:py-0 py-[50px]" aria-label="Chamada para ação">
  <div class="2xl:max-w-[1440px] xl:max-w-[1240px] lg:max-w-[980px] md:max-w-[700px] sm:max-w-[600px] min-[475px]:max-w-[450px] mx-auto w-full lg:-mb-14 relative max-md:px-5 z-10">
    <div class="lg:py-[76px] py-[50px] sm:px-0 px-6 bg-secondary dark:bg-background-8 lg:rounded-4xl rounded-2xl relative z-10 overflow-hidden">
      <div class="text-center space-y-5">
        <div class="space-y-3">
          <h2 class="lg:max-w-[830px] sm:max-w-[500px] max-w-[280px] mx-auto text-white" data-ns-animate data-delay="0.1">Vamos criar sua página profissional?</h2>
          <p class="text-accent/60 max-md:px-2" data-ns-animate data-delay="0.2">
            Nós cuidamos da criação da sua página para que você possa focar no seu negócio.
          </p>
        </div>
        <div data-ns-animate data-delay="0.3">
          <a href="{WA_ESPECIALISTA}" target="_blank" rel="noopener noreferrer" class="btn btn-primary border-0 btn-md hover:btn-white w-[85%] md:w-auto mx-auto">
            <span>Falar com um especialista</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

    </main>
"""

def patch_header(html: str) -> str:
    html = html.replace(
        'content="links na bio — link da bio profissional para Instagram. Editor visual com templates, fundos gradiente e preview ao vivo. Publique no seu domínio ou na nossa plataforma."',
        'content="Criamos sua página profissional para Instagram com hospedagem, suporte e editor simples para atualizações."',
    )
    html = html.replace(
        '<title>links na bio · Link da Bio Profissional</title>',
        '<title>Página profissional para Instagram | links na bio</title>',
    )
    # OG tags
    og = """
<meta property="og:type" content="website" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:title" content="Página profissional para Instagram | links na bio" />
<meta property="og:description" content="Criamos sua página profissional para Instagram com hospedagem, suporte e editor simples para atualizações." />
<meta property="og:site_name" content="links na bio" />
<meta name="twitter:card" content="summary_large_image" />
"""
    if 'property="og:type"' not in html:
        html = html.replace('<meta name="viewport"', og + '<meta name="viewport"')

    html = html.replace(
        '<a href="#editor"',
        '<a href="#demonstracao"',
    )
    html = html.replace('>Editor</a>', '>Demonstração</a>', 2)

    html = html.replace(
        'href="https://wa.me/5519982624408?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20links%20na%20bio"',
        f'href="{WA_SOLICITAR}"',
    )
    html = html.replace('<span>Falar no WhatsApp</span>', '<span>Solicitar minha página</span>', 2)
    return html


def patch_footer(html: str) -> str:
    html = html.replace(
        """          <p class="mt-4 mb-7 text-secondary dark:text-accent">
            Link da bio profissional para Instagram — editor visual e publicação no seu domínio ou na nossa plataforma.
          </p>""",
        """          <p class="mt-4 mb-7 text-secondary dark:text-accent">
            Sua página profissional para Instagram.<br />
            Atendimento via WhatsApp.
          </p>""",
    )
    html = html.replace(
        'href="https://wa.me/5519982624408?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20links%20na%20bio"',
        f'href="{WA_SOLICITAR}"',
    )
    html = html.replace(
        'href="https://wa.me/5519982624408?text=Quero%20uma%20proposta%20do%20links%20na%20bio"',
        f'href="{WA_ORCAMENTO}"',
    )
    html = html.replace('> Pedir proposta </a>', '> Solicitar orçamento </a>')
    html = html.replace('<a href="#editor" class="footer-link-v2"> Editor </a>', '<a href="#demonstracao" class="footer-link-v2"> Demonstração </a>')
    html = html.replace(
        '<li>\n                <a href="#casos-de-uso" class="footer-link-v2"> Exemplos </a>\n              </li>',
        '',
    )
    return html


def main() -> None:
    html = TEMPLATE.read_text(encoding='utf-8')
    start = html.index('<main>')
    end = html.index('</main>') + len('</main>')
    html = html[:start] + MAIN.strip() + html[end:]
    html = patch_header(html)
    html = patch_footer(html)
    TEMPLATE.write_text(html, encoding='utf-8')
    print('template-home.html atualizado.')


if __name__ == '__main__':
    main()
