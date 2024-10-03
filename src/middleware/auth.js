import crypto from "crypto";

const hashSalt = process.env.VITE_HASH_SALT;

if (!hashSalt) {
  throw new Error("Hash salt not defined in .env file");
} else {
  console.log(`auth.js: Hash salt is ${hashSalt.length} chars`);
}

function generateTimeHash() {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];
  const hour = now.getUTCHours().toString().padStart(2, "0");
  const timeString = `${dateString}${hour}`;

  const hash = crypto.createHash("sha256");
  hash.update(timeString + hashSalt);

  return hash.digest("hex").substring(0, 8);
}

function validateTimeHash(hash) {
  const now = new Date();
  const currentHash = generateTimeHash();

  if (hash === currentHash) {
    return true;
  }

  now.setMinutes(now.getMinutes() - 1);
  const previousHash = generateTimeHash();

  return hash === previousHash;
}

export const validateApiKey = (req, res, next) => {
  const urlParts = req.url.split("/");
  const fullApiKey = urlParts[1];

  const [apiKey, timeHash] = fullApiKey.split("-");

  const validPattern = /^(?=.*[!$^*_])(?!.*[92])[A-Za-z0-8!$^*\-_.~]{15}$/;

  if (
    apiKey &&
    timeHash &&
    validPattern.test(apiKey) &&
    validateTimeHash(timeHash)
  ) {
    req.url = "/" + urlParts.slice(2).join("/");
    next();
  } else {
    res.status(401).json({ error: "Invalid API key" });
  }
};
