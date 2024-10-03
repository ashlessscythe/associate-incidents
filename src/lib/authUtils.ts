const symbols = "!$*_";
const hashSalt = import.meta.env.VITE_HASH_SALT;

if (!hashSalt) {
  throw new Error("HASH_SALT is not defined in .env file");
} else {
  console.log(`authUtils.ts: hash is ${hashSalt.length} chars`);
}

// Function to generate API key
export async function generateApiKey(): Promise<string> {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01345678";
  let result = "";

  // Generate 14 random alphanumeric characters
  const randomValues = new Uint8Array(14);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 14; i++) {
    result += characters[randomValues[i] % characters.length];
  }

  // Add one random symbol from the safe pool
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];

  // Insert the symbol at a random position in the string
  const insertPosition = Math.floor(Math.random() * result.length);
  result =
    result.slice(0, insertPosition) +
    randomSymbol +
    result.slice(insertPosition);

  // Generate time-based hash
  const timeHash = await generateTimeHash();

  // Combine API key with time hash
  return `${result}-${timeHash}`;
}

async function generateTimeHash(): Promise<string> {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];
  const hour = now.getUTCHours().toString().padStart(2, "0");

  const timeString = `${dateString}${hour}`;

  // Create hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(timeString + hashSalt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return first 8 characters of the hash
  return hashHex.substring(0, 8);
}

// Function to get and cache the API key
let cachedApiKey: string | null = null;
let lastGeneratedTime: number = 0;
const API_KEY_LIFETIME = 60000; // 1 minute in milliseconds

export async function getApiKey(): Promise<string> {
  const now = Date.now();
  if (!cachedApiKey || now - lastGeneratedTime > API_KEY_LIFETIME) {
    cachedApiKey = await generateApiKey();
    lastGeneratedTime = now;
  }
  return cachedApiKey;
}