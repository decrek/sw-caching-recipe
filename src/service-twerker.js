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
        console.log('stale content!', freshResponse);
    }

    function staleWhileRevalidate(request, values, options) {
        console.log('Strategy: stale while revalidate [' + request.url + ']', options);

        const getFromCache = toolbox.cacheOnly(request, values, options);
        const fetchFromNetwork = toolbox.networkOnly(request, values, options);

        // determine if content is stale
        Promise.all([getFromCache, fetchFromNetwork])
            .then(([cachedResponse, networkResponse]) => {
                return isStale(cachedResponse, networkResponse)
                    .then(isStale => isStale ? options.cache.onStaleContent(networkResponse) : console.log('fresh content!'));
            });

        // return response as fast as possible
        return Promise.race([getFromCache, fetchFromNetwork])
            .then((response) => response.clone());
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

    global.addEventListener('install', function (event) {
        return event.waitUntil(global.skipWaiting());
    });

    global.addEventListener('activate', function (event) {
        return event.waitUntil(global.clients.claim());
    });

})(self);
