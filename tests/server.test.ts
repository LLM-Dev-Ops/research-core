import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createResearchServer } from "../src/server.js";

interface ResponseBody {
  readonly status: number;
  readonly headers: Headers;
  readonly body: Record<string, unknown>;
}

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
  );
});

async function startServer(
  options: Parameters<typeof createResearchServer>[0] = {},
): Promise<string> {
  const server = createResearchServer(options);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function request(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<ResponseBody> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return {
    status: response.status,
    headers: response.headers,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe("research-core HTTP boundary", () => {
  it("serves a no-store health response", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.body).toMatchObject({
      status: "healthy",
      service: "research-core",
    });
  });

  it("accepts a valid research ingest envelope", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/research/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "research-lab",
        execution_id: "exec-123",
      }),
    });
    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      status: "accepted",
      execution_id: "exec-123",
    });
  });

  it("rejects missing ingest identity fields", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/research/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "research-lab" }),
    });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("INVALID_EVENT");
  });

  it("rejects malformed JSON", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{broken",
    });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_JSON");
  });

  it("rejects non-object JSON envelopes", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["unexpected"]),
    });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_JSON_OBJECT");
  });

  it("rejects unsupported content types", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "{}",
    });
    expect(response.status).toBe(415);
    expect(response.body.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects bodies beyond the configured limit", async () => {
    const baseUrl = await startServer({ maxBodyBytes: 32 });
    const response = await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: "x".repeat(64) }),
    });
    expect(response.status).toBe(413);
    expect(response.body.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("does not fan out invalid events", async () => {
    const forwarder = jest.fn<(url: string, body: string) => void>();
    const baseUrl = await startServer({ forwarder });
    await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
    expect(forwarder).not.toHaveBeenCalled();
  });

  it("fans out a canonical valid event to every configured target", async () => {
    const forwarder = jest.fn<(url: string, body: string) => void>();
    const downstreamUrls = [
      "https://one.example/events",
      "https://two.example/events",
    ];
    const baseUrl = await startServer({ forwarder, downstreamUrls });
    const response = await request(baseUrl, "/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"event":"completed"}',
    });
    expect(response.status).toBe(202);
    expect(forwarder.mock.calls).toEqual([
      ["https://one.example/events", '{"event":"completed"}'],
      ["https://two.example/events", '{"event":"completed"}'],
    ]);
  });

  it("advertises POST on method mismatch", async () => {
    const baseUrl = await startServer();
    const response = await request(baseUrl, "/v1/events");
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });
});
