import { v4 as uuidv4 } from "uuid";
import {
  SQSEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { PurchasedIngredients, Recipe, Warehouse } from "../../interfaces";
import {
  fetchIngredientWithRetry,
  getInventory,
  updateInventory,
  updateOrder,
} from "../../utils/warehouseIngredient";
import { generateSHA256 } from "../../utils/strings";
import { Db } from "mongodb";
import { connectToDB } from "../../utils/mongo";

export default class WarehouseHandler {
  private static async connectDB(): Promise<Db> {
    console.info("Connecting to DB...");
    return connectToDB(process.env.DB_URL);
  }

  public static async getIngredients(event: SQSEvent): Promise<void> {
    try {
      const Messages = event.Records;
      if (!Messages) {
        console.error("statusCode: 204, No messages in the queue");
        throw new Error("statusCode: 204, No messages in the queue");
      }
      // Assuming the order details are passed from the sqs
      let order: Recipe = JSON.parse(Messages[0].body);
      console.info("Received order:", order);

      if (!order || !order.ingredients) {
        throw new Error("Invalid order format in the message");
      }

      await updateOrder(order._id);

      const currentInventory = await getInventory();
      const inventoryUpdates = [];

      for (let ingredient of order.ingredients) {
        const warehouseItem = currentInventory.find(
          (item) => item.ingredient === ingredient.name,
        );

        if (!warehouseItem) {
          throw new Error(
            `Ingredient ${ingredient.name} not found in inventory`,
          );
        }

        if (warehouseItem.quantity < ingredient.qty) {
          const amountNeeded = ingredient.qty - warehouseItem.quantity;
          const purchasedAmount = await fetchIngredientWithRetry(
            ingredient.name,
            amountNeeded,
          );
          inventoryUpdates.push({
            _id: warehouseItem._id,
            quantity: warehouseItem.quantity + purchasedAmount,
          });
        } else {
          inventoryUpdates.push({
            _id: warehouseItem._id,
            quantity: warehouseItem.quantity - ingredient.qty,
          });
        }
      }

      for (let index = 0; index < inventoryUpdates.length; index++) {
        const element = inventoryUpdates[index];
        await updateInventory(element._id, element.quantity);
      }
      console.info("Updating order: updateOrder");
      await updateOrder(order._id, "ready-for-kitchen");
      console.info("Sending message to SQS...");
      await SQSUtils.sendMessage(
        process.env.KITCHEN_COOK_QUEUE_URL,
        JSON.stringify(order),
        generateSHA256(uuidv4()),
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
      console.info("Done success 200");
    } catch (error) {
      console.error("Error in getIngredients:", error);
      throw new error();
    }
  }

  public static async listInventoryIngredients(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await WarehouseHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) || 1;
      const pageSize =
        parseInt(event.queryStringParameters?.pageSize, 10) || 10; // Changed from 'page' to 'pageSize'

      const skip = (page - 1) * pageSize;

      const results = await db
        .collection("warehouse")
        .find()
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const ingredients = results as unknown as Warehouse[];
      const totalCount = await db.collection("warehouse").countDocuments();

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: ingredients,
          metadata: { page, pageSize, total: totalCount },
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: error.message,
      };
    }
  }

  public static async listPurchasedIngredients(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await WarehouseHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) || 1;
      const pageSize =
        parseInt(event.queryStringParameters?.pageSize, 10) || 10; // Changed from 'page' to 'pageSize'

      const skip = (page - 1) * pageSize;

      const results = await db
        .collection("purchasedIngredients")
        .find()
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const ingredients = results as unknown as PurchasedIngredients[];
      const totalCount = await db
        .collection("purchasedIngredients")
        .countDocuments();

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: ingredients,
          metadata: { page, pageSize, total: totalCount },
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: error.message,
      };
    }
  }
}
