/**
 * LLM-Research-Core HTTP Server
 * Minimal server for Cloud Run deployment
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const PORT = parseInt(process.env.PORT || '8080', 10);

const LLM_SIMULATOR_URL = process.env.LLM_SIMULATOR_URL || 'http://localhost:8022';
const LLM_RESEARCH_LAB_URL = process.env.LLM_RESEARCH_LAB_URL || 'http://localhost:8026';
const LLM_SCHEMA_REGISTRY_URL = process.env.LLM_SCHEMA_REGISTRY_URL || 'http://localhost:8019';

function sendJson(res: ServerResponse, statusCode: number, data: Record<string, unknown>): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function forwardEvent(url: string, body: string): void {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch((err) => {
    console.error(`Failed to forward event to ${url}:`, err);
  });
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const { method, url } = req;

  // Health check endpoint (platform health contract)
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'research-core',
      version: process.env.npm_package_version || 'unknown',
    }));
    return;
  }

  // Root endpoint
  if (url === '/') {
    sendJson(res, 200, {
      status: 'healthy',
      service: 'research-core',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Readiness check
  if (url === '/ready') {
    sendJson(res, 200, {
      status: 'ready',
      service: 'research-core',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Research ingest endpoint (leaf in fanout chain)
  if (url === '/v1/research/ingest' && method === 'POST') {
    readBody(req).then((body) => {
      const event = JSON.parse(body);
      console.log(`[ingest] source=${event.source} execution_id=${event.execution_id}`);
      sendJson(res, 202, {
        status: 'accepted',
        execution_id: event.execution_id,
      });
    }).catch(() => {
      sendJson(res, 400, {
        error: 'Bad Request',
        message: 'Invalid JSON body',
      });
    });
    return;
  }

  // Event forwarding endpoint
  if (url === '/v1/events' && method === 'POST') {
    readBody(req).then((body) => {
      // Fire-and-forget to all downstream services
      forwardEvent(`${LLM_SIMULATOR_URL}/v1/events`, body);
      forwardEvent(`${LLM_RESEARCH_LAB_URL}/api/v1/events`, body);
      forwardEvent(`${LLM_SCHEMA_REGISTRY_URL}/api/v1/events`, body);

      sendJson(res, 202, {
        accepted: true,
        targets: ['llm-simulator', 'llm-research-lab', 'llm-schema-registry'],
      });
    }).catch(() => {
      sendJson(res, 400, {
        error: 'Bad Request',
        message: 'Failed to read request body',
      });
    });
    return;
  }

  // 404 for all other routes
  sendJson(res, 404, {
    error: 'Not Found',
    message: `Cannot ${method} ${url}`,
  });
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`research-core server listening on port ${PORT}`);
});
