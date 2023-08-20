require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyResult } from "aws-lambda";
import SQSUtils from "../../utils/sqs";

export default class OrdersHandler {
  public static async createOrder(): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "Order generated successfully",
    };
    SQSUtils.sendMessage(
      process.env.WAREHOUSE_QUEUE_URL,
      JSON.stringify({
        MessageGroupId: "warehouse",
        MessageDeduplicationId: uuidv4(),
        MessageBody: `${new Date().toISOString()} - warehouse_order}`,
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
      }
    );
    return {
      statusCode: 201,
      body: JSON.stringify(response),
    };
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
