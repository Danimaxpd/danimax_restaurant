require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { connectToDB } from "../../utils/mongo";
import { getRandomRecipe } from "src/utils/randomRecipe";

export default class OrdersHandler {
  public static async createOrder(
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    // wait for the event loop to be empty before ending the lambda function
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      const db = await connectToDB(process.env.DB_URL);
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
        statusCode: 400,
        body: error.message,
      };
    }
  }

  public static async listOrdersHandler(): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: [],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  public static async listCurrentOrdersHandler(): Promise<APIGatewayProxyResult> {
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
