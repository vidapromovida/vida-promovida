/**
 * Vida Promovida - SPA Core
 * Lógica de navegação, carregamento e gerenciamento de estado
 */

// Configuração inicial
const config = {
  basePath: '',
  contentSelector: '#main',
  loadingDelay: 300,
  transitionDuration: 300
};

// Elementos globais
const nprogress = NProgress.configure({ 
  minimum: 0.3,
  trickleSpeed: 200,
  showSpinner: false 
});

// Inicializa eventos
document.addEventListener('DOMContentLoaded', () => {
  initSPA();
  setupEventListeners();
  loadInitialPage();
});

// ==================== CORE FUNCTIONS ====================

/**
 * Inicializa o SPA e configura o History API
 */
function initSPA() {
  // Garante que o estado inicial existe
  if (!window.history.state) {
    window.history.replaceState({ 
      page: window.location.pathname || '/inicio',
      scrollPos: 0 
    }, '', window.location.pathname);
  }

  // Configura o container de conteúdo
  if (!document.querySelector(config.contentSelector)) {
    const contentDiv = document.createElement('main');
    contentDiv.id = config.contentSelector.replace('#', '');
    document.body.appendChild(contentDiv);
  }
}

/**
 * Configura listeners de eventos globais
 */
function setupEventListeners() {
  // Intercepta clicks em links SPA
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/"]');
    if (link && !link.target && !link.href.startsWith('mailto:')) {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    }
  });

  // Gerencia navegação pelo histórico
  window.addEventListener('popstate', handlePopState);

  // Fecha dropdowns ao navegar (mobile)
  document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link')) {
      const navbar = document.querySelector('.navbar-collapse');
      if (navbar.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navbar).hide();
      }
    }
  });
}

/**
 * Carrega a página inicial baseada na URL atual
 */
function loadInitialPage() {
  const initialPage = window.location.pathname === '/' ? '/inicio' : window.location.pathname;
  navigate(initialPage, false);
}

// ==================== NAVIGATION ====================

/**
 * Navega entre páginas (SPA)
 * @param {string} path - Caminho da página
 * @param {boolean} updateHistory - Se deve atualizar o histórico
 */
async function navigate(path, updateHistory = true) {
  // Ignora links âncora na mesma página
  if (path.startsWith('#')) return;

  // Barra de progresso
  NProgress.start();
  document.body.classList.add('page-transition');

  try {
    // Carrega o conteúdo
    const pagePath = path.endsWith('.html') ? path : `${path}.html`;
      if (path !== "/inicio"){
      const response = await fetch(`/pages${pagePath}`);
      }
      else{
    const response = await fetch(`${config.basePath}${pagePath}`);
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const content = await response.text();
    const title = extractPageTitle(content) || 'Vida Promovida';

    // Insere o conteúdo
    document.querySelector(config.contentSelector).innerHTML = content;
    document.title = title;

    // Atualiza o histórico
    if (updateHistory) {
      window.history.pushState({ 
        page: path,
        scrollPos: 0 
      }, title, path);
    }

    // Rola para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Atualiza navbar ativo
    updateActiveNavLink(path);

    // Inicializa componentes da nova página
    initPageComponents();

  } catch (error) {
    console.error('Navigation error:', error);
    handleNavigationError(path);
  } finally {
    setTimeout(() => {
      NProgress.done();
      document.body.classList.remove('page-transition');
    }, config.loadingDelay);
  }
}

/**
 * Manipula navegação pelo histórico (back/forward)
 */
function handlePopState(event) {
  if (event.state) {
    NProgress.start();
    document.body.classList.add('page-transition');
    
    fetch(`${config.basePath}${event.state.page}.html`)
      .then(response => response.text())
      .then(content => {
        document.querySelector(config.contentSelector).innerHTML = content;
        updateActiveNavLink(event.state.page);
        initPageComponents();
        
        if (event.state.scrollPos) {
          setTimeout(() => window.scrollTo(0, event.state.scrollPos), 50);
        }
      })
      .finally(() => {
        setTimeout(() => {
          NProgress.done();
          document.body.classList.remove('page-transition');
        }, config.loadingDelay);
      });
  }
}

// ==================== UTILITIES ====================

/**
 * Extrai o título da página do conteúdo HTML
 */
function extractPageTitle(content) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  return tempDiv.querySelector('h1')?.textContent || 
         tempDiv.querySelector('title')?.textContent;
}

/**
 * Atualiza o link ativo na navbar
 */
function updateActiveNavLink(currentPath) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPath = link.getAttribute('href');
    link.classList.toggle('active', 
      linkPath === currentPath || 
      (currentPath.startsWith(linkPath) && linkPath !== '/'));
  });
}

/**
 * Inicializa componentes JS da nova página
 */
function initPageComponents() {
  // Inicializa tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

  // Inicializa AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({ once: true });
  }

  // Inicializa Swipers
  if (typeof Swiper !== 'undefined') {
    initSwipers();
  }
}

/**
 * Inicializa carrosseis Swiper
 */
function initSwipers() {
  // Serviços
  if (document.querySelector('.services-swiper')) {
    new Swiper('.services-swiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        576: { slidesPerView: 2 },
        992: { slidesPerView: 3 }
      }
    });
  }
}

/**
 * Manipula erros de navegação
 */
function handleNavigationError(path) {
  // Página não encontrada
    navigate('/404', false);
}

// ==================== GLOBAL EXPORTS ====================
// (Para debug)
window.SPA = {
  navigate,
  reload: () => navigate(window.location.pathname, false),
  getCurrentPage: () => window.history.state?.page
};
