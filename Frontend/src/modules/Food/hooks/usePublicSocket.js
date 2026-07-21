import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || (() => {
    const base = import.meta.env?.VITE_API_BASE_URL || '';
    if (base) {
        return base.replace(/\/api(\/v\d+)?$/i, '');
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
})();

// ─── Singleton Socket State (module-level) ───────────────────────────────────
// One shared socket connection for all components. Connects on first consumer,
// disconnects when last consumer unmounts.
let _socket = null;
let _refCount = 0;

function getSocket() {
    if (!_socket) {
        _socket = io(`${SOCKET_URL}/public`, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });
        _socket.on('connect', () => {
            console.log('[PublicSocket] Connected (singleton):', _socket.id);
        });
        _socket.on('disconnect', (reason) => {
            console.log('[PublicSocket] Disconnected:', reason);
        });
        _socket.on('connect_error', (err) => {
            console.warn('[PublicSocket] Connection error:', err.message);
        });
    }
    return _socket;
}

function releaseSocket() {
    _refCount--;
    if (_refCount <= 0 && _socket) {
        _socket.disconnect();
        _socket = null;
        _refCount = 0;
        console.log('[PublicSocket] Singleton disconnected (no more consumers)');
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook that connects to the /public socket namespace (no auth required)
 * and listens for real-time admin updates.
 *
 * Uses a module-level singleton connection — only one socket is created
 * regardless of how many components call this hook simultaneously.
 *
 * @param {Object} listeners - Map of event names to callback functions
 * Example:
 *   usePublicSocket({
 *     'grocery:category:update': () => refetchCategories(),
 *     'grocery:product:update': () => refetchProducts(),
 *     'banner:update': (data) => { if (data.section === 'grocery') refetchBanners(); }
 *   });
 */
export function usePublicSocket(listeners = {}) {
    const listenersRef = useRef(listeners);

    // Keep listeners ref up to date without re-registering
    useEffect(() => {
        listenersRef.current = listeners;
    });

    useEffect(() => {
        const socket = getSocket();
        _refCount++;

        // Wrap each listener so it always uses the latest version from ref
        const eventNames = Object.keys(listeners);
        const handlers = {};
        eventNames.forEach((eventName) => {
            handlers[eventName] = (data) => {
                if (listenersRef.current[eventName]) {
                    listenersRef.current[eventName](data);
                }
            };
            socket.on(eventName, handlers[eventName]);
        });

        return () => {
            // Remove only this component's listeners
            eventNames.forEach((eventName) => {
                socket.off(eventName, handlers[eventName]);
            });
            releaseSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount/unmount
}
