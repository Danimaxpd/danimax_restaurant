require("dotenv").config();

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SQSUtils from "../../utils/sqs";

export default class OrdersHandler {
  public static async createOrder(
    event: APIGatewayProxyEvent,
    context,
    { signal }
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "",
    };
    console.debug(process.env);
    console.debug(process.env.WAREHOUSE_QUEUE_URL);
    console.log("QUEUE URL: ", process.env.WAREHOUSE_QUEUE_URL);
    SQSUtils.sendMessage(
      process.env.WAREHOUSE_QUEUE_URL,
      JSON.stringify({
        MessageGroupId: "warehouse",
        MessageDeduplicationId: "warehouse",
        MessageBody: "warehouse aaaa",
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
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  public static async listOrdersHandler(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: [],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  public static async listCurrentOrdersHandler(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
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
