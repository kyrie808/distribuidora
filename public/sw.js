const CACHE_NAME = 'massas-crm-v1';

// Instalação: Força o novo SW a assumir imediatamente
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Ativação: LIMPEZA TOTAL de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Deleta qualquer cache existente para evitar tela branca
                    console.log('SW: Limpando cache antigo', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    // Toma controle de todas as abas abertas imediatamente
    self.clients.claim();
});

// Fetch: NETWORK ONLY (Pass-through)
// Não interceptamos para cache, apenas deixamos a rede fluir.
// Isso resolve problemas de CORS e garante que o usuário sempre pegue a versão nova.
self.addEventListener('fetch', (event) => {
    // Nenhuma lógica de cache aqui. O navegador gerencia a rede.
    return;
});
