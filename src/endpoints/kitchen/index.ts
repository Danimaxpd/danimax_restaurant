require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  SQSEvent,
} from "aws-lambda";
import { ObjectId, Db } from "mongodb";

import SQSUtils from "../../utils/sqs";
import { connectToDB } from "../../utils/mongo";
import { getRandomRecipe } from "../../utils/randomRecipe";
import { Order, ParsedBodyEvent, Recipe } from "../../interfaces";
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
    const uuid = uuidv4();
    delete randomRecipeData._id;
    const recipeData = {
      ...randomRecipeData,
      status: "new-order",
      uuid,
      createDate: new Date(),
      updateDate: new Date(),
    };

    console.info("Inserting order into DB...");
    const result = db
      .collection("orders")
      .updateOne({ uuid }, { $set: recipeData }, { upsert: true });
    return { ...result, ...randomRecipeData };
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
        body: error.message,
      };
    }
  }

  public static async cookOrder(event: SQSEvent): Promise<void> {
    const db = await OrdersHandler.connectDB();

    try {
      const Messages = event.Records;
      if (!Messages) {
        console.error("statusCode: 204, No messages in the queue");
        throw new Error("statusCode: 204, No messages in the queue");
      }

      console.log("Messages", Messages);
      let order: Recipe = JSON.parse(Messages[0].body);
      const orderId = order._id;
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
        console.error("Order not found");
        throw new Error("Order not found");
      }

      console.log("Cook order: result:", result);
    } catch (error) {
      console.error("Error in cookOrder:", error);
      throw new error();
    }
  }

  public static async listOrdersHandler(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await OrdersHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) || 1;
      const pageSize =
        parseInt(event.queryStringParameters?.pageSize, 10) || 10;

      const skip = (page - 1) * pageSize;

      const results = await db
        .collection("orders")
        .find()
        .sort({ updateDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const orders = results as unknown as Order[];
      const totalCount = await db.collection("orders").countDocuments();

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: orders,
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

  public static async listCurrentOrdersHandler(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await OrdersHandler.connectDB();
    try {
      const page = parseInt(event.queryStringParameters?.page, 10) || 1;
      const pageSize =
        parseInt(event.queryStringParameters?.pageSize, 10) || 10;

      const skip = (page - 1) * pageSize;
      const filter = {
        status: { $nin: ["done", "new-order"] }, // not in done or new-order
      };

      const results = await db
        .collection("orders")
        .find(filter)
        .sort({ updateDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const orders = results as unknown as Order[];
      const totalCount = await db.collection("orders").countDocuments(filter);

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: orders,
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

  public static async reProcessOrder(
    event: ParsedBodyEvent,
  ): Promise<APIGatewayProxyResult> {
    const db = await OrdersHandler.connectDB();
    try {
      const orderId = event.body.orderId;
      if (!orderId) {
        throw new Error("Invalid order id");
      }

      const result = await db.collection("orders").findOne({
        _id: new ObjectId(orderId),
      });

      if (!result) {
        throw new Error("Order not found");
      }

      const order = result as unknown as Order;

      await OrdersHandler.sendOrderToSQS(order);

      return {
        statusCode: 201,
        body: JSON.stringify({
          data: order,
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
