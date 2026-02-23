// =============================================
// Cookie Consent – DSGVO-konform
// =============================================
// Blockiert Google Analytics bis zur Einwilligung.
// Muss VOR dem GA-Script im <head> geladen werden.

(function() {
    var GA_ID = 'G-SHEX6Y4Q4F';
    var CONSENT_KEY = 'cookie_consent';
    var CONSENT_CATEGORIES_KEY = 'cookie_consent_categories';

    var consent = localStorage.getItem(CONSENT_KEY);

    // GA standardmäßig blockieren
    if (consent !== 'accepted' && consent !== 'custom') {
        window['ga-disable-' + GA_ID] = true;
    }

    // Bei individueller Auswahl prüfen ob Statistik erlaubt ist
    if (consent === 'custom') {
        var categories = JSON.parse(localStorage.getItem(CONSENT_CATEGORIES_KEY) || '{}');
        if (!categories.statistics) {
            window['ga-disable-' + GA_ID] = true;
        }
    }

    // Banner beim ersten Besuch automatisch anzeigen
    document.addEventListener('DOMContentLoaded', function() {
        if (!consent) {
            showBanner();
        }
    });

    // Globale Funktion für den Footer-Link
    window.reopenCookieConsent = function() {
        // Kategorien VOR dem Löschen auslesen
        var saved = JSON.parse(localStorage.getItem(CONSENT_CATEGORIES_KEY) || '{}');

        localStorage.removeItem(CONSENT_KEY);
        localStorage.removeItem(CONSENT_CATEGORIES_KEY);

        // Falls bereits ein Banner offen ist, entfernen
        var existing = document.getElementById('cookieConsent');
        if (existing) existing.remove();

        showBanner(saved);
    };

    function showBanner(savedCategories) {
        savedCategories = savedCategories || {};

        var banner = document.createElement('div');
        banner.id = 'cookieConsent';
        banner.className = 'cookie-banner';
        banner.innerHTML =
            '<div class="cookie-banner-content">' +
                '<div class="cookie-banner-text">' +
                    '<strong>Cookie-Einstellungen</strong>' +
                    '<p>Wir verwenden Cookies, um unsere Website zu analysieren und zu verbessern. ' +
                    'Du kannst w\u00e4hlen, welche Kategorien Du zulassen m\u00f6chtest. ' +
                    'Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerkl\u00e4rung</a>.</p>' +
                '</div>' +
                '<div class="cookie-banner-actions">' +
                    '<button class="cookie-btn" id="cookieDecline">Ablehnen</button>' +
                    '<button class="cookie-btn" id="cookieSettings">Individuelle Auswahl</button>' +
                    '<button class="cookie-btn" id="cookieAccept">Alle akzeptieren</button>' +
                '</div>' +
            '</div>' +
            '<div class="cookie-details" id="cookieDetails">' +
                '<div class="cookie-details-content">' +
                    '<label class="cookie-category">' +
                        '<input type="checkbox" checked disabled>' +
                        '<span class="cookie-category-info">' +
                            '<strong>Notwendig</strong>' +
                            '<span>Technisch erforderliche Cookies, die f\u00fcr den Betrieb der Website unverzichtbar sind.</span>' +
                        '</span>' +
                    '</label>' +
                    '<label class="cookie-category">' +
                        '<input type="checkbox" id="catStatistics"' + (savedCategories.statistics ? ' checked' : '') + '>' +
                        '<span class="cookie-category-info">' +
                            '<strong>Statistik</strong>' +
                            '<span>Helfen uns zu verstehen, wie Besucher die Website nutzen (Google Analytics).</span>' +
                        '</span>' +
                    '</label>' +
                    '<label class="cookie-category">' +
                        '<input type="checkbox" id="catMarketing"' + (savedCategories.marketing ? ' checked' : '') + '>' +
                        '<span class="cookie-category-info">' +
                            '<strong>Marketing</strong>' +
                            '<span>Werden genutzt, um Werbung relevanter f\u00fcr Dich zu gestalten.</span>' +
                        '</span>' +
                    '</label>' +
                    '<label class="cookie-category">' +
                        '<input type="checkbox" id="catMedia"' + (savedCategories.media ? ' checked' : '') + '>' +
                        '<span class="cookie-category-info">' +
                            '<strong>Externe Medien</strong>' +
                            '<span>Erm\u00f6glicht die Einbindung externer Inhalte wie Videos oder Karten.</span>' +
                        '</span>' +
                    '</label>' +
                    '<div class="cookie-details-actions">' +
                        '<button class="cookie-btn" id="cookieSaveCustom">Auswahl speichern</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(banner);

        requestAnimationFrame(function() {
            banner.classList.add('is-visible');
        });

        // Alle akzeptieren
        document.getElementById('cookieAccept').addEventListener('click', function() {
            localStorage.setItem(CONSENT_KEY, 'accepted');
            localStorage.setItem(CONSENT_CATEGORIES_KEY, JSON.stringify({
                statistics: true, marketing: true, media: true
            }));
            enableGA();
            closeBanner(banner);
        });

        // Ablehnen
        document.getElementById('cookieDecline').addEventListener('click', function() {
            localStorage.setItem(CONSENT_KEY, 'declined');
            localStorage.setItem(CONSENT_CATEGORIES_KEY, JSON.stringify({
                statistics: false, marketing: false, media: false
            }));
            window['ga-disable-' + GA_ID] = true;
            deleteGACookies();
            closeBanner(banner);
        });

        // Individuelle Auswahl togglen
        document.getElementById('cookieSettings').addEventListener('click', function() {
            var details = document.getElementById('cookieDetails');
            details.classList.toggle('is-open');
        });

        // Auswahl speichern
        document.getElementById('cookieSaveCustom').addEventListener('click', function() {
            var cats = {
                statistics: document.getElementById('catStatistics').checked,
                marketing: document.getElementById('catMarketing').checked,
                media: document.getElementById('catMedia').checked
            };
            localStorage.setItem(CONSENT_KEY, 'custom');
            localStorage.setItem(CONSENT_CATEGORIES_KEY, JSON.stringify(cats));

            if (cats.statistics) {
                enableGA();
            } else {
                window['ga-disable-' + GA_ID] = true;
                deleteGACookies();
            }

            closeBanner(banner);
        });
    }

    function enableGA() {
        window['ga-disable-' + GA_ID] = false;
        if (typeof gtag === 'function') {
            gtag('config', GA_ID);
        }
    }

    function closeBanner(banner) {
        banner.classList.remove('is-visible');
        setTimeout(function() {
            banner.remove();
        }, 400);
    }

    function deleteGACookies() {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var name = cookies[i].split('=')[0].trim();
            if (name.indexOf('_ga') === 0 || name.indexOf('_gid') === 0) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname;
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
        }
    }
})();
