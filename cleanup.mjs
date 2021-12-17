import { rm } from "fs/promises";
import { buildDirectory } from "./constants.mjs";

try {
  rm(buildDirectory, { recursive: true });
} catch (error) {
  console.error(error);
}
