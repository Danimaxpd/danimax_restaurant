import { ObjectId } from "mongodb";

export interface Ingredient {
  name: string;
  qty: number;
}

export interface Order {
  recipeName: string;
  ingredients: Ingredient[];
  status: "new-order" | "ready-for-kitchen" | "in-preparation" | "done";
  createDate: Date;
  updateDate: Date;
}

export interface Recipe {
  name: string;
  ingredients: Ingredient[];
}

export interface Warehouse {
  _id?: ObjectId; // MongoDB ObjectId
  quantity: number;
  ingredient: string;
}
