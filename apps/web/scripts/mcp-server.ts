import { createInterface } from "node:readline";
import { localMcpServer } from "../server/mcp/composition.ts";

const server = localMcpServer();
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
lines.on("line", async (line) => { if (Buffer.byteLength(line, "utf8") > 256 * 1024) { process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "The MCP request is too large." } })}\n`); return; } let value: unknown; try { value = JSON.parse(line); } catch { process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON." } })}\n`); return; } process.stdout.write(`${JSON.stringify(await server.handle(value))}\n`); });
