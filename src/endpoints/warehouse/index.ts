import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
} from "aws-lambda";

export default class WarehouseHandler {
  public static async getIngredients(
    event: SQSEvent
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "",
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  public static async listOrders(
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
