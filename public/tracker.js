(function () {
  // Safely check for browser environment
  if (typeof window === 'undefined') return;

  const API_ENDPOINT = '/api/events';
  const SESSION_KEY = 'cf_session_id';

  // Helper to generate a unique session ID
  function generateSessionId() {
    const array = new Uint32Array(4);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback if crypto isn't available
      for (let i = 0; i < 4; i++) {
        array[i] = Math.floor(Math.random() * 4294967296);
      }
    }
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += array[i].toString(16).padStart(8, '0');
    }
    return `sess_${hex}`;
  }

  // Get or create session ID
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  // Helper to send events to backend
  function sendEvent(eventType, details = {}) {
    const payload = {
      sessionId: sessionId,
      eventType: eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      clickX: details.clickX !== undefined ? details.clickX : null,
      clickY: details.clickY !== undefined ? details.clickY : null,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      screenHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };

    // Use fetch to send event
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => {
      console.warn('Analytics tracking error:', err);
    });
  }

  // Track page view event immediately on load
  sendEvent('page_view');

  // Track clicks on the document
  document.addEventListener('click', function (event) {
    // Avoid double tracking if clicked inside heatmap elements or tracking UI if needed
    // But generally, track all clicks as requested
    sendEvent('click', {
      clickX: Math.round(event.pageX),
      clickY: Math.round(event.pageY)
    });
  }, true); // Use capture phase to ensure we catch it before preventDefault in some cases

  // Listen for history changes to track SPAs (single page applications) page views
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      sendEvent('page_view');
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // Fallback popstate event
  window.addEventListener('popstate', function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      sendEvent('page_view');
    }
  });
})();
