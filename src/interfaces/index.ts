export interface Ingredient {
  name: string;
  qty: number;
}

export interface Order {
  recipeName: string;
  ingredients: Ingredient[];
  status:
    | "new-order"
    | "in-preparation"
    | "waiting-for-ingredients"
    | "ready-for-kitchen"
    | "done";
  createDate: Date;
  updateDate: Date;
}

export interface Recipe {
  name: string;
  ingredients: Ingredient[];
}

export interface Warehouse {
  quantity: number;
  ingredient: string;
}
