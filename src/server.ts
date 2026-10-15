/**
 * LLM-Research-Core HTTP Server
 * Minimal, bounded server for Cloud Run deployment.
 */

import {
  createServer,
  type IncomingMessage,
  type RequestListener,
  type Server,
  type ServerResponse,
} from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 8080;
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

const DEFAULT_DOWNSTREAM_URLS = [
  `${process.env.LLM_SIMULATOR_URL || "http://localhost:8022"}/v1/events`,
  `${process.env.LLM_RESEARCH_LAB_URL || "http://localhost:8026"}/api/v1/events`,
  `${process.env.LLM_SCHEMA_REGISTRY_URL || "http://localhost:8019"}/api/v1/events`,
];

type JsonObject = Record<string, unknown>;
type EventForwarder = (url: string, body: string) => void;

export interface ResearchServerOptions {
  readonly maxBodyBytes?: number;
  readonly downstreamUrls?: readonly string[];
  readonly forwarder?: EventForwarder;
}

class RequestError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: JsonObject,
): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(body);
}

function requireJsonContentType(req: IncomingMessage): void {
  const contentType = req.headers["content-type"]
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json" && !contentType?.endsWith("+json")) {
    throw new RequestError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json",
    );
  }
}

function readJsonObject(
  req: IncomingMessage,
  maxBodyBytes: number,
): Promise<JsonObject> {
  requireJsonContentType(req);

  const contentLength = req.headers["content-length"];
  if (contentLength !== undefined) {
    if (!/^\d+$/.test(contentLength)) {
      throw new RequestError(
        400,
        "INVALID_CONTENT_LENGTH",
        "Content-Length must be an integer",
      );
    }
    if (Number(contentLength) > maxBodyBytes) {
      throw new RequestError(
        413,
        "PAYLOAD_TOO_LARGE",
        `Request body exceeds ${maxBodyBytes} bytes`,
      );
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on("data", (chunk: Buffer) => {
      if (settled) return;
      received += chunk.length;
      if (received > maxBodyBytes) {
        fail(
          new RequestError(
            413,
            "PAYLOAD_TOO_LARGE",
            `Request body exceeds ${maxBodyBytes} bytes`,
          ),
        );
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw.length === 0) {
        fail(new RequestError(400, "EMPTY_BODY", "Request body is required"));
        return;
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        if (
          parsed === null ||
          Array.isArray(parsed) ||
          typeof parsed !== "object"
        ) {
          fail(
            new RequestError(
              400,
              "INVALID_JSON_OBJECT",
              "Request body must be a JSON object",
            ),
          );
          return;
        }
        settled = true;
        resolve(parsed as JsonObject);
      } catch {
        fail(
          new RequestError(
            400,
            "INVALID_JSON",
            "Request body contains invalid JSON",
          ),
        );
      }
    });
    req.on("aborted", () =>
      fail(new RequestError(400, "REQUEST_ABORTED", "Request was aborted")),
    );
    req.on("error", fail);
  });
}

function requireNonEmptyString(event: JsonObject, field: string): string {
  const value = event[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RequestError(
      422,
      "INVALID_EVENT",
      `${field} must be a non-empty string`,
    );
  }
  return value;
}

function defaultForwarder(url: string, body: string): void {
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Failed to forward event to ${url}: ${message}`);
  });
}

export function createRequestHandler(
  options: ResearchServerOptions = {},
): RequestListener {
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const downstreamUrls = options.downstreamUrls ?? DEFAULT_DOWNSTREAM_URLS;
  const forwarder = options.forwarder ?? defaultForwarder;

  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    throw new Error("maxBodyBytes must be a positive safe integer");
  }

  return (req, res) => {
    void (async () => {
      const method = req.method ?? "UNKNOWN";
      const url = req.url ?? "/";

      if (url === "/health" || url === "/" || url === "/ready") {
        if (method !== "GET") {
          res.setHeader("Allow", "GET");
          sendJson(res, 405, {
            error: "Method Not Allowed",
            code: "METHOD_NOT_ALLOWED",
          });
          return;
        }
        sendJson(res, 200, {
          status: url === "/ready" ? "ready" : "healthy",
          service: "research-core",
          version: process.env.npm_package_version || "0.1.0",
          ...(url === "/" || url === "/ready"
            ? { timestamp: new Date().toISOString() }
            : {}),
        });
        return;
      }

      if (url === "/v1/research/ingest") {
        if (method !== "POST") {
          res.setHeader("Allow", "POST");
          sendJson(res, 405, {
            error: "Method Not Allowed",
            code: "METHOD_NOT_ALLOWED",
          });
          return;
        }
        const event = await readJsonObject(req, maxBodyBytes);
        const source = requireNonEmptyString(event, "source");
        const executionId = requireNonEmptyString(event, "execution_id");
        console.log(`[ingest] source=${source} execution_id=${executionId}`);
        sendJson(res, 202, { status: "accepted", execution_id: executionId });
        return;
      }

      if (url === "/v1/events") {
        if (method !== "POST") {
          res.setHeader("Allow", "POST");
          sendJson(res, 405, {
            error: "Method Not Allowed",
            code: "METHOD_NOT_ALLOWED",
          });
          return;
        }
        const event = await readJsonObject(req, maxBodyBytes);
        const body = JSON.stringify(event);
        for (const downstreamUrl of downstreamUrls)
          forwarder(downstreamUrl, body);
        sendJson(res, 202, {
          accepted: true,
          targets: ["llm-simulator", "llm-research-lab", "llm-schema-registry"],
        });
        return;
      }

      sendJson(res, 404, {
        error: "Not Found",
        message: `Cannot ${method} ${url}`,
      });
    })().catch((error: unknown) => {
      if (res.headersSent) return;
      if (error instanceof RequestError) {
        sendJson(res, error.statusCode, {
          error: error.statusCode === 413 ? "Payload Too Large" : "Bad Request",
          code: error.code,
          message: error.message,
        });
        return;
      }
      sendJson(res, 500, {
        error: "Internal Server Error",
        code: "INTERNAL_ERROR",
      });
    });
  };
}

export function createResearchServer(
  options: ResearchServerOptions = {},
): Server {
  return createServer(createRequestHandler(options));
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  const configuredPort = Number(process.env.PORT ?? DEFAULT_PORT);
  if (
    !Number.isSafeInteger(configuredPort) ||
    configuredPort < 0 ||
    configuredPort > 65_535
  ) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }
  createResearchServer().listen(configuredPort, () => {
    console.log(`research-core server listening on port ${configuredPort}`);
  });
}
