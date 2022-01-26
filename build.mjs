import path from "path";
import { readdir, mkdir, rm, appendFile } from "fs/promises";
import {
  existsSync,
  mkdirSync,
  lstatSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const algoIconsFolderName = "ALGO";

const ASSET_LOGO_BASE_URL = "https://asa-icons.s3.eu-central-1.amazonaws.com";
const ASSET_ID_MATCHER = /\d+/;
const currentDirname = path.dirname(__filename);
const buildDirectory = path.join(currentDirname, "build");
const ASSET_ICON_MAP = new Map();

try {
  if (existsSync(buildDirectory)) {
    await rm(buildDirectory, { recursive: true });
  }

  await mkdir(buildDirectory);
  const files = await readdir(currentDirname);

  for (const file of files) {
    try {
      if (lstatSync(file).isDirectory()) {
        const folderFiles = await readdir(path.join(currentDirname, file));

        if (folderFiles.some((folderFile) => folderFile.includes("icon.png"))) {
          const targetDirName = createTargetDirectoryName(path.basename(file));

          copyDirectorySync(file, buildDirectory, targetDirName);

          ASSET_ICON_MAP.set(targetDirName, getAssetLogo(targetDirName));
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Create JSON file and save it under /build directory
  console.log(`┏━━━ Creating icons.json ━━━━━━━━━━━━`);

  const assetIcons = Object.fromEntries(ASSET_ICON_MAP);
  const assetIconsJSON = JSON.stringify(assetIcons, null, "\t");

  await appendFile(path.join(buildDirectory, "icons.json"), assetIconsJSON);
  console.log(`━━━━━━━━━━━━ Finished ━━━━━━━━━━━━`);
} catch (error) {
  console.error(error);
  throw error;
}

/**
 * @param {string} source
 * @returns Directory name that includes only asset ids
 */
function createTargetDirectoryName(source) {
  let sourceDirName = source;

  if (sourceDirName.match(ASSET_ID_MATCHER)) {
    sourceDirName = sourceDirName.match(ASSET_ID_MATCHER)[0];
  } else if (
    sourceDirName.toLowerCase() === algoIconsFolderName.toLowerCase()
  ) {
    sourceDirName = "0";
  }

  return sourceDirName;
}

function copyDirectorySync(source, target, targetDirName) {
  let files = [];
  const targetFolder = path.join(target, targetDirName);

  if (!existsSync(targetFolder)) {
    console.log(`┏━━━ Creating ${targetFolder} ━━━━━━━━━━━━`);
    mkdirSync(targetFolder);
  }

  if (lstatSync(source).isDirectory()) {
    console.log(
      `
      Copying contents of ${source} into ${targetFolder} ━━━━━━━━━━━━`
    );

    files = readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);

      if (lstatSync(curSource).isDirectory()) {
        copyDirectorySync(curSource, targetFolder);
      } else {
        console.log(`••••• Copying ${curSource}`);

        copyFileSync(curSource, path.join(targetFolder, file));
      }
    });

    console.log(`
    

    ━━━━━━━━━━━━ Finished copying ${source} ━━━━━━━━━━━━
    

    `);
  }
}

/**
 * Generates URL for the asset's logo
 */
function getAssetLogo(assetId) {
  return `${ASSET_LOGO_BASE_URL}/${assetId}/icon.png`;
}
