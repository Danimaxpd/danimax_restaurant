require("dotenv").config();

import { connectToDB } from "./mongo";
import { Warehouse } from "../interfaces";
import { ObjectId } from "mongodb";

export const getInventory = async () => {
  const db = await connectToDB(process.env.MONGODB_URI);

  const results = await db.collection("warehouse").find().toArray();

  const warehouseInventory = results as unknown as Warehouse; // Explicit type assertion

  if (!warehouseInventory) {
    throw new Error("No recipes found in the collection");
  }

  return warehouseInventory;
};

export const updateInventory = async (orderId: ObjectId, quantity: number) => {
  const db = await connectToDB(process.env.MONGODB_URI);

  const results = await db.collection("warehouse").updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        quantity,
      },
    },
  );

  const warehouseInventory = results as unknown as Warehouse; // Explicit type assertion

  if (!warehouseInventory) {
    throw new Error("No inventory found in the collection");
  }

  return warehouseInventory;
};
