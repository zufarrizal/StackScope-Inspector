const frontendResults = new Map();
const networkResults = new Map();

function normalizeHeaderMap(headers) {
  const map = {};
  for (const header of headers || []) {
    if (!header.name) {
      continue;
    }

    map[header.name.toLowerCase()] = header.value || "";
  }
  return map;
}

function addFinding(list, type, name, confidence, evidence) {
  const existing = list.find((item) => item.type === type && item.name === name);
  if (existing) {
    existing.confidence = Math.max(existing.confidence, confidence);
    if (evidence && !existing.evidence.includes(evidence)) {
      existing.evidence.push(evidence);
    }
    return;
  }

  list.push({
    type,
    name,
    confidence,
    evidence: evidence ? [evidence] : []
  });
}

function inferBackend(headers, url) {
  const findings = [];
  const poweredBy = headers["x-powered-by"] || "";
  const server = headers.server || "";
  const setCookie = headers["set-cookie"] || "";
  const via = headers.via || "";
  const all = `${poweredBy}\n${server}\n${setCookie}\n${via}\n${url}`.toLowerCase();

  if (server) {
    if (/cloudflare/i.test(server) || /cloudflare/i.test(via)) {
      addFinding(findings, "server", "Cloudflare", 90, `server: ${server || via}`);
    }
    if (/nginx/i.test(server)) {
      addFinding(findings, "server", "Nginx", 92, `server: ${server}`);
    }
    if (/apache/i.test(server)) {
      addFinding(findings, "server", "Apache HTTP Server", 92, `server: ${server}`);
    }
    if (/iis/i.test(server)) {
      addFinding(findings, "server", "Microsoft IIS", 92, `server: ${server}`);
    }
    if (/caddy/i.test(server)) {
      addFinding(findings, "server", "Caddy", 90, `server: ${server}`);
    }
    if (/openresty/i.test(server)) {
      addFinding(findings, "server", "OpenResty", 92, `server: ${server}`);
    }
    if (/liteSpeed/i.test(server)) {
      addFinding(findings, "server", "LiteSpeed", 92, `server: ${server}`);
    }
  }

  if (/express/i.test(poweredBy)) {
    addFinding(findings, "backend", "Node.js / Express", 90, `x-powered-by: ${poweredBy}`);
  }
  if (/next\.js/i.test(poweredBy)) {
    addFinding(findings, "backend", "Next.js", 90, `x-powered-by: ${poweredBy}`);
    addFinding(findings, "backend-language", "JavaScript / TypeScript", 70, "Next.js terdeteksi");
  }
  if (/php/i.test(poweredBy) || /phpsessid/i.test(all)) {
    addFinding(findings, "backend-language", "PHP", 90, poweredBy ? `x-powered-by: ${poweredBy}` : "Cookie PHPSESSID");
  }
  if (/asp\.net/i.test(poweredBy) || /asp\.net/i.test(all) || /__requestverificationtoken/i.test(all)) {
    addFinding(findings, "backend", "ASP.NET", 88, poweredBy ? `x-powered-by: ${poweredBy}` : "Cookie/field ASP.NET");
    addFinding(findings, "backend-language", "C#", 70, "ASP.NET terdeteksi");
  }
  if (/laravel/i.test(all)) {
    addFinding(findings, "backend", "Laravel", 86, "Cookie/header Laravel");
    addFinding(findings, "backend-language", "PHP", 78, "Laravel terdeteksi");
  }
  if (/django/i.test(all) || /csrftoken/i.test(all)) {
    addFinding(findings, "backend", "Django", 84, "Cookie/header Django");
    addFinding(findings, "backend-language", "Python", 78, "Django terdeteksi");
  }
  if (/rails/i.test(all) || /_session_id/i.test(all)) {
    addFinding(findings, "backend", "Ruby on Rails", 82, "Cookie/header Rails");
    addFinding(findings, "backend-language", "Ruby", 76, "Rails terdeteksi");
  }
  if (/jsessionid/i.test(all)) {
    addFinding(findings, "backend", "Java Servlet / Spring (indikatif)", 76, "Cookie JSESSIONID");
    addFinding(findings, "backend-language", "Java", 72, "Cookie JSESSIONID");
  }
  if (/wp-content|wordpress/i.test(url) || /wordpress/i.test(all)) {
    addFinding(findings, "backend", "WordPress", 82, "Pola WordPress");
    addFinding(findings, "backend-language", "PHP", 74, "WordPress terdeteksi");
  }

  return findings.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function buildTabResult(tabId) {
  const frontend = frontendResults.get(tabId) || null;
  const network = networkResults.get(tabId) || null;

  return {
    frontend,
    network,
    mergedAt: new Date().toISOString()
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.kind === "frontend-analysis" && sender.tab && sender.tab.id !== undefined) {
    frontendResults.set(sender.tab.id, message);
    sendResponse({ ok: true });
    return true;
  }

  if (message && message.kind === "get-tab-analysis") {
    sendResponse(buildTabResult(message.tabId));
    return true;
  }

  return false;
});

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0 || details.type !== "main_frame") {
      return;
    }

    const headerMap = normalizeHeaderMap(details.responseHeaders);
    networkResults.set(details.tabId, {
      kind: "network-analysis",
      url: details.url,
      statusCode: details.statusCode,
      capturedAt: new Date().toISOString(),
      headers: headerMap,
      findings: inferBackend(headerMap, details.url)
    });
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.tabs.onRemoved.addListener((tabId) => {
  frontendResults.delete(tabId);
  networkResults.delete(tabId);
});
