import { onRequestPost as __api_auth_login_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\login.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\me.ts"
import { onRequestPost as __api_auth_refresh_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\refresh.ts"
import { onRequestPost as __api_auth_register_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\register.ts"
import { onRequestGet as __api_products_pricing_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\products\\pricing.ts"
import { onRequestGet as __api_categories_index_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\categories\\index.ts"
import { onRequest as ___middleware_ts_onRequest } from "C:\\GitHub\\adrian-photos-web\\functions\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/refresh",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_refresh_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_ts_onRequestPost],
    },
  {
      routePath: "/api/products/pricing",
      mountPath: "/api/products",
      method: "GET",
      middlewares: [],
      modules: [__api_products_pricing_ts_onRequestGet],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api/categories",
      method: "GET",
      middlewares: [],
      modules: [__api_categories_index_ts_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]