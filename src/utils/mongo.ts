// src/mongo.ts

import { MongoClient, Db } from "mongodb";

let db: Db | null = null;

export async function connectToDB(uri: string): Promise<Db> {
  if (!db) {
    const client = await MongoClient.connect(uri, {
      retryWrites: true,
      w: "majority",
    });

    db = client.db();
  }

  return db;
}
