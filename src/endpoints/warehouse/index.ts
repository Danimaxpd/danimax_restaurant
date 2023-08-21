require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyResult } from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { Order } from "../../interfaces";
import {
  fetchIngredientWithRetry,
  getInventory,
  updateInventory,
} from "../../utils/warehouseIngredient";

export default class WarehouseHandler {
  public static async getIngredients(): Promise<APIGatewayProxyResult> {
    // getInventory()
    // base on the request try to complete the recipe and discount the inventory from the warehouse
    // if the inventory is not enough, get new items from https://recruitment.alegra.com/api/farmers-market/buy body {ingredient: quantity} the response is quanitySold if the value is more thant 0 means is sucessfully but if is zero means is not available so you need implement a retry logic
    // if the inventory is enough, update the inventory and send a message to the kitchen queue
    try {
      // From sqs queue
      const { Messages } = await SQSUtils.receiveMessage(
        process.env.WAREHOUSE_QUEUE_URL,
      );

      if (!Messages) {
        throw new Error("No messages in the queue");
      }

      console.log("Messages getIngredients", Messages);

      const response = {
        result: "success",
        message: "",
      };

      // Get current inventory
      const currentInventory = await getInventory();

      // Assuming the order details are passed from the sqs
      let order: Order = {
        recipeName: "xdd",
        ingredients: [
          {
            name: "apple",
            qty: 1,
          },
          {
            name: "banana",
            qty: 1,
          },
        ],
        status: "new-order",
        createDate: new Date(),
        updateDate: new Date(),
      };
      const ingredientsNeeded = order.ingredients;

      // Check if there's enough inventory for each ingredient
      for (let ingredient of ingredientsNeeded) {
        const warehouseItem = currentInventory.find(
          (item) => item.ingredient === ingredient.name,
        );

        if (warehouseItem?.quantity < ingredient.qty) {
          // If not enough, try to buy from API
          const data = await fetchIngredientWithRetry(
            ingredient.name,
            ingredient.qty,
            warehouseItem?.quantity,
          );

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

      order = {
        recipeName: "xdd",
        ingredients: [
          {
            name: "apple",
            qty: 1,
          },
          {
            name: "banana",
            qty: 1,
          },
        ],
        status: "ready-for-kitchen",
        createDate: new Date(),
        updateDate: new Date(),
      };
      // Send message to kitchen queue (not implemented in this example, but you can use AWS SQS or another messaging system)
      SQSUtils.sendMessage(
        process.env.KITCHEN_QUEUE_URL, // KITCHEN_COOK_QUEUE_URL
        JSON.stringify({
          MessageGroupId: "kitchen",
          MessageDeduplicationId: uuidv4(),
          MessageBody: JSON.stringify(order),
        }),
        "kitchen",
        {
          Title: {
            DataType: "String",
            StringValue: "kitchen_order",
          },
          Author: {
            DataType: "String",
            StringValue: "warehouse",
          },
        },
      );
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: error.message,
      };
    }
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
