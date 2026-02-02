import { onRequestDelete as __api_photos__id__delete_ts_onRequestDelete } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\[id]\\delete.ts"
import { onRequestPut as __api_photos__id__update_ts_onRequestPut } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\[id]\\update.ts"
import { onRequestPost as __api_auth_login_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\login.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\me.ts"
import { onRequestPost as __api_auth_refresh_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\refresh.ts"
import { onRequestPost as __api_auth_register_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\auth\\register.ts"
import { onRequestPost as __api_cart_calculate_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\cart\\calculate.ts"
import { onRequestGet as __api_photos_image_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\image.ts"
import { onRequestPost as __api_photos_upload_ts_onRequestPost } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\upload.ts"
import { onRequestGet as __api_products_pricing_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\products\\pricing.ts"
import { onRequestGet as __api_categories__id__ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\categories\\[id].ts"
import { onRequestGet as __api_photos__id__ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\[id].ts"
import { onRequestGet as __api_categories_index_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\categories\\index.ts"
import { onRequestGet as __api_health_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\health.ts"
import { onRequestGet as __api_photos_index_ts_onRequestGet } from "C:\\GitHub\\adrian-photos-web\\functions\\api\\photos\\index.ts"
import { onRequest as ___middleware_ts_onRequest } from "C:\\GitHub\\adrian-photos-web\\functions\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/photos/:id/delete",
      mountPath: "/api/photos/:id",
      method: "DELETE",
      middlewares: [],
      modules: [__api_photos__id__delete_ts_onRequestDelete],
    },
  {
      routePath: "/api/photos/:id/update",
      mountPath: "/api/photos/:id",
      method: "PUT",
      middlewares: [],
      modules: [__api_photos__id__update_ts_onRequestPut],
    },
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
      routePath: "/api/cart/calculate",
      mountPath: "/api/cart",
      method: "POST",
      middlewares: [],
      modules: [__api_cart_calculate_ts_onRequestPost],
    },
  {
      routePath: "/api/photos/image",
      mountPath: "/api/photos",
      method: "GET",
      middlewares: [],
      modules: [__api_photos_image_ts_onRequestGet],
    },
  {
      routePath: "/api/photos/upload",
      mountPath: "/api/photos",
      method: "POST",
      middlewares: [],
      modules: [__api_photos_upload_ts_onRequestPost],
    },
  {
      routePath: "/api/products/pricing",
      mountPath: "/api/products",
      method: "GET",
      middlewares: [],
      modules: [__api_products_pricing_ts_onRequestGet],
    },
  {
      routePath: "/api/categories/:id",
      mountPath: "/api/categories",
      method: "GET",
      middlewares: [],
      modules: [__api_categories__id__ts_onRequestGet],
    },
  {
      routePath: "/api/photos/:id",
      mountPath: "/api/photos",
      method: "GET",
      middlewares: [],
      modules: [__api_photos__id__ts_onRequestGet],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api/categories",
      method: "GET",
      middlewares: [],
      modules: [__api_categories_index_ts_onRequestGet],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_ts_onRequestGet],
    },
  {
      routePath: "/api/photos",
      mountPath: "/api/photos",
      method: "GET",
      middlewares: [],
      modules: [__api_photos_index_ts_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]