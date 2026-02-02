/**
 * Script kiểm thử API refresh token.
 * Chạy: node scripts/test-refresh-token.js
 * Cần .env có REACT_APP_ROOT_API (hoặc truyền API_URL qua env).
 * Test với token mới: ACCESS_TOKEN=... REFRESH_TOKEN=... node scripts/test-refresh-token.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const https = require("https");
const http = require("http");

const API_URL = process.env.REACT_APP_ROOT_API || process.env.API_URL || "https://api-tapmed.sse.net.vn/api/";
// Có thể truyền qua env: ACCESS_TOKEN=... REFRESH_TOKEN=... node scripts/test-refresh-token.js
const ACCESS_TOKEN =
  process.env.ACCESS_TOKEN ||
  "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJEVkNTIjoiQ8OUTkcgVFkgQ-G7lCBQSOG6pk4gWFXhuqRUIE5I4bqsUCBLSOG6qFUgRMav4buiQyBQSOG6qE0gVEFQTUVEIiwiU3RvcmUiOiIiLCJNQV9EVkNTIjoiVEFQTUVEICAgICAgICAgICIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiUm9sZXMiOiJBZG1pbiIsIlJvbGVJZCI6IjEiLCJOYW1lIjoiTElOSFNTRSIsIklzRGlzYWJsZSI6IkZhbHNlIiwiSWQiOiIzMDY2IiwiRnVsbE5hbWUiOiJMSU5IU1NFIiwiU3RvcmVOYW1lIjoiIiwiUm9sZVdlYiI6IiIsIlBlcm1pc2lvbiI6IiIsIk1hS0giOiIiLCJleHAiOjE3NzAwMjE3NjgsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMTgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTE4In0.lJNbcuzIS-LCmKlZUFAA7tilBuYbrvOyQGdofTVmMOx1Es-9oHDR8h_eglgVwhn4gHSa5-8X8vwreVg3LTJWdA";
const REFRESH_TOKEN =
  process.env.REFRESH_TOKEN ||
  "O3f2UAUqAyafIdwuojZo8yOgacm0o2ogWrNt5bBelAMSbENxcCNJqLjZkrFB9awwgHuysUqk2EI/k82Z9rZ/OA==";

const baseUrl = API_URL.replace(/\/$/, "");
const refreshPath = "/Authentication/refresh";
const fullUrl = baseUrl + refreshPath;
const url = new URL(fullUrl);

const bodyStr = JSON.stringify({
  Token: ACCESS_TOKEN,
  RefreshToken: REFRESH_TOKEN,
});

const isHttps = url.protocol === "https:";
const lib = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr, "utf8"),
  },
};

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload;
  } catch (_) {
    return null;
  }
}

console.log("=== Kiểm thử Refresh Token ===\n");
console.log("API:", baseUrl + refreshPath);
console.log("Gửi: token (access_token) + refreshToken\n");

const payload = decodeJwtPayload(ACCESS_TOKEN);
if (payload) {
  const exp = payload.exp;
  const expDate = exp ? new Date(exp * 1000).toISOString() : "(không có)";
  console.log("Access token payload:");
  console.log("  - exp:", exp, "->", expDate);
  console.log("  - exp đã qua?", exp ? Date.now() / 1000 > exp : "N/A");
  console.log("");
}

const req = lib.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("Status:", res.statusCode, res.statusMessage);
    try {
      const json = data ? JSON.parse(data) : {};
      if (res.statusCode === 200) {
        const token = json.Token ?? json.token;
        const newRefreshToken = json.RefreshToken ?? json.refreshToken;
        if (token && newRefreshToken) {
          console.log("Kết quả: OK - Refresh thành công.");
          console.log("  - token (mới):", token.substring(0, 50) + "...");
          console.log("  - refreshToken (mới):", newRefreshToken ? newRefreshToken.substring(0, 30) + "..." : "(có)");
        } else {
          console.log("Kết quả: Response thiếu token/refreshToken.");
          console.log("  Body:", JSON.stringify(json, null, 2));
        }
      } else {
        console.log("Kết quả: Lỗi (có thể token hết hạn hoặc backend từ chối).");
        if (data) console.log("  Body:", data.length > 500 ? data.substring(0, 500) + "..." : data);
        else console.log("  Body: (rỗng)");
      }
    } catch (e) {
      console.log("Body (raw):", data ? data.substring(0, 300) : "(rỗng)");
    }
  });
});

req.on("error", (err) => {
  console.error("Lỗi kết nối:", err.message);
});

req.write(bodyStr);
req.end();
