(function (global) {
    'use strict';

    // Load the sw-tookbox library.
    importScripts('sw-toolbox.js');

    // Turn on debug logging, visible in the Developer Tools' console.
    global.toolbox.options.debug = true;

    // precache offline fallback page
    toolbox.precache(['/offline/']);

    global.toolbox.router.get('/assets/images/*.*', imageHandler, {
        cache: {
            name: 'image-cache',
            networkTimeoutSeconds: 3,
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60
        }
    });

    global.toolbox.router.get(/^.*\/$/, htmlHandler, {
        cache: {
            name: 'html-cache',
            maxEntries: 25,
            maxAgeSeconds: 7 * 24 * 60 * 60
        }
    });

    // By default, all requests that don't match our custom handler will use the
    // toolbox.networkFirst cache strategy, and their responses will be stored in
    // the default cache.
    global.toolbox.router.default = global.toolbox.networkFirst;

    function imageHandler(request, values, options) {
        return toolbox.cacheFirst(request, values, options).catch(() => {
            return caches.match(request.url);
        });
    }

    function htmlHandler(request, values, options) {
        return toolbox.fastest(request, values, options).catch(() => {
            return caches.match('/offline/');
        });
    }

    // Boilerplate to ensure our service worker takes control of the page as soon
    // as possible.
    global.addEventListener('install', function (event) {
        return event.waitUntil(global.skipWaiting());
    });
    global.addEventListener('activate', function (event) {
        return event.waitUntil(global.clients.claim());
    });
})(self);
