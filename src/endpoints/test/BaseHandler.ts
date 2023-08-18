import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export default class BaseHandler {
  public static async baseHandler(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const response = {
      result: "success",
      message: "payment processed correctly",
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }
}
