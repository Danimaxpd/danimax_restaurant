import { APIGatewayProxyResult } from "aws-lambda";

export default class WarehouseHandler {
  public static async getIngredients(): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "",
    };

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
