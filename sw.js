const CACHE_NAME = 'xunji-v2.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/manifest.json'
];

// 安装 Service Worker - 缓存资源
self.addEventListener('install', event => {
  console.log('[SW] 安装 Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存资源');
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.warn('[SW] 缓存资源失败:', url, error);
              });
          })
        );
      })
      .then(() => {
        console.log('[SW] 跳过等待，立即激活');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] 安装失败:', error);
      })
  );
});

// 激活 Service Worker - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] 激活 Service Worker');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 立即控制客户端');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('[SW] 激活失败:', error);
      })
  );
});

// 网络优先，失败时回退到缓存策略
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // 只缓存 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 对于 HTML 页面和 API 请求，使用网络优先策略
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 更新缓存
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时回退到缓存
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // 如果没有缓存，返回离线页面（如果有的话）
              return caches.match('/index.html');
            });
        })
    );
  } else {
    // 对于静态资源，使用缓存优先策略
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 有缓存时，后台更新缓存
            fetch(request)
              .then(response => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response.clone());
                  });
                }
              })
              .catch(() => {
                console.log('[SW] 后台更新失败');
              });
            return cachedResponse;
          }
          
          // 没有缓存，去网络获取
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
              return response;
            })
            .catch(error => {
              console.error('[SW] 网络请求失败:', error);
              throw error;
            });
        })
    );
  }
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker 已加载');

