const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");
const siteTitleEl = document.getElementById("site-title");
const siteUrlEl = document.getElementById("site-url");
const refreshButton = document.getElementById("refresh");
const categoryTemplate = document.getElementById("category-template");
const chipTemplate = document.getElementById("chip-template");

function titleCase(value) {
  return value
    .split(/[-\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderSummary(groups) {
  const cards = [
    { label: "Languages", count: groups.languages.length },
    { label: "Frameworks", count: groups.frameworks.length },
    { label: "Libraries", count: groups.libraries.length },
    { label: "Backend Hints", count: groups.backend.length + groups.server.length + groups.backendLanguages.length }
  ];

  summaryEl.replaceChildren(
    ...cards.map((card) => {
      const node = document.createElement("article");
      node.className = "summary-pill";
      node.innerHTML = `<span class="label">${card.label}</span><strong>${card.count}</strong>`;
      return node;
    })
  );
}

function makeChip(item) {
  const node = chipTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector("strong").textContent = item.name;
  node.querySelector(".score").textContent = `${item.confidence}%`;
  node.querySelector(".chip-type").textContent = titleCase(item.type);
  node.querySelector(".chip-evidence").textContent = item.evidence.length
    ? item.evidence.join(" • ")
    : "Tanpa evidence tambahan";
  return node;
}

function renderCategories(groups) {
  const categories = [
    { label: "Languages", items: groups.languages },
    { label: "Frameworks", items: groups.frameworks },
    { label: "Libraries", items: groups.libraries },
    { label: "Platforms / CMS", items: groups.platforms },
    { label: "Backend", items: groups.backend },
    { label: "Backend Language", items: groups.backendLanguages },
    { label: "Server / Edge", items: groups.server }
  ].filter((section) => section.items.length > 0);

  if (categories.length === 0) {
    resultsEl.innerHTML = '<p class="empty">Belum ada stack yang berhasil dideteksi pada tab ini.</p>';
    return;
  }

  resultsEl.replaceChildren(
    ...categories.map((section) => {
      const node = categoryTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("h4").textContent = section.label;
      node.querySelector(".chips").replaceChildren(...section.items.map(makeChip));
      return node;
    })
  );
}

function groupMergedData(payload) {
  const frontendDetections = payload.frontend?.detections || [];
  const networkDetections = payload.network?.findings || [];
  const merged = [...frontendDetections, ...networkDetections];

  return {
    languages: merged.filter((item) => item.type === "language"),
    frameworks: merged.filter((item) => item.type === "framework"),
    libraries: merged.filter((item) => item.type === "library"),
    platforms: merged.filter((item) => item.type === "platform"),
    backend: merged.filter((item) => item.type === "backend"),
    backendLanguages: merged.filter((item) => item.type === "backend-language"),
    server: merged.filter((item) => item.type === "server")
  };
}

function queryActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!tabs.length) {
        reject(new Error("Tidak ada tab aktif."));
        return;
      }

      resolve(tabs[0]);
    });
  });
}

function requestContentRefresh(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { kind: "collect-frontend-analysis" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

function requestMergedAnalysis(tabId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ kind: "get-tab-analysis", tabId }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function loadAnalysis() {
  resultsEl.innerHTML = '<p class="empty">Sedang menganalisis halaman aktif...</p>';

  try {
    const activeTab = await queryActiveTab();
    siteTitleEl.textContent = activeTab.title || "Untitled page";
    siteUrlEl.textContent = activeTab.url || "URL tidak tersedia";

    await requestContentRefresh(activeTab.id);
    const analysis = await requestMergedAnalysis(activeTab.id);
    const groups = groupMergedData(analysis || {});

    renderSummary(groups);
    renderCategories(groups);
  } catch (error) {
    summaryEl.replaceChildren();
    resultsEl.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

refreshButton.addEventListener("click", loadAnalysis);
loadAnalysis();
