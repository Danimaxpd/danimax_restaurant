import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyResult } from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { Order } from "../../interfaces";
import {
  fetchIngredientWithRetry,
  getInventory,
  updateInventory,
} from "../../utils/warehouseIngredient";
import { generateSHA256 } from "../../utils/strings";

export default class WarehouseHandler {
  public static async getIngredients(): Promise<APIGatewayProxyResult> {
    try {
      await SQSUtils.sendMessage(
        process.env.WAREHOUSE_QUEUE_URL,
        JSON.stringify("jajajajajajaj"),
        "warehouse",
        generateSHA256(uuidv4()),
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
      const { Messages } = await SQSUtils.receiveMessage(
        process.env.WAREHOUSE_QUEUE_URL,
      );

      console.debug(Messages);

      if (!Messages) {
        console.warn("No messages in the queue");
        return {
          statusCode: 204,
          body: "No messages in the queue",
        };
      }

      console.info("Received Messages:", Messages);

      // Assuming the order details are passed from the sqs
      let order: Order = JSON.parse(Messages[0].Body);

      // Validate order structure before proceeding (can be improved further)
      if (!order || !order.ingredients) {
        throw new Error("Invalid order format in the message");
      }

      const currentInventory = await getInventory();

      const inventoryUpdates = [];

      for (let ingredient of order.ingredients) {
        const warehouseItem = currentInventory.find(
          (item) => item.ingredient === ingredient.name,
        );

        if (!warehouseItem) {
          throw new Error(
            `Ingredient ${ingredient.name} not found in inventory`,
          );
        }

        if (warehouseItem.quantity < ingredient.qty) {
          const amountNeeded = ingredient.qty - warehouseItem.quantity;
          const purchasedAmount = await fetchIngredientWithRetry(
            ingredient.name,
            amountNeeded,
          );
          inventoryUpdates.push({
            _id: warehouseItem._id,
            quantity: warehouseItem.quantity + purchasedAmount,
          });
        } else {
          inventoryUpdates.push({
            _id: warehouseItem._id,
            quantity: warehouseItem.quantity - ingredient.qty,
          });
        }
      }

      for (let index = 0; index < inventoryUpdates.length; index++) {
        const element = inventoryUpdates[index];
        await updateInventory(element._id, element.quantity);
      }
      order.status = "ready-for-kitchen";
      order.updateDate = new Date();

      await SQSUtils.sendMessage(
        process.env.KITCHEN_COOK_QUEUE_URL,
        JSON.stringify({
          MessageGroupId: "kitchen",
          MessageBody: JSON.stringify(order),
        }),
        generateSHA256(uuidv4()),
        "kitchen",
        {
          Title: {
            DataType: "String",
            StringValue: "kitchen_order",
          },
          Author: {
            DataType: "String",
            StringValue: "warehouse",
          },
        },
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ result: "success" }),
      };
    } catch (error) {
      console.error("Error in getIngredients:", error);
      return {
        statusCode: 500,
        body: "Internal Server Error", // Send a generic message to the client, don't expose the raw error
      };
    }
  }
}
