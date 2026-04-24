import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  if (process.env.NODE_ENV === "development") {
    throw new Error("Please add your Mongo URI to .env.local");
  } else {
    // In production/build, we don't want to crash the process at the top level.
    // We'll create a promise that only throws when actually awaited.
    clientPromise = (async () => {
      // During Next.js build, this might be evaluated. 
      // If we are in the middle of a build, we just return a "never" promise or similar 
      // to prevent the build worker from crashing on a top-level rejection.
      console.warn("MONGODB_URI is missing during build/runtime. MongoDB features will fail.");
      throw new Error("MONGODB_URI is missing");
    })();
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
