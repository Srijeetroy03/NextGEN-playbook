const ROUTES = {
    dashboard: {
        title: "Demand Planning Main Dashboard",
        html: "pages/dashboard.html",
        css: "assets/css/page-dashboard.css",
        js: "assets/js/page-dashboard.js",
        actions: `
            <button
                class="flex items-center justify-center rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-[#2d333d] text-[#111318] dark:text-white text-sm font-bold hover:bg-[#e2e4e7] transition-colors">
                <span class="material-symbols-outlined text-sm mr-2" data-icon="download">download</span>
                <span>Export</span>
            </button>
        `,
    },
    workflows: {
        title: "Agent Workflow Visualization - Demand Planning AI",
        html: "pages/workflows.html",
        css: "assets/css/page-workflows.css",
        js: "assets/js/page-workflows.js",
        actions: `
            <button
                class="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                <span class="material-symbols-outlined text-sm mr-2" data-icon="play_arrow">play_arrow</span>
                <span>Re-run Pipeline</span>
            </button>
            <button
                class="flex items-center justify-center rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-[#2d333d] text-[#111318] dark:text-white text-sm font-bold hover:bg-[#e2e4e7] transition-colors">
                <span class="material-symbols-outlined text-sm mr-2" data-icon="download">download</span>
                <span>Export Log</span>
            </button>
        `,
    },
    "new-run": {
        title: "Initiate Planning Run - Demand Planning AI",
        html: "pages/new_run.html",
        css: "assets/css/page-new-run.css",
        js: "assets/js/page-new-run.js",
        actions: `
            <button
                class="flex items-center justify-center rounded-lg size-10 bg-[#f0f2f4] dark:bg-[#2d333d] text-[#111318] dark:text-white hover:bg-[#e2e4e7] transition-colors">
                <span class="material-symbols-outlined text-xl">notifications</span>
            </button>
        `,
    },
    reports: {
        title: "Planning Run Detailed Insights | SupplyFlow AI",
        html: "pages/reports.html",
        css: "assets/css/page-reports.css",
        js: "assets/js/page-reports.js",
        actions: `
            <button
                class="flex items-center justify-center rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-[#2d333d] text-[#111318] dark:text-white text-sm font-bold hover:bg-[#e2e4e7] transition-colors">
                <span class="material-symbols-outlined text-sm mr-2" data-icon="download">download</span>
                <span>Export</span>
            </button>
        `,
    },
};

const ACTIVE_CLASSES = "text-primary text-sm font-bold border-b-2 border-primary pb-1 hover:text-primary";
const INACTIVE_CLASSES = "text-[#111318] dark:text-white text-sm font-medium hover:text-primary transition-colors";

function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) {
        return { route: "dashboard", query: new URLSearchParams() };
    }
    const [routePart, queryString] = hash.split("?");
    return {
        route: routePart || "dashboard",
        query: new URLSearchParams(queryString || ""),
    };
}

function setActiveNav(route) {
    const links = document.querySelectorAll("[data-route]");
    links.forEach((link) => {
        const isActive = link.dataset.route === route;
        link.className = isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES;
    });
}

function setActions(route) {
    const actions = document.getElementById("nav-actions");
    actions.innerHTML = ROUTES[route]?.actions || "";
}

function setPageCss(route) {
    const cssLink = document.getElementById("page-css");
    cssLink.href = ROUTES[route]?.css || "";
}

function loadPageScript(route, query) {
    const existing = document.getElementById("page-script");
    if (existing) {
        existing.remove();
    }

    const script = document.createElement("script");
    script.id = "page-script";
    script.src = ROUTES[route]?.js || "";
    script.onload = () => {
        if (typeof window.initPage === "function") {
            window.initPage(route, query);
        }
    };
    document.body.appendChild(script);
}

async function loadRoute() {
    const { route, query } = parseHash();
    const routeKey = ROUTES[route] ? route : "dashboard";

    document.title = ROUTES[routeKey].title;
    setActiveNav(routeKey);
    setActions(routeKey);
    setPageCss(routeKey);

    const container = document.getElementById("app");
    const response = await fetch(ROUTES[routeKey].html);
    container.innerHTML = await response.text();
    if (window.tailwind && typeof window.tailwind.refresh === "function") {
        window.tailwind.refresh();
    }

    loadPageScript(routeKey, query);
}

window.addEventListener("hashchange", loadRoute);
window.addEventListener("DOMContentLoaded", loadRoute);
