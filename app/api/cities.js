import { api } from "./client";

export function searchCities(search) {
  return api.get("/cities", search ? { search } : undefined);
}