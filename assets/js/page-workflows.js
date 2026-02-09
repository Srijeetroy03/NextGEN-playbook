window.toggleDrawer = function() {
    const drawer = document.getElementById('liveStreamDrawer');
    const toggleBtn = document.getElementById('drawerToggle');
    const toggleIcon = document.getElementById('toggleIcon');

    if (!drawer || !toggleBtn || !toggleIcon) {
        return;
    }

    drawer.classList.toggle('open');
    toggleBtn.classList.toggle('drawer-open');

    if (drawer.classList.contains('open')) {
        toggleIcon.textContent = 'chevron_right';
    } else {
        toggleIcon.textContent = 'chevron_left';
    }
};

window.startWorkflow = function() {
    const drawer = document.getElementById('liveStreamDrawer');
    const legacy = document.getElementById('workflow-legacy');
    const emptyState = document.getElementById('workflow-empty-state');

    if (!drawer) {
        return;
    }

    if (!drawer.classList.contains('open')) {
        window.toggleDrawer();
    }

    const workflowCards = document.querySelectorAll('.workflow-card');
    let delay = 0;

    workflowCards.forEach((card) => {
        setTimeout(() => {
            card.style.animation = 'pulse 2s ease-in-out';
            card.style.borderColor = '#135bec';
        }, delay);
        delay += 1000;
    });

    if (legacy) {
        legacy.classList.remove('hidden');
    }
    if (emptyState) {
        emptyState.classList.add('hidden');
    }

    showAgents();
};

async function showAgents() {
    const section = document.getElementById('agents-section');
    const list = document.getElementById('agents-list');

    if (!section || !list) {
        return;
    }

    try {
        const response = await fetch('../data/agents.json');
        const agents = await response.json();

        list.innerHTML = agents.map((agent) => {
            const statusLabel = agent.status === 'running'
                ? 'RUNNING'
                : agent.status === 'done'
                    ? 'DONE'
                    : 'PENDING';

            const statusClasses = agent.status === 'running'
                ? 'bg-primary text-white'
                : agent.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500';

            const iconClasses = agent.status === 'running'
                ? 'text-white'
                : agent.status === 'done'
                    ? 'text-green-600'
                    : 'text-gray-500';

            const cardBorder = agent.status === 'running'
                ? 'border-primary shadow-[0_0_15px_rgba(19,91,236,0.25)]'
                : 'border-[#e5e7eb] dark:border-[#2d333d]';

            return `
                <div class="rounded-xl bg-white dark:bg-[#111318] p-4 border ${cardBorder} shadow-sm">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-lg flex items-center justify-center ${agent.status === 'running' ? 'bg-primary' : 'bg-primary/10'}">
                                <span class="material-symbols-outlined ${iconClasses}">${agent.icon}</span>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-[#111318] dark:text-white">${agent.name}</p>
                                <p class="text-xs text-[#616f89]">${agent.role}</p>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClasses}">${statusLabel}</span>
                    </div>
                </div>
            `;
        }).join('');

        section.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

function getQueryParams(query) {
    if (query instanceof URLSearchParams) {
        return query;
    }
    return new URLSearchParams(query || "");
}

function setupPipelineControls() {
    const carousel = document.getElementById('pipeline-carousel');
    const prev = document.getElementById('pipeline-prev');
    const next = document.getElementById('pipeline-next');

    if (!carousel || !prev || !next) {
        return;
    }

    const scrollAmount = 320;

    prev.onclick = () => {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    };
    next.onclick = () => {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };
}

window.initPage = function(route, query) {
    const params = getQueryParams(query);
    const prompt = params.get('prompt');
    const autostart = params.get('autostart');
    const legacy = document.getElementById('workflow-legacy');
    const emptyState = document.getElementById('workflow-empty-state');

    setupPipelineControls();

    if (prompt && autostart === 'true') {
        console.log('Starting workflow with prompt:', prompt);
        setTimeout(() => {
            window.startWorkflow();
        }, 500);
    } else {
        const section = document.getElementById('agents-section');
        if (section) {
            section.classList.add('hidden');
        }
        if (legacy) {
            legacy.classList.add('hidden');
        }
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
    }
};
