require("dotenv").config();

import { connectToDB } from "./mongo";
import { Recipe } from "../interfaces";

export const getRandomRecipe = async () => {
  const db = await connectToDB(process.env.MONGODB_URI);

  const results = await db
    .collection("recipes")
    .aggregate([
      {
        $sample: { size: 1 },
      },
    ])
    .toArray();

  const randomRecipe = results[0] as Recipe; // Explicit type assertion

  // Handle case when there are no recipes in the collection
  if (!randomRecipe) {
    throw new Error("No recipes found in the collection");
  }

  return randomRecipe;
};
