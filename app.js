
const counterConfig = {
    baseUrl: "https://api.counterapi.dev/v1",
    namespace: "zapcz-systems-archive",
    activeCounter: "viewing-now",
    viewsCounter: "global-views"
};

const viewingNow = document.getElementById("viewing-now");
const globalViews = document.getElementById("global-views");

let joinedActiveCounter = false;
let countedGlobalView = false;
let activePollId;

function counterUrl(name, action = "") {
    const path = [counterConfig.baseUrl, counterConfig.namespace, name, action]
        .filter(Boolean)
        .join("/");

    return path;
}

function formatCount(value) {
    const count = Number(value);

    if (!Number.isFinite(count)) {
        return "...";
    }

    return new Intl.NumberFormat().format(Math.max(0, count));
}

function setCounterText(element, value) {
    if (element) {
        element.textContent = formatCount(value);
    }
}

async function readCounter(name) {
    const response = await fetch(counterUrl(name), { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Counter request failed: ${response.status}`);
    }

    return response.json();
}

async function updateCounter(name, action) {
    const response = await fetch(counterUrl(name, action), { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Counter update failed: ${response.status}`);
    }

    return response.json();
}

async function refreshActiveCounter() {
    try {
        const result = await readCounter(counterConfig.activeCounter);
        setCounterText(viewingNow, result.count);
    } catch {
        setCounterText(viewingNow, 1);
    }
}

async function initializeCounters() {
    if (!viewingNow || !globalViews) {
        return;
    }

    try {
        const activeResult = await updateCounter(counterConfig.activeCounter, "up");
        joinedActiveCounter = true;
        setCounterText(viewingNow, activeResult.count);
    } catch {
        setCounterText(viewingNow, 1);
    }

    try {
        const viewsResult = countedGlobalView
            ? await readCounter(counterConfig.viewsCounter)
            : await updateCounter(counterConfig.viewsCounter, "up");

        countedGlobalView = true;
        setCounterText(globalViews, viewsResult.count);
    } catch {
        setCounterText(globalViews, 1);
    }

    if (!activePollId) {
        activePollId = window.setInterval(refreshActiveCounter, 15000);
    }
}

function leaveActiveCounter() {
    if (!joinedActiveCounter) {
        return;
    }

    joinedActiveCounter = false;
    fetch(counterUrl(counterConfig.activeCounter, "down"), {
        cache: "no-store",
        keepalive: true
    }).catch(() => {});
}

window.addEventListener("pagehide", leaveActiveCounter);
window.addEventListener("beforeunload", leaveActiveCounter);
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        initializeCounters();
    }
});

initializeCounters();
