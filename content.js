(function () {
  let extensionContextAlive = true;

  function buildPayload() {
    const detections = window.StackScopeDetector.detectFrontendStack();

    return {
      kind: "frontend-analysis",
      url: window.location.href,
      title: document.title,
      capturedAt: new Date().toISOString(),
      detections,
      summary: window.StackScopeDetector.summarizeDetections(detections)
    };
  }

  function isContextInvalidatedError(error) {
    return Boolean(
      error &&
      typeof error.message === "string" &&
      error.message.includes("Extension context invalidated")
    );
  }

  function markContextDead() {
    extensionContextAlive = false;
  }

  function sendAnalysis() {
    if (!extensionContextAlive) {
      return;
    }

    try {
      chrome.runtime.sendMessage(buildPayload(), function () {
        if (chrome.runtime.lastError && isContextInvalidatedError(chrome.runtime.lastError)) {
          markContextDead();
        }
      });
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        markContextDead();
        return;
      }

      throw error;
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!extensionContextAlive) {
      return false;
    }

    if (message && message.kind === "collect-frontend-analysis") {
      try {
        sendResponse(buildPayload());
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          markContextDead();
          return false;
        }

        throw error;
      }
      return true;
    }

    return false;
  });

  sendAnalysis();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!extensionContextAlive) {
      observer.disconnect();
      return;
    }

    if (scheduled) {
      return;
    }

    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      sendAnalysis();
    }, 1500);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
