import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export default class OrdersHandler {
  public static async createOrder(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "AAAA",
    };
    const { variable }: any = event.body;

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }
}
