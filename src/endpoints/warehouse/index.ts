import { v4 as uuidv4 } from "uuid";
import { SQSEvent } from "aws-lambda";
import SQSUtils from "../../utils/sqs";
import { Recipe } from "../../interfaces";
import {
  fetchIngredientWithRetry,
  getInventory,
  updateInventory,
  updateOrder,
} from "../../utils/warehouseIngredient";
import { generateSHA256 } from "../../utils/strings";

export default class WarehouseHandler {
  public static async getIngredients(event: SQSEvent): Promise<void> {
    try {
      const Messages = event.Records;
      if (!Messages) {
        console.error("statusCode: 204, No messages in the queue");
        throw new Error("statusCode: 204, No messages in the queue");
      }
      // Assuming the order details are passed from the sqs
      let order: Recipe = JSON.parse(Messages[0].body);
      console.info("Received order:", order);

      if (!order || !order.ingredients) {
        throw new Error("Invalid order format in the message");
      }

      await updateOrder(order._id);

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
      console.info("Updating order: updateOrder");
      await updateOrder(order._id, "ready-for-kitchen");
      console.info("Sending message to SQS...");
      await SQSUtils.sendMessage(
        process.env.KITCHEN_COOK_QUEUE_URL,
        JSON.stringify(order),
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
      console.info("Done success 200");
    } catch (error) {
      console.error("Error in getIngredients:", error);
      throw new error();
    }
  }
}
