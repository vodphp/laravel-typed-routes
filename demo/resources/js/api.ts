
/**
 * This puts together the client with the route types. Depending on where you 
 * publish the routes, and where this file is, you may need to adjust the import.
 * 
 */
import { Routes } from "./types/routes";
import { makeFullClient } from "../../vendor/vod/laravel-typed-routes/js/fullClient";
export const routes = makeFullClient<Routes>();