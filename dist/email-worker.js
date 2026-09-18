"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "16.6.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports2, module2) {
    "use strict";
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module2.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    "use strict";
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// worker/email-worker.ts
var import_bullmq2 = require("bullmq");
var import_client = require("@prisma/client");
var import_googleapis2 = require("googleapis");

// src/lib/queue.ts
var import_bullmq = require("bullmq");
function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    return { host: "localhost", port: 6379 };
  }
  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || (isTls ? "6380" : "6379")),
    password: parsed.password || void 0,
    username: parsed.username || void 0,
    tls: isTls ? {} : void 0
  };
}
var connection = getRedisConnection();
var emailQueue = new import_bullmq.Queue("email-processing", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    // Gemini free-tier 429s ask for up to ~60s before retrying (see the worker's
    // concurrency comment). Exponential from a 5s base (5s/10s/20s/40s/80s) gives
    // retries a real chance of landing after the quota window actually clears,
    // instead of burning all attempts in the first few seconds.
    backoff: {
      type: "exponential",
      delay: 5e3
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
});

// src/lib/ai.ts
var import_generative_ai = require("@google/generative-ai");
var _a;
var genAI = new import_generative_ai.GoogleGenerativeAI((_a = process.env.GEMINI_API_KEY) != null ? _a : "");
var CHAT_MODEL = "gemini-3.1-flash-lite";
var EMBEDDING_MODEL = "gemini-embedding-001";
var EMBEDDING_DIMENSIONS = 768;
function getModel() {
  return genAI.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  });
}
function parseJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned);
}
var toneInstructions = {
  professional: "Write in a formal, professional tone. Use complete sentences. Be courteous and concise.",
  friendly: "Write in a warm, conversational tone. Feel free to use casual language and a friendly greeting.",
  brief: "Write an extremely short reply \u2014 2 to 4 sentences maximum. Get straight to the point.",
  detailed: "Write a thorough, comprehensive reply. Address all points raised in the original email with detail."
};
async function classifyEmail(subject, snippet, body) {
  const model = getModel();
  const prompt = `You are an email classifier. Analyze this email and return a JSON object only.

Subject: ${subject || "(no subject)"}
Preview: ${snippet || ""}
Body: ${(body == null ? void 0 : body.slice(0, 1500)) || ""}

Return this exact JSON structure:
{
  "category": one of ["work", "personal", "newsletter", "receipt", "social", "spam", "urgent"],
  "priority": integer from 0 to 100 (100 = extremely urgent, 0 = not important),
  "summary": "One sentence description of what this email is about"
}`;
  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}
async function generateDraft(subject, fromName, body, tone = "professional", userStyleHint) {
  const model = getModel();
  const styleSection = userStyleHint ? `
User's writing style: ${userStyleHint}` : "";
  const toneInstruction = toneInstructions[tone];
  const prompt = `You are a personal email assistant. Write a reply to the email below.

Tone instruction: ${toneInstruction}${styleSection}

Original Email:
From: ${fromName}
Subject: ${subject || "(no subject)"}
Body: ${(body == null ? void 0 : body.slice(0, 2e3)) || ""}

Return this exact JSON structure:
{
  "subject": "Re: ${subject || ""}",
  "body": "The full reply body text \u2014 plain text only, no HTML, no markdown"
}`;
  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}
async function extractTasks(subject, body) {
  const model = getModel();
  const prompt = `You are a task extraction assistant. Extract any action items or tasks from this email.

Subject: ${subject || "(no subject)"}
Body: ${(body == null ? void 0 : body.slice(0, 2e3)) || ""}

Return a JSON array only. If there are no tasks, return an empty array [].
Each task: { "title": "Short action item description", "dueDate": "2024-01-15" or null }`;
  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}
async function analyzeWritingStyle(sentEmailBodies) {
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5
    }
  });
  const sample = sentEmailBodies.slice(0, 30).map((body, i) => `--- Email ${i + 1} ---
${body.slice(0, 500)}`).join("\n\n");
  const prompt = `You are a writing style analyst. Based on the following emails sent by a user, write a concise 2-4 sentence description of their personal writing style.

Focus on:
- Tone (formal vs casual, warm vs neutral)
- Sentence length and structure (short/punchy vs long/detailed)
- Greeting and sign-off patterns
- Use of punctuation, emoji, or informal language
- Any distinctive phrases or patterns

Sent emails sample:
${sample}

Return this exact JSON structure:
{
  "styleSummary": "2-4 sentence description of the user's writing style"
}`;
  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}
async function generateEmbedding(text) {
  const embeddingModel = genAI.getGenerativeModel({
    model: EMBEDDING_MODEL
  });
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: text.slice(0, 8e3) }], role: "user" },
    taskType: import_generative_ai.TaskType.RETRIEVAL_DOCUMENT,
    outputDimensionality: EMBEDDING_DIMENSIONS
  });
  return result.embedding.values;
}

// src/lib/gmail.ts
var import_googleapis = require("googleapis");
function getGmailClient(accessToken, refreshToken) {
  const oauth2Client = new import_googleapis.google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/auth/callback/google`
  );
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  return import_googleapis.google.gmail({ version: "v1", auth: oauth2Client });
}
function decodeBody(data) {
  if (!data) return "";
  try {
    return Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
  } catch (e) {
    return "";
  }
}
function extractBody(payload) {
  var _a2, _b, _c, _d;
  if (payload.mimeType === "text/plain" && ((_a2 = payload.body) == null ? void 0 : _a2.data)) {
    return decodeBody(payload.body.data);
  }
  if (payload.mimeType === "text/html" && ((_b = payload.body) == null ? void 0 : _b.data)) {
    return decodeBody(payload.body.data);
  }
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if ((_c = textPart == null ? void 0 : textPart.body) == null ? void 0 : _c.data) return decodeBody(textPart.body.data);
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if ((_d = htmlPart == null ? void 0 : htmlPart.body) == null ? void 0 : _d.data) return decodeBody(htmlPart.body.data);
  }
  return "";
}
async function fetchSentEmails(accessToken, refreshToken, maxResults = 30) {
  var _a2;
  const gmail = getGmailClient(accessToken, refreshToken);
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["SENT"],
    maxResults
  });
  const messages = (_a2 = listRes.data.messages) != null ? _a2 : [];
  if (messages.length === 0) return [];
  const results = [];
  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(async (msg) => {
        var _a3, _b, _c, _d, _e;
        if (!msg.id) return null;
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full"
        });
        const headers = (_b = (_a3 = detail.data.payload) == null ? void 0 : _a3.headers) != null ? _b : [];
        const subject = (_d = (_c = headers.find((h) => {
          var _a4;
          return ((_a4 = h.name) == null ? void 0 : _a4.toLowerCase()) === "subject";
        })) == null ? void 0 : _c.value) != null ? _d : "";
        const body = extractBody((_e = detail.data.payload) != null ? _e : {});
        return { subject, body };
      })
    );
    results.push(
      ...fetched.filter((r) => r !== null)
    );
  }
  return results;
}

// worker/email-worker.ts
var import_http = __toESM(require("http"));
var prisma = new import_client.PrismaClient();
console.log("[worker] MailPilot AI Worker starting...");
var worker = new import_bullmq2.Worker(
  "email-processing",
  async (job) => {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const { type, userId, payload } = job.data;
    console.log(`[worker] Processing job: ${type} (${job.id})`);
    if (type === "categorize-email") {
      const { emailId } = payload;
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, snippet: true, body: true }
      });
      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }
      const result = await classifyEmail(
        (_a2 = email.subject) != null ? _a2 : "",
        (_b = email.snippet) != null ? _b : "",
        (_c = email.body) != null ? _c : ""
      );
      await prisma.email.update({
        where: { id: emailId },
        data: {
          category: result.category,
          priority: result.priority,
          summary: result.summary,
          processedAt: /* @__PURE__ */ new Date()
        }
      });
      console.log(`[worker] Classified email ${emailId}: ${result.category} (priority: ${result.priority})`);
      const activeRules = await prisma.rule.findMany({
        where: { userId, isActive: true }
      });
      const matchedRules = activeRules.filter(
        (r) => r.conditionField === "category" && r.conditionValue === result.category
      );
      if (matchedRules.length > 0) {
        const emailRecord = await prisma.email.findUnique({
          where: { id: emailId },
          select: { gmailId: true }
        });
        const account = await prisma.account.findFirst({
          where: { userId, provider: "google" },
          select: { access_token: true, refresh_token: true }
        });
        if (emailRecord && (account == null ? void 0 : account.access_token)) {
          const auth = new import_googleapis2.google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          auth.setCredentials({
            access_token: account.access_token,
            refresh_token: (_d = account.refresh_token) != null ? _d : void 0
          });
          const gmail = import_googleapis2.google.gmail({ version: "v1", auth });
          for (const rule of matchedRules) {
            try {
              if (rule.actionType === "archive") {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: emailRecord.gmailId,
                  requestBody: { removeLabelIds: ["INBOX"] }
                });
                console.log(`[worker] Rule "${rule.name}": Archived email ${emailRecord.gmailId}`);
              } else if (rule.actionType === "markRead") {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: emailRecord.gmailId,
                  requestBody: { removeLabelIds: ["UNREAD"] }
                });
                console.log(`[worker] Rule "${rule.name}": Marked email ${emailRecord.gmailId} as read`);
              } else if (rule.actionType === "addLabel" && rule.actionValue) {
                const labelsRes = await gmail.users.labels.list({ userId: "me" });
                const existing = (_e = labelsRes.data.labels) == null ? void 0 : _e.find(
                  (l) => {
                    var _a3;
                    return ((_a3 = l.name) == null ? void 0 : _a3.toLowerCase()) === rule.actionValue.toLowerCase();
                  }
                );
                const labelId = (_f = existing == null ? void 0 : existing.id) != null ? _f : (await gmail.users.labels.create({
                  userId: "me",
                  requestBody: { name: rule.actionValue }
                })).data.id;
                if (labelId) {
                  await gmail.users.messages.modify({
                    userId: "me",
                    id: emailRecord.gmailId,
                    requestBody: { addLabelIds: [labelId] }
                  });
                  console.log(`[worker] Rule "${rule.name}": Added label "${rule.actionValue}" to email ${emailRecord.gmailId}`);
                }
              }
            } catch (ruleErr) {
              console.error(`[worker] Rule "${rule.name}" action failed:`, ruleErr.message);
            }
          }
        }
      }
    } else if (type === "generate-draft") {
      const { emailId } = payload;
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, fromName: true, body: true, snippet: true }
      });
      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { writingStyle: true }
      });
      const result = await generateDraft(
        (_g = email.subject) != null ? _g : "",
        (_h = email.fromName) != null ? _h : "Unknown",
        (_j = (_i = email.body) != null ? _i : email.snippet) != null ? _j : "",
        "professional",
        (_k = user == null ? void 0 : user.writingStyle) != null ? _k : void 0
      );
      await prisma.aiDraft.create({
        data: {
          emailId,
          userId,
          subject: result.subject,
          body: result.body,
          tone: "professional",
          status: "draft"
        }
      });
      console.log(`[worker] Generated draft for email ${emailId}`);
    } else if (type === "extract-tasks") {
      const { emailId } = payload;
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, body: true, snippet: true }
      });
      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }
      const tasks = await extractTasks(
        (_l = email.subject) != null ? _l : "",
        (_n = (_m = email.body) != null ? _m : email.snippet) != null ? _n : ""
      );
      if (tasks.length > 0) {
        await prisma.task.createMany({
          data: tasks.map((t) => ({
            emailId,
            userId,
            title: t.title,
            dueDate: t.dueDate ? new Date(t.dueDate) : null
          }))
        });
        console.log(`[worker] Extracted ${tasks.length} tasks from email ${emailId}`);
      } else {
        console.log(`[worker] No tasks found in email ${emailId}`);
      }
    } else if (type === "analyze-writing-style") {
      const account = await prisma.account.findFirst({
        where: { userId, provider: "google" },
        select: { access_token: true, refresh_token: true }
      });
      if (!(account == null ? void 0 : account.access_token) || !(account == null ? void 0 : account.refresh_token)) {
        console.warn(`[worker] No Google account for user ${userId}, skipping style analysis.`);
        return;
      }
      console.log(`[worker] Fetching sent emails for user ${userId}...`);
      const sentEmails = await fetchSentEmails(
        account.access_token,
        account.refresh_token,
        30
      );
      if (sentEmails.length === 0) {
        console.warn(`[worker] No sent emails found for user ${userId}, skipping.`);
        return;
      }
      console.log(`[worker] Analyzing writing style from ${sentEmails.length} sent emails...`);
      const { styleSummary } = await analyzeWritingStyle(
        sentEmails.map((e) => `Subject: ${e.subject}

${e.body}`)
      );
      await prisma.user.update({
        where: { id: userId },
        data: {
          writingStyle: styleSummary,
          styleAnalyzedAt: /* @__PURE__ */ new Date()
        }
      });
      console.log(`[worker] \u2705 Writing style saved for user ${userId}: "${styleSummary.slice(0, 80)}..."`);
    } else if (type === "generate-embedding") {
      const { emailId } = payload;
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, body: true, snippet: true }
      });
      if (!email) {
        console.warn(`[worker] Email ${emailId} not found for embedding, skipping.`);
        return;
      }
      const rawText = `${(_o = email.subject) != null ? _o : ""} ${(_q = (_p = email.body) != null ? _p : email.snippet) != null ? _q : ""}`;
      const cleanText = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (cleanText.length < 10) {
        console.warn(`[worker] Email ${emailId} has no usable text for embedding, skipping.`);
        return;
      }
      const vector = await generateEmbedding(cleanText);
      const vectorStr = `[${vector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE emails
        SET embedding = ${vectorStr}::vector
        WHERE id = ${emailId}
      `;
      console.log(`[worker] \u2705 Embedding generated for email ${emailId} (${vector.length} dims)`);
    } else {
      console.warn(`[worker] Unknown job type: ${type}`);
    }
  },
  {
    connection,
    // The Gemini free tier caps generateContent at 15 requests/minute per model
    // (categorize-email and extract-tasks both call it). Concurrency 3 blew through
    // that instantly on a backlog, and jobs exhausted their retry attempts (see
    // queue.ts) faster than Google's ~60s cooldown, landing in "failed" permanently
    // instead of eventually succeeding. concurrency: 1 keeps this comfortably under
    // the free-tier ceiling; bump it back up once on a paid tier with real quota.
    concurrency: 1
  }
);
worker.on("completed", (job) => {
  console.log(`[worker] \u2705 Job ${job.id} (${job.data.type}) completed`);
});
worker.on("failed", (job, err) => {
  console.error(`[worker] \u274C Job ${job == null ? void 0 : job.id} failed:`, err.message);
});
worker.on("error", (err) => {
  console.error("[worker] Worker error:", err.message);
});
process.on("SIGINT", async () => {
  console.log("[worker] Shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
var PORT = process.env.PORT || 8080;
import_http.default.createServer((req, res) => {
  res.writeHead(200);
  res.end("MailPilot Worker is healthy!");
}).listen(PORT, () => {
  console.log(`[worker] Dummy HTTP server listening on port ${PORT} (for Render health checks)`);
});
console.log("[worker] Ready. Waiting for jobs...");
