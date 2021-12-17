import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);

const currentDirname = path.dirname(__filename);

const buildDirectory = path.join(currentDirname, "build");

export { currentDirname, buildDirectory };
