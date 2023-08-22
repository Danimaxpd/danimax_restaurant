import {
  SendMessageCommand,
  SQSClient,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";

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
    MessageDeduplicationId: string,
    metadata?: any,
  ): Promise<any> {
    const sqsClient = SQSUtils._sqsClient();

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageAttributes: metadata,
      MessageBody: messageBody,
      MessageGroupId,
      MessageDeduplicationId,
    });

    try {
      return await sqsClient.send(command);
    } catch (error) {
      console.error("Error sending SQS message:", error);
      throw error;
    }
  }

  public static async receiveMessage(queueUrl: string): Promise<any> {
    const sqsClient = SQSUtils._sqsClient();
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      AttributeNames: ["MessageGroupId"],
      MessageAttributeNames: ["Messsages"],
      VisibilityTimeout: 20,
      WaitTimeSeconds: 0,
    });
    try {
      const result = await sqsClient.send(command);
      console.log("Received messages:", result);
      console.log("Received messages--->>", result.Messages);
      return result;
    } catch (error) {
      console.error("Error receiving SQS message:", error);
      throw error;
    }
  }
}
