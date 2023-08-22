require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";

import SQSUtils from "../../utils/sqs";
import { connectToDB } from "../../utils/mongo";
import { getRandomRecipe } from "../../utils/randomRecipe";
import { Order } from "../../interfaces";
import { generateSHA256 } from "../../utils/strings";

export default class OrdersHandler {
  private static async connectDB(): Promise<Db> {
    console.info("Connecting to DB...");
    return connectToDB(process.env.DB_URL);
  }

  private static async createNewOrderInDB(
    db: Db,
    randomRecipeData: any,
  ): Promise<any> {
    const recipeData = {
      ...randomRecipeData,
      status: "new-order",
      uuid: uuidv4(),
      createDate: new Date(),
      updateDate: new Date(),
    };

    console.info("Inserting order into DB...");
    return db.collection("orders").insertOne(recipeData);
  }

  private static async sendOrderToSQS(order: any) {
    console.info("Sending message to SQS...");
    await SQSUtils.sendMessage(
      process.env.WAREHOUSE_QUEUE_URL,
      JSON.stringify(order),
      "warehouse",
      generateSHA256(uuidv4()),
      {
        Title: {
          DataType: "String",
          StringValue: "warehouse_order",
        },
        Author: {
          DataType: "String",
          StringValue: "kitchen",
        },
      },
    );
  }

  public static async createOrder(): Promise<APIGatewayProxyResult> {
    try {
      const db = await OrdersHandler.connectDB();
      const randomRecipeData = await getRandomRecipe();
      const order = await OrdersHandler.createNewOrderInDB(
        db,
        randomRecipeData,
      );
      console.log("Create order: order:", order);
      await OrdersHandler.sendOrderToSQS(order);

      const response = {
        result: "success",
        message: order,
      };

      return {
        statusCode: 201,
        body: JSON.stringify(response),
      };
    } catch (error) {
      console.error("Error in createOrder:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" }), // It's usually not a good practice to send raw error messages to the client. Use a generic message instead.
      };
    }
  }

  public static async cookOrder() {
    const db = await OrdersHandler.connectDB();

    try {
      const { Messages } = await SQSUtils.receiveMessage(
        process.env.KITCHEN_QUEUE_URL,
      );

      if (!Messages) {
        throw new Error("No messages in the queue");
      }

      console.log("Messages", Messages);
      const orderId = 1;
      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: "done",
            updateDate: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Order not found." }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Order updated successfully." }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: error.message,
      };
    }
  }

  public static async listOrdersHandler(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await OrdersHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) | 1;
      const pageSize = parseInt(event.queryStringParameters?.page, 10) | 10;

      const skip = (page - 1) * pageSize;

      const results = await db
        .collection("orders")
        .find()
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const orders = results as unknown as Order[];

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: orders,
          metadata: { page, pageSize: skip },
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: error.message,
      };
    }
  }

  public static async listCurrentOrdersHandler(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await OrdersHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) | 1;
      const pageSize = parseInt(event.queryStringParameters?.page, 10) | 10;

      const skip = (page - 1) * pageSize;
      const filter = {
        status: { $ne: "done" }, // Not equal to "done"
      };

      const results = await db
        .collection("orders")
        .find(filter)
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const orders = results as unknown as Order[];

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: orders,
          metadata: { page, pageSize: skip },
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
