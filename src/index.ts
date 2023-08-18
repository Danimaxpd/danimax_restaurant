const middy = require("@middy/core");

import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpSecurityHeaders from "@middy/http-security-headers";

import { BaseHandler, OrdersHandler } from "./endpoints";

const handler = middy(BaseHandler.baseHandler)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

const ordersHandler = middy(OrdersHandler.createOrder)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

module.exports = { handler, ordersHandler };
