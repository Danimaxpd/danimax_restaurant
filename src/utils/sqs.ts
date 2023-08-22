import {
  SendMessageCommand,
  SQSClient,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";

export default class SQSUtils {
  private static _sqsClient(): SQSClient {
    return new SQSClient({
      apiVersion: "latest",
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  public static async sendMessage(
    queueUrl: string,
    messageBody: string,
    MessageGroupId: string,
    MessageDeduplicationId: string,
    metadata?: any,
    isFifo: boolean = false,
  ): Promise<any> {
    const sqsClient = SQSUtils._sqsClient();

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      DelaySeconds: isFifo ? undefined : 10,
      MessageAttributes: metadata,
      MessageBody: messageBody,
      MessageGroupId: isFifo ? MessageGroupId : undefined,
      MessageDeduplicationId: isFifo ? MessageDeduplicationId : undefined,
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
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        MessageAttributeNames: ["All"],
        AttributeNames: ["SentTimestamp"],
        WaitTimeSeconds: 20,
      });
      console.log("Received messages:", command);
      const result = await sqsClient.send(command);
      return result;
    } catch (error) {
      console.error("Error receiving SQS message:", error);
      throw error;
    }
  }
}
