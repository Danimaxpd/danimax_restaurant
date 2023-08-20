const middy = require("@middy/core");

import "reflect-metadata";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpSecurityHeaders from "@middy/http-security-headers";

import { WarehouseHandler, OrdersHandler } from "./endpoints";

// warehouse functions handlers
const handler = middy(WarehouseHandler.getIngredients)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

// Kitchen functions handlers
const orders_Handler = middy(OrdersHandler.createOrder)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

const list_orders_Handler = middy(OrdersHandler.listOrdersHandler)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

const list_Current_ordersHandler = middy(OrdersHandler.listCurrentOrdersHandler)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

module.exports = {
  handler,
  orders_Handler,
  list_orders_Handler,
  list_Current_ordersHandler,
};
