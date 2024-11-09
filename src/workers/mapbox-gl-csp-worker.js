// src/workers/mapbox-gl-csp-worker.js

self.importScripts('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl-worker.js');

self.addEventListener('message', function(e) {
  const data = e.data;
  
  if (data.type === 'ping') {
    self.postMessage({ type: 'pong' });
  }
  
  // Forward all other messages to the Mapbox GL worker
  if (self.worker && data.type !== 'ping') {
    self.worker.postMessage(data);
  }
});

// Initialize Mapbox GL worker
if (!self.worker) {
  self.worker = new Worker('mapbox-gl-worker.js');
  
  self.worker.onmessage = function(e) {
    self.postMessage(e.data);
  };
}
