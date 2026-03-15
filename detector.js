(function () {
  const CONFIDENCE = {
    high: 90,
    medium: 70,
    low: 45
  };

  function normalizeConfidence(score) {
    return Math.max(5, Math.min(99, Math.round(score)));
  }

  function pushDetection(list, type, name, confidence, evidence) {
    const existing = list.find((item) => item.type === type && item.name === name);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, normalizeConfidence(confidence));
      if (evidence && !existing.evidence.includes(evidence)) {
        existing.evidence.push(evidence);
      }
      return;
    }

    list.push({
      type,
      name,
      confidence: normalizeConfidence(confidence),
      evidence: evidence ? [evidence] : []
    });
  }

  function hasAnyText(patterns, text) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function collectAssetText() {
    const scripts = Array.from(document.scripts)
      .map((script) => `${script.src || ""}\n${script.textContent || ""}`)
      .join("\n");
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"], link[rel="modulepreload"]'))
      .map((link) => link.href || "")
      .join("\n");

    return `${scripts}\n${links}`.toLowerCase();
  }

  function detectFrontendStack() {
    const detections = [];
    const html = document.documentElement ? document.documentElement.outerHTML.slice(0, 350000).toLowerCase() : "";
    const assetText = collectAssetText();
    const combinedText = `${html}\n${assetText}`;

    pushDetection(detections, "language", "HTML", CONFIDENCE.high, "DOM tersedia");

    const styleNodeCount = document.querySelectorAll("style, link[rel='stylesheet']").length;
    if (styleNodeCount > 0) {
      pushDetection(detections, "language", "CSS", CONFIDENCE.high, `${styleNodeCount} stylesheet/style node`);
    }

    const scriptCount = document.scripts.length;
    if (scriptCount > 0) {
      pushDetection(detections, "language", "JavaScript", CONFIDENCE.high, `${scriptCount} script tag`);
    }

    if (hasAnyText([/\.tsx?\b/, /typescript/i, /tslib/i], combinedText)) {
      pushDetection(detections, "language", "TypeScript (indikatif)", CONFIDENCE.low, "Pola aset atau runtime TypeScript");
    }

    if (document.querySelector("[data-reactroot], [data-reactid]")) {
      pushDetection(detections, "framework", "React", CONFIDENCE.high, "Atribut React legacy");
    }
    if (hasAnyText([/__next/, /_next\//, /next-route-announcer/, /next\.js/i], combinedText)) {
      pushDetection(detections, "framework", "Next.js", CONFIDENCE.high, "Aset atau marker Next.js");
      pushDetection(detections, "framework", "React", CONFIDENCE.medium, "Next.js terdeteksi");
    }
    if (hasAnyText([/__nuxt/, /_nuxt\//, /nuxt/i], combinedText)) {
      pushDetection(detections, "framework", "Nuxt", CONFIDENCE.high, "Aset atau marker Nuxt");
      pushDetection(detections, "framework", "Vue", CONFIDENCE.medium, "Nuxt terdeteksi");
    }
    if (
      document.querySelector("[data-v-app], [data-vue-meta-server-rendered]") ||
      hasAnyText([/vue(?:\.runtime|\.esm|\.global)?(?:\.prod)?\.js/, /__vue__/, /_ctx\./], combinedText)
    ) {
      pushDetection(detections, "framework", "Vue", CONFIDENCE.high, "Marker DOM atau runtime Vue");
    }
    if (
      document.querySelector("[ng-version], [ng-app], [ng-controller]") ||
      hasAnyText([/angular(?:\.min)?\.js/, /ng-version/, /zone\.js/], combinedText)
    ) {
      pushDetection(detections, "framework", "Angular", CONFIDENCE.high, "Marker Angular");
    }
    if (hasAnyText([/svelte/i, /__svelte/, /sveltekit/, /_app\/immutable/], combinedText)) {
      pushDetection(detections, "framework", "Svelte / SvelteKit", CONFIDENCE.high, "Pola aset Svelte");
    }
    if (hasAnyText([/solid/i, /solid-start/, /data-hk=/], combinedText)) {
      pushDetection(detections, "framework", "SolidJS", CONFIDENCE.medium, "Pola aset Solid");
    }
    if (hasAnyText([/preact/i, /__preactattr_/, /\/preact(?:\.min)?\.js/], combinedText)) {
      pushDetection(detections, "framework", "Preact", CONFIDENCE.medium, "Pola aset Preact");
    }
    if (hasAnyText([/gatsby/i, /___gatsby/, /webpack-runtime-.*gatsby/], combinedText)) {
      pushDetection(detections, "framework", "Gatsby", CONFIDENCE.high, "Marker Gatsby");
      pushDetection(detections, "framework", "React", CONFIDENCE.medium, "Gatsby terdeteksi");
    }
    if (hasAnyText([/astro/i, /data-astro-cid/, /_astro\//], combinedText)) {
      pushDetection(detections, "framework", "Astro", CONFIDENCE.high, "Marker Astro");
    }
    if (hasAnyText([/jquery(?:\.min)?\.js/, /\$\(\s*document\s*\)\.ready/, /jQuery/i], combinedText)) {
      pushDetection(detections, "library", "jQuery", CONFIDENCE.high, "Runtime atau pola jQuery");
    }
    if (hasAnyText([/bootstrap(?:\.bundle)?(?:\.min)?\.(css|js)/, /class=["'][^"']*\bcontainer\b[^"']*\brow\b/], combinedText)) {
      pushDetection(detections, "library", "Bootstrap", CONFIDENCE.medium, "Aset atau class Bootstrap");
    }
    if (hasAnyText([/tailwind/i, /class=["'][^"']*\b(?:sm:|md:|lg:|xl:|2xl:|flex|grid|justify-|items-)/], combinedText)) {
      pushDetection(detections, "library", "Tailwind CSS", CONFIDENCE.medium, "Class utility khas Tailwind");
    }
    if (hasAnyText([/mui/i, /material-ui/i, /data-mui-color-scheme/], combinedText)) {
      pushDetection(detections, "library", "Material UI", CONFIDENCE.medium, "Pola MUI");
    }
    if (hasAnyText([/chakra/i, /css-[a-z0-9]+/, /data-theme=["']chakra/i], combinedText)) {
      pushDetection(detections, "library", "Chakra UI (indikatif)", CONFIDENCE.low, "Pola class atau atribut Chakra");
    }

    if (hasAnyText([/wp-content\//, /wp-includes\//, /wordpress/i], combinedText)) {
      pushDetection(detections, "platform", "WordPress", CONFIDENCE.high, "Aset WordPress");
    }
    if (hasAnyText([/cdn\.shopify\.com/, /shopify/i, /myshopify\.com/], combinedText)) {
      pushDetection(detections, "platform", "Shopify", CONFIDENCE.high, "Aset Shopify");
    }
    if (hasAnyText([/webflow/i, /w-webflow-/, /webflow\.js/], combinedText)) {
      pushDetection(detections, "platform", "Webflow", CONFIDENCE.high, "Aset Webflow");
    }
    if (hasAnyText([/wixstatic\.com/, /wix\.com/, /_wixCssrules/], combinedText)) {
      pushDetection(detections, "platform", "Wix", CONFIDENCE.high, "Aset Wix");
    }

    return detections.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
  }

  function summarizeDetections(detections) {
    return {
      languages: detections.filter((item) => item.type === "language"),
      frameworks: detections.filter((item) => item.type === "framework"),
      libraries: detections.filter((item) => item.type === "library"),
      platforms: detections.filter((item) => item.type === "platform")
    };
  }

  window.StackScopeDetector = {
    detectFrontendStack,
    summarizeDetections
  };
})();
