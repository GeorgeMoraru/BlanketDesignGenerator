/**
 * Blanket Design Generator - Native Platform Bridge
 * Bridges HTML5 Web App with Capacitor 6 iOS/Android runtime capabilities.
 */

window.NativeBridge = (function() {
    'use strict';

    const isNative = () => {
        return typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    };

    const init = () => {
        console.log(`[NativeBridge] Initializing. Platform: ${isNative() ? window.Capacitor.getPlatform() : 'Web'}`);

        if (isNative()) {
            setupAndroidBackButton();
            setupStatusBar();
        }
    };

    const setupAndroidBackButton = () => {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('backButton', () => {
                const drawer = document.querySelector('.settings-container');
                const overlay = document.querySelector('#menu-overlay');

                if (drawer && drawer.classList.contains('open')) {
                    drawer.classList.remove('open');
                    if (overlay) overlay.classList.remove('active');
                } else if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.Capacitor.Plugins.App.exitApp();
                }
            });
        }
    };

    const setupStatusBar = () => {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
            window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' }).catch(() => {});
            window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#1c2541' }).catch(() => {});
        }
    };

    const triggerHaptic = (style = 'light') => {
        if (isNative() && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            try {
                window.Capacitor.Plugins.Haptics.impact({ style: style.toUpperCase() });
            } catch (err) {
                console.warn('[NativeBridge] Haptics error:', err);
            }
        } else if (navigator.vibrate) {
            try {
                navigator.vibrate(style === 'heavy' ? 40 : 15);
            } catch (e) {}
        }
    };

    const sharePattern = async (shareData) => {
        if (isNative() && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
            try {
                await window.Capacitor.Plugins.Share.share({
                    title: shareData.title || 'Blanket Design',
                    text: shareData.text || 'Check out my crochet blanket design!',
                    url: shareData.url || window.location.href,
                    dialogTitle: 'Share Blanket Pattern'
                });
                return true;
            } catch (err) {
                console.warn('[NativeBridge] Native share failed, falling back to Web API', err);
            }
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return true;
            } catch (e) {
                console.warn('[NativeBridge] Web share cancelled/failed', e);
            }
        }

        if (shareData.url) {
            try {
                await navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!');
                return true;
            } catch (e) {
                alert(`Share URL: ${shareData.url}`);
            }
        }
        return false;
    };

    // Auto initialize on script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        isNative,
        triggerHaptic,
        sharePattern
    };

})();
