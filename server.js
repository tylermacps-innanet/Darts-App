const http = require("node:http");
const { readFile } = require("node:fs/promises");
const { extname, join, normalize } = require("node:path");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
const root = __dirname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname);
    const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const normalizedPath = normalize(requestedPath);

    if (normalizedPath.startsWith("..")) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    let filePath = join(root, normalizedPath);
    let contents;

    try {
      contents = await readFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      filePath = join(root, "index.html");
      contents = await readFile(filePath);
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Bullseye preview running at http://${host}:${port}`);
});
