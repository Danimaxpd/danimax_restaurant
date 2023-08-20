import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

export default class SQSUtils {
  private static _sqsClient() {
    return new SQSClient({
      apiVersion: "latest",
      region: process.env.AWS_REGION,
    });
  }

  public static async sendMessage(
    queueUrl: string,
    messageBody: string,
    MessageGroupId: string,
    metadata?: any,
  ): Promise<any> {
    const sqsClient = SQSUtils._sqsClient();

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageAttributes: metadata,
      MessageBody: messageBody,
      MessageGroupId,
    });

    return sqsClient.send(command);
  }
}
