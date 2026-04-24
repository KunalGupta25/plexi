import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI && process.env.NODE_ENV !== "development") {
  // During build time on some CI platforms, we might not have the URI yet.
  // We'll let it fail gracefully or throw only when used.
  console.warn("MONGODB_URI is missing. MongoDB features will be unavailable.");
}

if (process.env.NODE_ENV === "development") {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add your Mongo URI to .env.local");
  }
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
