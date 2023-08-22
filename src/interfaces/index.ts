import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { ObjectId } from "mongodb";

export interface Ingredient {
  name: string;
  qty: number;
}

export interface Order {
  recipeName: string;
  ingredients: Ingredient[];
  uuid: string;
  status: "new-order" | "ready-for-kitchen" | "in-preparation" | "done";
  createDate: Date;
  updateDate: Date;
}

export interface Recipe {
  _id?: ObjectId; // MongoDB ObjectId
  name: string;
  ingredients: Ingredient[];
}

export interface Warehouse {
  _id?: ObjectId; // MongoDB ObjectId
  quantity: number;
  ingredient: string;
}

export type ParsedBodyEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: {
    orderId: string;
    [key: string]: any;
  };
};
