// Cloudflare Worker — CORS Proxy for GLB Viewer
// Deploy this to Cloudflare Workers (free tier) and paste the URL into the viewer settings.
//
// How to deploy:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create
// 2. Name it (e.g. "glb-proxy"), click Deploy
// 3. Click "Edit Code", replace with this code, click "Save and Deploy"
// 4. Copy the worker URL (e.g. https://glb-proxy.yourname.workers.dev) and paste it in viewer settings

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    // The target URL is passed as a path parameter: /https://example.com/file.glb
    const targetUrl = decodeURIComponent(url.pathname.slice(1));

    if (!targetUrl) {
      return new Response('Usage: {worker-url}/https://example.com/file.glb', { status: 400 });
    }

    try {
      const resp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'GLB-Viewer-Proxy/1.0',
        },
      });

      if (!resp.ok) {
        return new Response(`Upstream returned ${resp.status}`, { status: resp.status });
      }

      const data = await resp.arrayBuffer();

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': resp.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Length': data.byteLength,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (err) {
      return new Response('Proxy error: ' + err.message, { status: 502 });
    }
  },
};
