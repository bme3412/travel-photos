// public/workers/mapbox-gl-csp-worker.js
self.addEventListener('message', (e) => {
    self.postMessage(e.data);
  });