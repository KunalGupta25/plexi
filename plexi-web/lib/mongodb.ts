import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  if (process.env.NODE_ENV === "development") {
    throw new Error("Please add your Mongo URI to .env.local");
  } else {
    // In production/build, we don't want to crash. 
    // But we also can't create a client.
    // We'll create a promise that rejects only when awaited.
    clientPromise = Promise.reject(new Error("MONGODB_URI is missing"));
    console.warn("MONGODB_URI is missing. MongoDB features will be unavailable.");
  }
} else {
  if (process.env.NODE_ENV === "development") {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(uri, options);
      (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
