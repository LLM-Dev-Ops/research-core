/**
 * LLM-Research-Core HTTP Server
 * Minimal server for Cloud Run deployment
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const PORT = parseInt(process.env.PORT || '8080', 10);

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

function sendJson(res: ServerResponse, statusCode: number, data: HealthResponse | ErrorResponse): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const { method, url } = req;

  // Health check endpoint
  if (url === '/' || url === '/health') {
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
