require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import {
  APIGatewayProxyResult,
  Context,
  APIGatewayProxyEvent,
} from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { connectToDB } from "../../utils/mongo";
import { getRandomRecipe } from "src/utils/randomRecipe";
import { Ingredient, Warehouse } from "src/interfaces";
import { ObjectId } from "mongodb";
import { getInventory, updateInventory } from "../../utils/warehouseIngredient";

export default class WarehouseHandler {
  public static async getIngredients(
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "",
    };
    // getInventory()
    // base on the request try to complete the recipe and discount the inventory from the warehouse
    // if the inventory is not enough, get new items from https://recruitment.alegra.com/api/farmers-market/buy body {ingredient: quantity} the response is quanitySold if the value is more thant 0 means is sucessfully but if is zero means is not available so you need implement a retry logic
    // if the inventory is enough, update the inventory and send a message to the kitchen queue
    try {
      // From sqs queue

      const response = {
        result: "success",
        message: "",
      };

      // Get current inventory
      const currentInventory = await getInventory();

      // Assuming the order details are passed in the event body
      const order: Order = JSON.parse(context.body);
      const ingredientsNeeded = order.ingredients;

      // Check if there's enough inventory for each ingredient
      for (let ingredient of ingredientsNeeded) {
        const warehouseItem = currentInventory.find(
          (item) => item.ingredient === ingredient.name,
        );

        if (warehouseItem?.quantity < ingredient.qty) {
          // If not enough, try to buy from API
          const { data } = await axios.post(
            "https://recruitment.alegra.com/api/farmers-market/buy",
            {
              ingredient: ingredient.name,
              quantity: ingredient.qty - warehouseItem?.quantity,
            },
          );

          // If buy is not successful, retry or fail the request
          if (data.quantitySold === 0) {
            response.result = "failure";
            response.message = `Failed to buy ${ingredient.name}`;
            return {
              statusCode: 400,
              body: JSON.stringify(response),
            };
          }

          // Update inventory with bought items
          await updateInventory(
            warehouseItem._id,
            warehouseItem.quantity + data.quantitySold,
          );
        } else {
          // Deduct from inventory if there's enough
          await updateInventory(
            warehouseItem._id,
            warehouseItem.quantity - ingredient.qty,
          );
        }
      }

      // Send message to kitchen queue (not implemented in this example, but you can use AWS SQS or another messaging system)
    } catch (error) {}
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  public static async listOrders(): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: [],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }
}
