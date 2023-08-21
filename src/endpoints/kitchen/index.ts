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
import { Order } from "src/interfaces";
import { ObjectId } from "mongodb";

export default class OrdersHandler {
  public static async cookOrder(context: Context) {
    // wait for the event loop to be empty before ending the lambda function
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDB(process.env.DB_URL);

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

  public static async createOrder(
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    // wait for the event loop to be empty before ending the lambda function
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDB(process.env.DB_URL);

    try {
      const randomRecipeData = await getRandomRecipe();
      const recipeData = {
        ...randomRecipeData,
        status: "new-order",
        createDate: new Date(),
        updateDate: new Date(),
      };
      const order = await db.collection("orders").insertOne(recipeData);
      const response = {
        result: "success",
        message: order,
      };

      SQSUtils.sendMessage(
        process.env.WAREHOUSE_QUEUE_URL,
        JSON.stringify({
          MessageGroupId: "warehouse",
          MessageDeduplicationId: uuidv4(),
          MessageBody: JSON.stringify(order),
        }),
        "warehouse",
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
      return {
        statusCode: 201,
        body: JSON.stringify(response),
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
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    // wait for the event loop to be empty before ending the lambda function
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDB(process.env.DB_URL);
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
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    // wait for the event loop to be empty before ending the lambda function
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDB(process.env.DB_URL);
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
