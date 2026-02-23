const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.webwerk.ai';
const DIR = __dirname;

// Dateien/Ordner die KEINE eigenständigen Seiten sind
const EXCLUDE_FILES = [
    'header.html',
    'footer.html',
    'generate-og-image.html',
    '404.html',
    '_vorlage.html'
];

// Ordner komplett ignorieren
const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    'fotos'
];

// Prioritäten und Update-Häufigkeit pro Seite (Pfad relativ zum Root)
const CONFIG = {
    'index.html':                  { priority: '1.0', changefreq: 'weekly' },
    'webdesign.html':              { priority: '0.8', changefreq: 'monthly' },
    'entwicklung.html':            { priority: '0.8', changefreq: 'monthly' },
    'ki-integration.html':         { priority: '0.8', changefreq: 'monthly' },
    'automatisierung.html':        { priority: '0.8', changefreq: 'monthly' },
    'templates.html':              { priority: '0.8', changefreq: 'weekly' },
    'portfolio.html':              { priority: '0.8', changefreq: 'monthly' },
    'demo.html':                   { priority: '0.7', changefreq: 'monthly' },
    'blog.html':                   { priority: '0.8', changefreq: 'weekly' },
    'ueber-webwerk.html':          { priority: '0.7', changefreq: 'monthly' },
    'sicherheit-datenschutz.html': { priority: '0.7', changefreq: 'monthly' },
    'datenschutz.html':            { priority: '0.5', changefreq: 'yearly' },
    'impressum.html':              { priority: '0.5', changefreq: 'yearly' },
    'seitenubersicht.html':        { priority: '0.3', changefreq: 'monthly' },
};

// Standard-Werte für Unterseiten
const SUBDIR_DEFAULTS = {
    'blog':      { priority: '0.6', changefreq: 'monthly' },
    'portfolio': { priority: '0.5', changefreq: 'monthly' },
};

const ROOT_DEFAULTS = { priority: '0.6', changefreq: 'monthly' };

// ============================================================
// HTML-Seitenübersicht: Kategorien und Seitenzuordnung
// ============================================================

// Feste Seiten pro Kategorie (Reihenfolge = Anzeigereihenfolge)
const SITEMAP_CATEGORIES = [
    {
        title: 'Hauptseiten',
        pages: [
            { href: 'index.html', label: 'Startseite' },
            { href: 'ueber-webwerk.html', label: 'Über Webwerk.ai' },
            { href: 'blog.html', label: 'Blog' },
            { href: 'index.html#kontakt', label: 'Kontakt' },
        ]
    },
    {
        title: 'Leistungen',
        pages: [
            { href: 'webdesign.html', label: 'Webdesign' },
            { href: 'entwicklung.html', label: 'Website-Entwicklung' },
            { href: 'templates.html', label: 'Website-Templates' },
            { href: 'automatisierung.html', label: 'Digitale Automatisierung' },
            { href: 'ki-integration.html', label: 'KI-Integration' },
        ]
    },
    {
        title: 'Portfolio &amp; Demos',
        pages: [
            { href: 'portfolio.html', label: 'Portfolio' },
            { href: 'demo.html', label: 'Kostenlose Website-Demo' },
        ]
    },
    {
        title: 'Blog-Artikel',
        // Wird automatisch aus /blog/ Ordner befüllt
        autoDir: 'blog'
    },
    {
        title: 'Sicherheit &amp; Rechtliches',
        pages: [
            { href: 'sicherheit-datenschutz.html', label: 'Sicherheit &amp; Datenschutz' },
            { href: 'datenschutz.html', label: 'Datenschutzerkl&auml;rung' },
            { href: 'impressum.html', label: 'Impressum' },
        ]
    },
];

// Seitentitel aus HTML-Datei lesen (liest <title> oder <h1>)
function getPageTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Versuche <h1> zu finden
        const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/s);
        if (h1Match) {
            return h1Match[1].replace(/<[^>]+>/g, '').trim();
        }
        // Fallback: <title>
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
            return titleMatch[1].replace(/ - Webwerk AI$/, '').trim();
        }
    } catch (e) { /* ignore */ }
    // Fallback: Dateiname formatieren
    return path.basename(filePath, '.html')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================
// Rekursiv alle HTML-Dateien finden
// ============================================================

function findHtmlFiles(dir, baseDir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(entry.name)) {
                results = results.concat(findHtmlFiles(fullPath, baseDir));
            }
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            if (!EXCLUDE_FILES.includes(entry.name)) {
                results.push(relativePath);
            }
        }
    }

    return results;
}

// ============================================================
// 1. sitemap.xml generieren
// ============================================================

function generateSitemapXml(files) {
    const today = new Date().toISOString().split('T')[0];

    const urls = files.map(file => {
        let config = CONFIG[file];
        if (!config) {
            const subdir = file.split('/')[0];
            config = SUBDIR_DEFAULTS[subdir] || ROOT_DEFAULTS;
        }

        const loc = file === 'index.html'
            ? `${DOMAIN}/`
            : `${DOMAIN}/${file}`;

        return {
            loc,
            priority: config.priority,
            changefreq: config.changefreq,
            isIndex: file === 'index.html',
        };
    });

    urls.sort((a, b) => {
        if (a.isIndex) return -1;
        if (b.isIndex) return 1;
        const priDiff = parseFloat(b.priority) - parseFloat(a.priority);
        if (priDiff !== 0) return priDiff;
        return a.loc.localeCompare(b.loc);
    });

    const urlEntries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;

    fs.writeFileSync(path.join(DIR, 'sitemap.xml'), xml, 'utf8');

    console.log('');
    console.log('=== sitemap.xml ===');
    console.log(`${files.length} Seiten:`);
    urls.forEach(u => console.log(`  ${u.priority}  ${u.loc}`));
}

// ============================================================
// 2. seitenubersicht.html generieren
// ============================================================

function generateSeitenubersicht(files) {
    // Automatische Seiten aus Unterordnern sammeln
    const autoDirFiles = {};
    files.forEach(file => {
        const parts = file.split('/');
        if (parts.length > 1) {
            const dir = parts[0];
            if (!autoDirFiles[dir]) autoDirFiles[dir] = [];
            autoDirFiles[dir].push(file);
        }
    });

    // Kategorien-HTML aufbauen
    let categoriesHtml = '';
    for (const category of SITEMAP_CATEGORIES) {
        let pages = [];

        if (category.pages) {
            pages = category.pages;
        }

        // Automatisch aus Ordner befüllen
        if (category.autoDir && autoDirFiles[category.autoDir]) {
            const autoPages = autoDirFiles[category.autoDir].map(file => ({
                href: file,
                label: getPageTitle(path.join(DIR, file))
            }));
            pages = pages.concat(autoPages);
        }

        // Kategorie nur anzeigen wenn Seiten vorhanden
        if (pages.length === 0) continue;

        categoriesHtml += `\n            <h2>${category.title}</h2>\n`;
        categoriesHtml += '            <ul>\n';
        pages.forEach(page => {
            categoriesHtml += `                <li><a href="${page.href}">${page.label}</a></li>\n`;
        });
        categoriesHtml += '            </ul>\n';
    }

    const html = `<!DOCTYPE html>
<html lang="de">

<head>
    <script src="cookie-consent.js"></script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-SHEX6Y4Q4F"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-SHEX6Y4Q4F');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sitemap von Webwerk.ai – Alle Seiten auf einen Blick. Finde schnell die passende Leistung oder Information.">
    <meta property="og:title" content="Sitemap - Webwerk AI">
    <meta property="og:description" content="Sitemap von Webwerk.ai – Alle Seiten auf einen Blick. Finde schnell die passende Leistung oder Information.">
    <meta property="og:image" content="https://www.webwerk.ai/og-image.png">
    <meta property="og:url" content="https://www.webwerk.ai/seitenubersicht.html">
    <meta property="og:type" content="website">
    <title>Sitemap - Webwerk AI</title>
    <link rel='stylesheet'
        href='https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css'>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="styles.css?v=5">
</head>

<body>
    <div id="header-placeholder"></div>

    <section class="legal-hero">
        <div class="legal-hero-content">
            <h1>Sitemap</h1>
            <p>Alle Seiten auf einen Blick</p>
        </div>
    </section>

    <section class="legal-content">
        <div class="legal-container">
${categoriesHtml}
        </div>
    </section>

    <div id="footer-placeholder"></div>

    <script>
        function loadComponent(url, elementId) {
            fetch(url + '?t=' + new Date().getTime())
                .then(response => response.text())
                .then(data => {
                    const container = document.getElementById(elementId);
                    container.innerHTML = data;

                    const scripts = container.querySelectorAll('script');
                    scripts.forEach(function (script) {
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.body.appendChild(newScript);
                        script.remove();
                    });

                    if (elementId === 'footer-placeholder') {
                        const yearElement = document.getElementById("current-year");
                        if (yearElement) {
                            yearElement.textContent = new Date().getFullYear();
                        }
                    }
                })
                .catch(error => console.error('Fehler beim Laden:', error));
        }

        document.addEventListener('DOMContentLoaded', function () {
            loadComponent('header.html', 'header-placeholder');
            loadComponent('footer.html', 'footer-placeholder');
        });
    </script>
</body>

</html>
`;

    fs.writeFileSync(path.join(DIR, 'seitenubersicht.html'), html, 'utf8');

    console.log('');
    console.log('=== seitenubersicht.html ===');
    SITEMAP_CATEGORIES.forEach(cat => {
        const count = cat.pages ? cat.pages.length : 0;
        const autoCount = (cat.autoDir && autoDirFiles[cat.autoDir]) ? autoDirFiles[cat.autoDir].length : 0;
        if (count + autoCount > 0) {
            console.log(`  ${cat.title.replace(/&amp;/g, '&').replace(/&auml;/g, 'ä')}: ${count + autoCount} Seiten`);
        }
    });
}

// ============================================================
// Hauptfunktion
// ============================================================

function generate() {
    const files = findHtmlFiles(DIR, DIR);
    const today = new Date().toISOString().split('T')[0];

    generateSitemapXml(files);
    generateSeitenubersicht(files);

    console.log('');
    console.log(`Fertig! Beide Dateien aktualisiert (${today})`);
    console.log('');
}

generate();
