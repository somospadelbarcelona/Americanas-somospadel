window = {
    location: {
        origin: 'https://somospadelbarcelona.com',
        pathname: '/Americanas-somospadel/',
        href: 'https://somospadelbarcelona.com/Americanas-somospadel/'
    },
    open: (url, target) => {
        console.log('WINDOW OPEN:', url, target);
    }
};
document = {
    querySelector: () => null,
    body: { appendChild: () => {} }
};

// Simulamos navigator.canShare y navigator.share
let shareCallData = null;
let clipboardData = null;

Object.defineProperty(globalThis, 'navigator', {
    value: {
        canShare: (data) => {
            return !!(data && data.files && data.files.length > 0);
        },
        share: async (data) => {
            shareCallData = data;
            return true;
        },
        clipboard: {
            write: async (items) => {
                clipboardData = items;
                return true;
            }
        }
    },
    writable: true,
    configurable: true
});

global.fetch = async (url) => {
    return {
        ok: true,
        blob: async () => ({
            type: 'image/jpeg',
            size: 1024
        })
    };
};

global.File = class MockFile {
    constructor(parts, name, opts) {
        this.parts = parts;
        this.name = name;
        this.type = opts.type;
    }
};

global.ClipboardItem = class MockClipboardItem {
    constructor(obj) {
        this.obj = obj;
    }
};

// Importamos DashboardView
const fs = require('fs');
const code = fs.readFileSync('./js/modules/dashboard/DashboardView_hotfix.js', 'utf8');

// Creamos un dummy DashboardView
const dashboardViewMatch = code.match(/class DashboardView\s*\{([\s\S]*?)\n    \}/);
if (!dashboardViewMatch) {
    console.log("Searching for shareToWhatsApp directly...");
}

// Probamos la lógica de shareToWhatsApp directamente
eval(`
const DashboardViewObj = {
    currentImagesMap: {
        'modos-juego-twister-individual-guia': 'img/blog_padel_twister_team.jpg'
    },
    showJournalToast: (msg, icon) => console.log('TOAST:', msg, icon),
` + code.slice(code.indexOf('async shareToWhatsApp('), code.indexOf('getSavedBlogPosts()')) + `
};
window.DashboardView = DashboardViewObj;
`);

(async () => {
    console.log("Probando shareToWhatsApp con artículo de Twister...");
    await window.DashboardView.shareToWhatsApp('modos-juego-twister-individual-guia', 'Guía Táctica Twister');

    if (!shareCallData) {
        console.error("FAIL: navigator.share no fue llamado!");
        process.exit(1);
    }

    console.log("shareCallData title:", shareCallData.title);
    console.log("shareCallData text:", shareCallData.text);
    console.log("shareCallData files length:", shareCallData.files?.length);
    console.log("shareCallData file name:", shareCallData.files?.[0]?.name);
    console.log("shareCallData file type:", shareCallData.files?.[0]?.type);

    if (!shareCallData.files || shareCallData.files.length === 0) {
        console.error("FAIL: No se adjuntó el archivo de imagen!");
        process.exit(1);
    }

    if (!shareCallData.files[0].name.includes('twister') && !shareCallData.files[0].name.includes('modos-juego')) {
        console.error("FAIL: El nombre del archivo de imagen no coincide!");
        process.exit(1);
    }

    console.log("SUCCESS: Web Share con archivo de imagen 100% verificado!");
})();
