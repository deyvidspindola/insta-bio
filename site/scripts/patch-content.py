#!/usr/bin/env python3
"""Atualiza o template HTML com conteúdo comercial do insta-bio."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "src" / "template-home.html"

WA = "https://wa.me/5519999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20insta-bio"
WA_PROPOSTA = "https://wa.me/5519999999999?text=Quero%20uma%20proposta%20do%20insta-bio"
WA_DEMO = "https://wa.me/5519999999999?text=Quero%20ver%20uma%20demonstra%C3%A7%C3%A3o"

NAV_LINK = (
    'class="flex items-center gap-1 px-4 py-2 border border-transparent '
    'hover:border-stroke-2 dark:hover:border-stroke-7 rounded-full text-tagline-1 '
    'font-normal text-secondary/60 hover:text-secondary transition-all duration-200 '
    'dark:text-accent/60 dark:hover:text-accent"'
)

HEADER = f"""<header>
  <div
    class="header-one opacity-0 rounded-full lp:!max-w-[1290px] xl:max-w-[1140px] lg:max-w-[960px] md:max-w-[720px] sm:max-w-[540px] min-[500px]:max-w-[450px] min-[425px]:max-w-[375px] max-w-[320px] mx-auto w-full fixed left-1/2 -translate-x-1/2 z-50 top-5 flex items-center justify-between px-2.5 xl:py-0 py-2.5 bg-white dark:bg-background-5"
    data-ns-animate
    data-direction="up"
    data-offset="100"
  >
    <div>
      <a href="#">
        <span class="sr-only">insta-bio</span>
        <figure class="lg:flex hidden items-center gap-2.5 max-w-none">
          <img src="/logo-instabio.svg" alt="insta-bio" class="size-9 shrink-0" />
          <span class="font-semibold text-secondary dark:text-accent text-lg whitespace-nowrap">insta-bio</span>
        </figure>
        <figure class="max-w-[44px] lg:hidden block">
          <img src="/logo-instabio.svg" alt="insta-bio" class="w-full" />
        </figure>
      </a>
    </div>
    <nav class="hidden xl:flex items-center">
      <ul class="flex items-center">
        <li class="py-2.5">
          <a href="#recursos" {NAV_LINK}>Recursos</a>
        </li>
        <li class="py-2.5">
          <a href="#como-funciona" {NAV_LINK}>Como funciona</a>
        </li>
        <li class="py-2.5">
          <a href="#para-quem" {NAV_LINK}>Para quem</a>
        </li>
        <li class="py-2.5">
          <a href="#depoimentos" {NAV_LINK}>Depoimentos</a>
        </li>
      </ul>
    </nav>
    <div class="xl:flex hidden items-center justify-center">
      <a href="{WA}" class="btn btn-md btn-secondary hover:btn-primary dark:btn-accent" target="_blank" rel="noopener noreferrer">
        <span>Falar no WhatsApp</span>
      </a>
    </div>
    <div class="xl:hidden block">
      <button
        class="nav-hamburger flex flex-col gap-[5px] size-12 bg-background-4 dark:bg-background-6 rounded-full items-center justify-center cursor-pointer"
      >
        <span class="sr-only">Menu</span>
        <span class="block w-6 h-0.5 bg-stroke-9 dark:bg-stroke-1"></span>
        <span class="block w-6 h-0.5 bg-stroke-9 dark:bg-stroke-1"></span>
        <span class="block w-6 h-0.5 bg-stroke-9 dark:bg-stroke-1"></span>
      </button>
    </div>
  </div>
  <aside
    class="sidebar fixed top-0 right-0 w-full sm:w-1/2 translate-x-full transition-all duration-300 h-screen bg-white dark:bg-background-7 xl:hidden z-[999] scroll-bar"
  >
    <div class="lg:p-9 sm:p-8 p-5 space-y-4">
      <div class="flex items-center justify-between">
        <a href="#">
          <span class="sr-only">insta-bio</span>
          <figure class="flex items-center gap-2 max-w-none">
            <img src="/logo-instabio.svg" alt="insta-bio" class="size-9" />
            <span class="font-semibold text-secondary dark:text-accent">insta-bio</span>
          </figure>
        </a>
        <button
          class="nav-hamburger-close flex flex-col gap-1.5 size-10 bg-background-4 dark:bg-background-9 rounded-full items-center justify-center cursor-pointer relative"
        >
          <span class="sr-only">Fechar menu</span>
          <span class="block w-4 h-0.5 bg-stroke-9/60 dark:bg-stroke-1 rotate-45 absolute"></span>
          <span class="block w-4 h-0.5 bg-stroke-9/60 dark:bg-stroke-1 -rotate-45 absolute"></span>
        </button>
      </div>
      <div class="h-[85vh] w-full overflow-y-auto overflow-x-hidden pb-10 scroll-bar">
        <ul>
          <li>
            <a href="#recursos" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Recursos</a>
          </li>
          <li>
            <a href="#como-funciona" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Como funciona</a>
          </li>
          <li>
            <a href="#para-quem" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Para quem</a>
          </li>
          <li>
            <a href="#depoimentos" class="text-tagline-1 font-normal text-secondary/60 dark:text-accent/60 transition-all duration-200 py-3 border-b border-stroke-4 dark:border-stroke-6 w-full text-left block">Depoimentos</a>
          </li>
          <li class="pt-4">
            <a href="{WA}" class="btn btn-md btn-secondary hover:btn-primary dark:btn-accent w-full" target="_blank" rel="noopener noreferrer">
              <span>Falar no WhatsApp</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</header>"""

REPLACEMENTS: list[tuple[str, str]] = [
    # Head
    (
        '<title>Mobile Management Software - NextSaaS</title>',
        '<title>insta-bio · Link da Bio Profissional</title>',
    ),
    (
        'content="NextSaaS - Modern HTML template collection with 35+ home page variations for SaaS businesses, startups, and web applications. Features responsive design, authentication pages, pricing, blog, and more with Tailwind CSS and Vite."',
        'content="insta-bio — link da bio profissional para Instagram. Editor visual, hospedagem simples na HostGator e página que converte. Ideal para igrejas, empresas e criadores."',
    ),
    ('<meta name="author" content="NextSaaS" />', '<meta name="author" content="insta-bio" />'),
    # Hero
    (
        """        <h1 data-ns-animate data-delay="0.1">
          Mobile device <br />
          management software
        </h1>""",
        """        <h1 data-ns-animate data-delay="0.1">
          Seu link da bio <br />
          profissional para Instagram
        </h1>""",
    ),
    (
        """          NextSaaS empowers organizations to manage their mobile fleet with confidence. From
          security policies to remote configurations—manage every device without touching it.""",
        """          Página de links com editor visual para Instagram. Edite textos, imagens e links sem
          programar — ideal para igrejas, empresas e criadores que querem converter na bio.""",
    ),
    ("              Free installation\n", "              Setup inicial incluso\n"),
    ("              App version 3.9\n", "              Editor online\n"),
    (
        "              4.4 rated by 1,300,000+ customers\n",
        "              Hospedagem HostGator, sem VPS\n",
    ),
    ("            <span>Take a product tour</span>", '<span>Ver demonstração</span>'),
    ('href="./case-study-page.html"\n            class="btn btn-primary', 'href="#demonstracao"\n            class="btn btn-primary'),
    ("            <span>Start free trial</span>", "<span>Falar no WhatsApp</span>"),
    (
        'href="./contact-us-page.html"\n            class="btn btn-secondary btn-md md:btn-xl hover:btn-primary dark:btn-accent',
        f'href="{WA}"\n            target="_blank"\n            rel="noopener noreferrer"\n            class="btn btn-secondary btn-md md:btn-xl hover:btn-primary dark:btn-accent',
    ),
    ('alt="NextSaaS mobile device management software"', 'alt="Demonstração da bio profissional insta-bio"'),
    # Steps
    (
        '<section\n  class="relative xl:py-[200px] lg:py-[100px] md:py-20 py-16 bg-background-2 dark:bg-background-5"\n  aria-label="Hero section"\n>',
        '<section\n  id="como-funciona"\n  class="relative xl:py-[200px] lg:py-[100px] md:py-20 py-16 bg-background-2 dark:bg-background-5"\n  aria-label="Como funciona"\n>',
    ),
    ("              Manage any device in 3 easy steps", "              Sua bio no ar em 3 passos simples"),
    (
        "              We streamline automation for a strategic and sustainable AI transition.",
        "              Do briefing à publicação — sem complicação técnica para você ou seu cliente.",
    ),
    ("              <span>Get started now</span>", "<span>Quero começar</span>"),
    ("                  Download the app", "                  1. Envie logo, textos e links"),
    (
        "                  Daownloads available for iOS, Android & enterprise tablets.",
        "                  Briefing rápido pelo WhatsApp com tudo que precisamos.",
    ),
    ("                  Create your account", "                  2. Montamos e publicamos"),
    (
        "                  Add teams, assign policies, and connect devices in minutes.",
        "                  Layout, cores, seções e links configurados para você.",
    ),
    ("                  Start managing", "                  3. Você recebe o editor"),
    (
        "                  Monitor, restrict, or wipe devices remotely any time.",
        "                  Login, senha e autonomia para editar quando quiser.",
    ),
    # Features
    (
        '<section\n  class="relative xl:py-[200px] lg:py-[100px] md:py-20 py-16 dark:bg-black"\n  aria-label="Hero section"\n>',
        '<section\n  id="recursos"\n  class="relative xl:py-[200px] lg:py-[100px] md:py-20 py-16 dark:bg-black"\n  aria-label="Recursos"\n>',
    ),
    ("        <h2 data-ns-animate data-delay=\"0.2\">Why teams love NextSaaS</h2>", "        <h2 data-ns-animate data-delay=\"0.2\">Por que escolher o insta-bio</h2>"),
    (
        "          Manage your entire mobile infrastructure from one platform",
        "          Tudo que seu público precisa em um só link da bio",
    ),
    ("                Enforce passcode policies", "                Editor visual"),
    (
        "                Apply in minutes from any device—no paperwork, no hassle.",
        "                Edite textos, links e imagens sem escrever uma linha de código.",
    ),
    ("                Lock devices in kiosk mode", "                Hospedagem simples"),
    (
        "                Our specialists guide you every step of the way, tailored to your needs.",
        "                Funciona em HostGator e hospedagem compartilhada — sem VPS.",
    ),
    ("                Real-time sync across devices", "                Sem banco de dados"),
    (
        "                Get access to fair rates with zero hidden fees or surprises.",
        "                Arquivos estáticos + PHP. Leve, confiável e fácil de manter.",
    ),
    ("                App whitelisting & blacklisting", "                Layout que converte"),
    (
        "                Know where you stand quickly—get pre-approved in hours, not days.",
        "                Cards de WhatsApp, links, eventos e cores da sua marca.",
    ),
    ("                Configure Wi-Fi & network settings", "                Atualize na hora"),
    (
        "                Apply in minutes from any device—no paperwork, no hassle.",
        "                Mudou o link? Salve no editor e a bio atualiza na hora.",
    ),
    ("                Remote wipe & factory reset", "                Mobile first"),
    (
        "                We stay with you post-closing to ensure a smooth transition.",
        "                Página responsiva, rápida e pensada para quem vem do Instagram.",
    ),
    ("            What we can do for your device strategy", "            O que está incluso no pacote"),
    (
        "            From consulting to implementation, our solutions are built to transform the way you\n            work.",
        "            Tudo para você vender, entregar e manter a bio do cliente com profissionalismo.",
    ),
    ("                    Product analytics & device insights", "                    Painel visual"),
    ("                    Make better decisions with detailed usage reporting.", "                    Edite conteúdo, cores e seções com interface amigável."),
    ("                    Creative policy control", "                    HostGator pronta"),
    (
        "                    Customize user roles, usage limits, and location rules.",
        "                    Publicação em hospedagem compartilhada, sem mensalidade de VPS.",
    ),
    ("                    Smart feature development", "                    Setup inicial"),
    (
        "                    Enterprise-level security features, are constantly updated.",
        "                    Logo, cores, textos e links configurados na entrega.",
    ),
    ("                    Easy deployment & recovery", "                    Suporte e autonomia"),
    (
        "                    Easily set up, fix, or reset your devices from anywhere!",
        "                    Você e seu cliente editam depois, com login e senha próprios.",
    ),
    ("            <span>Talk to an expert</span>", "<span>Pedir proposta</span>"),
    # Feature v2
    ("                Supercharge your app management", "                Impulsione suas vendas pelo Instagram"),
    (
        "                Modern tools make managing your money simpler than ever. From clear, customizable\n                budgets to smart savings goals",
        "                Uma bio profissional que organiza links, destaca ofertas e leva o visitante direto para o WhatsApp ou formulário certo.",
    ),
    ("                <span>Try the app for Free</span>", "<span>Quero o meu</span>"),
    ("            <h3 class=\"md:text-heading-5 text-heading-6\">Keep all data protected</h3>", "<h3 class=\"md:text-heading-5 text-heading-6\">Editor online</h3>"),
    ("            <p>End-to-end encrypted & centrally managed</p>", "<p>Área restrita para editar sem programar</p>"),
    ("            <h3 class=\"md:text-heading-5 text-heading-6\">Multi-device support</h3>", "<h3 class=\"md:text-heading-5 text-heading-6\">Hospedagem leve</h3>"),
    ("            <p>Manage tablets, phones & rugged devices</p>", "<p>Sem Node, sem MySQL — só PHP na produção</p>"),
    ("            <h3 class=\"md:text-heading-5 text-heading-6\">Team collaboration</h3>", "<h3 class=\"md:text-heading-5 text-heading-6\">Várias seções</h3>"),
    ("            <p>Shared dashboards & role-based access</p>", "<p>WhatsApp, links, cards, grade de eventos e mais</p>"),
    ("            <h3 class=\"md:text-heading-5 text-heading-6\">Seamless sync & backup</h3>", "<h3 class=\"md:text-heading-5 text-heading-6\">Atualização instantânea</h3>"),
    ("            <p>Continuous performance, zero disruptions</p>", "<p>Salvou no editor? A bio publica na hora</p>"),
    # Services
    ("                Boost team efficiency", "                Briefing rápido"),
    ("              <p>Reduce time spent on manual device tasks</p>", "<p>Você envia logo, textos e links pelo WhatsApp</p>"),
    ("                Remote device access", "                Publicação na hospedagem"),
    ("              <p>Update settings or apps without physical contact</p>", "<p>Montamos layout, cores e seções no seu domínio</p>"),
    ("                Zero maintenance required", "                Editor com login"),
    ("              <p>Nutritive UI that anyone can manage</p>", "<p>Cliente edita sozinho depois, com senha própria</p>"),
    ("          <span>See It in action</span>", "<span>Ver como funciona</span>"),
    (
        '<div class="my-24 lg:my-[100px]">',
        '<div id="para-quem" class="my-24 lg:my-[100px]">',
    ),
    (
        "                Designed for security teams that can't afford downtime",
        "                Feito para quem precisa de resultado na bio",
    ),
    (
        "                Track key indicators, spot trends early, and turn data into action.",
        "                Organize cultos, catálogo, portfólio ou links de venda em um só lugar.",
    ),
    ("                  Kiosk mode for retail & public devices", "                  Igrejas e ministérios"),
    ("                <p class=\"text-secondary dark:text-accent\">Factory reset protection</p>", "<p class=\"text-secondary dark:text-accent\">Empresas e negócios locais</p>"),
    (
        "                  Restrict profile removal & unauthorized changes",
        "                  Criadores e profissionais",
    ),
    ("                <span>Request a live demo</span>", "<span>Pedir demonstração</span>"),
    # Download / demo section
    (
        '<div\n        class="md:rounded-4xl rounded-2xl bg-secondary dark:bg-background-5 lg:py-[100px] py-[50px] relative overflow-hidden"\n      >',
        '<div\n        id="demonstracao"\n        class="md:rounded-4xl rounded-2xl bg-secondary dark:bg-background-5 lg:py-[100px] py-[50px] relative overflow-hidden"\n      >',
    ),
    ('<span data-ns-animate data-delay="0.1" class="badge badge-blur">Download your app</span>', '<span data-ns-animate data-delay="0.1" class="badge badge-blur">Demonstração ao vivo</span>'),
    ("              App download & access", "              Veja na prática"),
    ("               Manage Anywhere. Anytime.", "               Esta página é o produto — exemplo real de bio"),
    ("              <p class=\"dark:text-accent\">Scan the QR code to start!</p>", "<p class=\"dark:text-accent\">É assim que a bio do seu cliente pode ficar</p>"),
    ("                  Apple Store", "                  Ver bio demo"),
    ("                  Google Play", "                  Falar no WhatsApp"),
    # Testimonials
    (
        '<section\n  class="relative lg:py-[200px] md:py-[100px] py-[50px] bg-background-2 dark:bg-background-5"\n>',
        '<section\n  id="depoimentos"\n  class="relative lg:py-[200px] md:py-[100px] py-[50px] bg-background-2 dark:bg-background-5"\n>',
    ),
    ('        <h2 data-ns-animate data-delay="0.1">Customer reviews</h2>', '        <h2 data-ns-animate data-delay="0.1">Quem já confia</h2>'),
    (
        '"Managing our fleet of 500+ field tablets has never been easier with NextSaaS."',
        '"Nossa igreja organizou cultos, grupos e WhatsApp em um link só. Ficou muito mais profissional."',
    ),
    ("                      Michael Anderson", "                      Pastor André"),
    ("                    <p class=\"text-tagline-2\">IT Director, Enterprise Solutions</p>", '<p class="text-tagline-2">Igreja Comunidade Vida</p>'),
    (
        '"The implementation was flawless and we saw immediate results. Team efficiency\n                    jumped by 45% in the first month."',
        '"O catálogo e o contato ficaram organizados na bio. Os clientes acham tudo rápido pelo Instagram."',
    ),
    ("                      James Wilson", "                      Carla Mendes"),
    ('<p class="text-tagline-2">CTO, Digital Innovations Corp</p>', '<p class="text-tagline-2">Loja Artesanato &amp; Cia</p>'),
    (
        '"NextSaaS transformed how we manage our device fleet. The ROI has been\n                    incredible."',
        '"Meu portfólio e agenda de consultas na bio converteram muito mais depois do insta-bio."',
    ),
    ("                      Robert Thompson", "                      Rafael Souza"),
    ('<p class="text-tagline-2">Operations Director, Tech Systems</p>', '<p class="text-tagline-2">Designer freelancer</p>'),
    ("                    <span>Read success stories</span>", "<span>Quero uma igual</span>"),
    # CTA
    (">Get started</span", ">Comece agora</span"),
    ("              Control all devices from one dashboard!", "              Pronto para vender mais pelo Instagram?"),
    (
        "              Join thousands of businesses securing their mobile ecosystems with NextSaaS.",
        "              Fale conosco e receba uma proposta para o seu projeto ou do seu cliente.",
    ),
    ("              <span>Book a demo</span>", "<span>Pedir proposta</span>"),
    # Footer
    (
        '<img src="./images/shared/light-logo.svg" class="dark:hidden" alt="NextSass" />\n            <img src="./images/shared/dark-logo.svg" class="hidden dark:block" alt="NextSass" />',
        '<img src="/logo-instabio.svg" alt="insta-bio" class="h-9 w-auto" />',
    ),
    (
        "            Turpis tortor nunc sed amet et faucibus vitae morbi congue sed id mauris.",
        "            Link da bio profissional para Instagram com editor visual e hospedagem simples.",
    ),
    (
        '              Company\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="./our-team-page-01.html" class="footer-link-v2"> About Us </a>\n              </li>\n              <li>\n                <a href="./career-page.html" class="footer-link-v2"> Career </a>\n              </li>\n              <li>\n                <a href="./case-study-page.html" class="footer-link-v2"> Case Studies </a>\n              </li>\n              <li>\n                <a href="./contact-us-page.html" class="footer-link-v2"> Contact Us </a>',
        '              Produto\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="#recursos" class="footer-link-v2"> Recursos </a>\n              </li>\n              <li>\n                <a href="#como-funciona" class="footer-link-v2"> Como funciona </a>\n              </li>\n              <li>\n                <a href="#para-quem" class="footer-link-v2"> Para quem </a>\n              </li>\n              <li>\n                <a href="#demonstracao" class="footer-link-v2"> Demonstração </a>',
    ),
    (
        '              Support\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="./faq-page.html" class="footer-link-v2"> FAQ </a>\n              </li>\n              <li>\n                <a href="./documentation-page.html" class="footer-link-v2"> Documentation </a>\n              </li>\n              <li>\n                <a href="./learn-page.html" class="footer-link-v2"> Tutorial </a>\n              </li>\n              <li>\n                <a href="./support-page.html" class="footer-link-v2"> Support </a>',
        '              Contato\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="' + WA + '" class="footer-link-v2" target="_blank" rel="noopener noreferrer"> WhatsApp </a>\n              </li>\n              <li>\n                <a href="' + WA_PROPOSTA + '" class="footer-link-v2" target="_blank" rel="noopener noreferrer"> Pedir proposta </a>\n              </li>\n              <li>\n                <a href="' + WA_DEMO + '" class="footer-link-v2" target="_blank" rel="noopener noreferrer"> Ver demonstração </a>\n              </li>\n              <li>\n                <a href="#depoimentos" class="footer-link-v2"> Depoimentos </a>',
    ),
    (
        '              Legal Policies\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="./terms-conditions-page.html" class="footer-link-v2">\n                  Terms & Conditions\n                </a>\n              </li>\n              <li>\n                <a href="./privacy-page.html" class="footer-link-v2"> Privacy Policy </a>\n              </li>\n              <li>\n                <a href="./refund-policy-page.html" class="footer-link-v2"> Refund Policy </a>\n              </li>\n              <li>\n                <a href="./gdpr-page.html" class="footer-link-v2"> GDPR Compliance </a>\n              </li>\n              <li>\n                <a href="./affiliate-policy-page.html" class="footer-link-v2"> Affiliate Policy </a>',
        '              Legal\n            </p>\n            <ul class="space-y-5">\n              <li>\n                <a href="#" class="footer-link-v2"> Termos de uso </a>\n              </li>\n              <li>\n                <a href="#" class="footer-link-v2"> Política de privacidade </a>\n              </li>\n              <li>\n                <a href="#" class="footer-link-v2"> Política de reembolso </a>',
    ),
    (
        "        Copyright &copy;NextSaaS – smart application for modern business",
        "        Copyright &copy; 2026 insta-bio · Link da bio para Instagram",
    ),
]


def patch_cta_hrefs(html: str) -> str:
    """Aponta CTAs principais para WhatsApp."""
    patterns = [
        (r'href="\./contact-us-page\.html"', f'href="{WA}" target="_blank" rel="noopener noreferrer"'),
        (r'href="\./signup-page-01\.html"', f'href="{WA_DEMO}" target="_blank" rel="noopener noreferrer"'),
        (r'href="\./pricing-page-01\.html"', f'href="{WA_PROPOSTA}" target="_blank" rel="noopener noreferrer"'),
        (r'href="\./analytics-page\.html"', f'href="{WA_PROPOSTA}" target="_blank" rel="noopener noreferrer"'),
        (r'href="\./process-page-01\.html"', 'href="#demonstracao"'),
        (r'href="\./testimonial-page-01\.html"', f'href="{WA}" target="_blank" rel="noopener noreferrer"'),
    ]
    for pattern, repl in patterns:
        html = re.sub(pattern, repl, html)
    return html


def patch_download_buttons(html: str) -> str:
    """Substitui botões de app store na seção de demonstração."""
    # Primeiro botão (era Apple Store) -> link interno demo
    html = html.replace(
        """            <div class="space-y-3 w-full">
              <a
                href="#"
                class="lg:py-4 py-2.5 lg:px-8 px-4 lg:rounded-2xl rounded-lg bg-black hover:bg-secondary transition-all duration-300 dark:bg-background-9 flex items-center justify-center gap-2"
              >
                <figure>
                  <img
                    class="w-full h-full object-contain"
                    src="images/icons/apple-dark.svg"
                    alt="Apple logo"
                  />
                </figure>
                <span class="text-background-3 font-normal lg:text-heading-5 text-tagline-1 mt-1">
                  Ver bio demo
                </span>
              </a>""",
        f"""            <div class="space-y-3 w-full">
              <a
                href="#demonstracao"
                class="lg:py-4 py-2.5 lg:px-8 px-4 lg:rounded-2xl rounded-lg bg-black hover:bg-secondary transition-all duration-300 dark:bg-background-9 flex items-center justify-center gap-2"
              >
                <figure>
                  <img
                    class="w-full h-full object-contain"
                    src="images/icons/checkmark-white.svg"
                    alt=""
                  />
                </figure>
                <span class="text-background-3 font-normal lg:text-heading-5 text-tagline-1 mt-1">
                  Ver bio demo
                </span>
              </a>""",
        1,
    )
    # Segundo botão -> WhatsApp
    html = html.replace(
        """              <a
                href="#"
                class="lg:py-4 py-2.5 lg:px-8 px-4 lg:rounded-2xl rounded-lg bg-black hover:bg-secondary transition-all duration-300 dark:bg-background-9 flex items-center justify-center gap-2"
              >
                <figure class="">
                  <img
                    class="w-full h-full object-contain"
                    src="images/icons/google-playstore.svg"
                    alt="Google Play logo"
                  />
                </figure>
                <span class="text-background-3 font-normal lg:text-heading-5 text-tagline-1">
                  Falar no WhatsApp
                </span>
              </a>""",
        f"""              <a
                href="{WA}"
                target="_blank"
                rel="noopener noreferrer"
                class="lg:py-4 py-2.5 lg:px-8 px-4 lg:rounded-2xl rounded-lg bg-black hover:bg-secondary transition-all duration-300 dark:bg-background-9 flex items-center justify-center gap-2"
              >
                <figure class="">
                  <img
                    class="w-full h-full object-contain"
                    src="images/icons/phone-white.svg"
                    alt=""
                  />
                </figure>
                <span class="text-background-3 font-normal lg:text-heading-5 text-tagline-1">
                  Falar no WhatsApp
                </span>
              </a>""",
        1,
    )
    return html


def main() -> None:
    html = TEMPLATE.read_text(encoding="utf-8")

    # Substitui header inteiro (mega menu -> nav simples)
    html = re.sub(r"<header>[\s\S]*?</header>", HEADER, html, count=1)

    for old, new in REPLACEMENTS:
        if old not in html:
            print(f"AVISO: trecho não encontrado ({old[:60]}...)")
        html = html.replace(old, new)

    html = patch_cta_hrefs(html)
    html = patch_download_buttons(html)

    # Limpa placeholders do motor de template
    html = re.sub(r"\{=\$[^}]*\}", "", html)

    TEMPLATE.write_text(html, encoding="utf-8")
    print(f"Atualizado: {TEMPLATE}")


if __name__ == "__main__":
    main()
