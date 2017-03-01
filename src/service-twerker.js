(function (global) {
    'use strict';

    importScripts('sw-toolbox.js');

    global.toolbox.options.debug = true;

    // precache offline fallback
    toolbox.precache(['/offline/']);

    // HTML route
    global.toolbox.router.get(/^.*\/$/, htmlHandler, {
        cache: {
            name: 'html-cache',
            maxEntries: 3,
            maxAgeSeconds: 7 * 24 * 60 * 60,
            onStaleContent: onStaleContentHandler
        }
    });

    // default caching strategy
    global.toolbox.router.default = global.toolbox.cacheFirst;

    function htmlHandler(request, values, options) {
        return staleWhileRevalidate(request, values, options)
            .catch(() => caches.match('/offline/'));
    }

    function onStaleContentHandler(freshResponse) {
        console.log('stale content, sending message!', freshResponse.url);
        return broadcastToClients({
            type: 'outdated',
            url: 'http://localhost:3004/getting-started/'
        });
    }

    function staleWhileRevalidate(request, values, options) {
        console.log('Strategy: stale while revalidate [' + request.url + ']', options);

        return toolbox.cacheOnly(request, values, options)
            .then((cacheContent) => {
                const fetchFromNetwork = toolbox.networkFirst(request, values, options);
                fetchFromNetwork.then(networkContent => {
                    isStale(cacheContent, networkContent)
                        .then( isStale => {
                            if (isStale) {
                                return options.cache.onStaleContent(networkContent.url)
                            }
                        })
                });

                return cacheContent ? cacheContent.clone() : fetchFromNetwork;
            });

    }

    function isStale(cachedResponse, networkResponse) {
        if(!cachedResponse || !networkResponse) {
            return Promise.resolve(false);
        }

        return Promise.all([cachedResponse.text(), networkResponse.text()])
            .then(([cachedContent, serverContent]) => {
                const isStale = (cachedContent !== serverContent);
                return Promise.resolve(isStale);
            });
    }

    /**
     * Sends a message to all clients who have the service worker installed
     *
     * @param {Object} message		The message to send
     * @returns {Promise}
     */
    function broadcastToClients(message) {
        return new Promise((resolve, reject) => {
            self.clients.matchAll().then(clientList => {
                console.log('sending messag to: ', clientList);
                clientList.forEach((client) => client.postMessage(message));
                resolve();
            }).catch(err => reject(err));
        });
    }

    global.addEventListener('install', function (event) {
        return event.waitUntil(global.skipWaiting());
    });

    global.addEventListener('activate', function (event) {
        return event.waitUntil(global.clients.claim());
    });

})(self);
