require("dotenv").config();

import querystring from "node:querystring";
import { connectToDB } from "./mongo";
import { Order, PurchasedIngredients, Warehouse } from "../interfaces";
import { ObjectId, Db } from "mongodb";
import axios from "axios";

const MAX_RETRIES = 5;
const buyIngredientsUrl =
  process.env.APP_BUY_INGREDIENTS ||
  "https://recruitment.alegra.com/api/farmers-market/buy";

const connectDB = async (): Promise<Db> => {
  console.info("Connecting to DB...");
  return connectToDB(process.env.DB_URL);
};

export const getInventory = async () => {
  const db = await connectDB();

  const results = await db.collection("warehouse").find().toArray();

  const warehouseInventory = results as unknown as Warehouse[]; // Explicit type assertion

  if (!warehouseInventory) {
    throw new Error("No recipes found in the collection");
  }

  return warehouseInventory;
};

export const updateOrder = async (
  orderId: ObjectId,
  status: string = "ready-for-kitchen",
) => {
  const db = await connectDB();

  const results = await db.collection("orders").updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        status,
        updateDate: new Date(),
      },
    },
  );

  const order = results as unknown as Order; // Explicit type assertion

  if (!order) {
    throw new Error("No Order found in the collection");
  }

  return order;
};

export const updateInventory = async (orderId: ObjectId, quantity: number) => {
  const db = await connectDB();

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

export const insertPurchasedIngredient = async (
  ingredient: PurchasedIngredients,
): Promise<PurchasedIngredients> => {
  const db = await connectDB();

  ingredient.createDate = new Date();
  ingredient.updateDate = new Date();

  const result = await db
    .collection("purchasedIngredients")
    .insertOne(ingredient);

  if (!result.insertedId) {
    throw new Error("Failed to insert the purchased ingredient");
  }

  return {
    _id: result.insertedId,
    ...ingredient,
  };
};

/**
 * Sleep for n milliseconds
 * @param ms number of milliseconds
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch ingredient with retry logic using exponential backoff and jitter.
 * @param ingredientName Name of the ingredient
 * @param quantity Quantity needed
 */
export async function fetchIngredientWithRetry(
  ingredientName: string,
  quantity: number,
): Promise<number> {
  let retries: number = 0;
  let error: Error | null = null;
  let purchasedIngredient: number = 0;
  const requestQuery = querystring.stringify({ ingredient: ingredientName });
  const url = `${buyIngredientsUrl}?` + requestQuery;

  console.info("fetching Ingredients With Retry url", url);

  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.get(url);

      if (response.data.quantitySold > 0) {
        purchasedIngredient += response.data.quantitySold;
      }

      if (purchasedIngredient >= quantity) {
        await insertPurchasedIngredient({
          ingredientName,
          quantitySold: purchasedIngredient,
        });
        return purchasedIngredient;
      }
    } catch (err) {
      error = err;
    }

    // Exponential backoff with jitter
    const delay = Math.pow(2, retries) * 1000; // 2^retries * 1000 milliseconds
    const jitter = Math.random() * 1000; // Randomness between 0 and 1000 milliseconds
    await sleep(delay + jitter);

    retries++;
  }

  throw new Error(
    `Failed to fetch ingredient ${ingredientName} after ${MAX_RETRIES} attempts: ${error.message}`,
  );
}
