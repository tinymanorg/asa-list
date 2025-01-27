import path from "path";
import algosdk from "algosdk";
import { readdir, mkdir, rm, appendFile } from "fs/promises";
import {
  existsSync,
  mkdirSync,
  lstatSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { fileURLToPath } from "url";

if (!process.env.INDEXER_TOKEN) {
  throw new Error("No INDEXER_TOKEN was provided.");
}

const ALGOD_CREDENTIALS = {
  algodev: {
    indexerToken: process.env.INDEXER_TOKEN,
    indexerServer: "https://b-indexer-mainnet.chain.perawallet.app/",
    port: 443,
  },
};

const indexer = new algosdk.Indexer(
  ALGOD_CREDENTIALS.algodev.indexerToken,
  ALGOD_CREDENTIALS.algodev.indexerServer,
  ALGOD_CREDENTIALS.algodev.port
);

const __filename = fileURLToPath(import.meta.url);

const algoIconsFolderName = "ALGO";

const ASSET_LOGO_BASE_URL = "https://asa-list.tinyman.org";
const currentDirname = path.dirname(__filename);
const buildDirectory = path.join(currentDirname, "build");
const ASSET_ICON_MAP = new Map();
const ASSET_MAP = new Map();

try {
  if (existsSync(buildDirectory)) {
    await rm(buildDirectory, { recursive: true });
  }

  await mkdir(buildDirectory);
  await mkdir(`${buildDirectory}/assets`);
  const files = await readdir(path.join(currentDirname, "assets"));

  const assetIDs = [];

  for (const file of files) {
    try {
      const assetFolderPath = path.join(currentDirname, "assets", file);

      if (lstatSync(assetFolderPath).isDirectory()) {
        const folderFiles = await readdir(assetFolderPath);

        if (folderFiles.some((folderFile) => folderFile.includes("icon.png"))) {
          const targetDirName = createTargetDirectoryName(path.basename(file));

          copyDirectorySync(
            assetFolderPath,
            path.join(buildDirectory, "assets"),
            targetDirName
          );

          // if targetDirName is an asset id, we fetch the asset information and add it to assets.json
          if (Number(targetDirName) >= 0) {
            assetIDs.push(Number(targetDirName));
          } else {
            // adds icon placeholder to ASSET_ICON_MAP
            ASSET_ICON_MAP.set(targetDirName, getAssetLogo(targetDirName));
          }
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  console.log(`┏━━━ Fetching asset data from the indexer ━━━━━━━━━━━━`);

  const assetData = await Promise.all(assetIDs.map(getAssetInformationById));

  assetData.forEach((asset) => {
    ASSET_MAP.set(asset.id, asset);
    ASSET_ICON_MAP.set(asset.id, asset.logo.png);
  });

  // Create icons.json file and save it under /build directory
  console.log(`\n┏━━━ Creating icons.json ━━━━━━━━━━━━`);
  const assetIcons = Object.fromEntries(ASSET_ICON_MAP);
  const assetIconsJSON = JSON.stringify(assetIcons, null, "\t");

  await appendFile(path.join(buildDirectory, "icons.json"), assetIconsJSON);
  console.log(`━━━━━━━━━━━━ Created icons.json ━━━━━━━━━━━━\n`);

  // Create assets.json file and save it under /build directory
  console.log(`┏━━━ Creating assets.json ━━━━━━━━━━━━`);
  const assets = Object.fromEntries(ASSET_MAP);
  const assetsJSON = JSON.stringify(assets, null, "\t");

  await appendFile(path.join(buildDirectory, "assets.json"), assetsJSON);

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
  // If there is a match, the last capturing group will always be the asset id
  const idMatchResult = source.match(/(.*)-(\d+)/);
  let targetDirName = source;

  if (idMatchResult?.length) {
    targetDirName = idMatchResult[idMatchResult.length - 1];
  } else if (source.toLowerCase() === algoIconsFolderName.toLowerCase()) {
    targetDirName = "0";
  }

  return targetDirName;
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
function getAssetLogo(assetId, type = "png") {
  let logo = `${ASSET_LOGO_BASE_URL}/assets/${assetId}/icon.png`;

  if (type === "svg") {
    logo = `${ASSET_LOGO_BASE_URL}/assets/${assetId}/icon.svg`;
  }

  return logo;
}

/**
 * Fetches asset information from the indexer
 * @param {number} id
 */
async function getAssetInformationById(id) {
  try {
    if (id === 0) {
      return {
        id: `${id}`,
        name: "Algorand",
        unit_name: "ALGO",
        decimals: 6,
        url: "https://algorand.org",
        total_amount: "6615503326932151",
        logo: { png: getAssetLogo(id), svg: getAssetLogo(id, "svg") },
        deleted: false,
      };
    }

    console.log(`••••• Looking up asset #${id}`);
    const { asset } = await indexer.lookupAssetByID(id).do();

    return {
      id: `${asset.index}`,
      decimals: Number(asset.params.decimals),
      name: asset.params.name || "",
      unit_name: asset.params["unit-name"] || "",
      url: "",
      total_amount: String(asset.params.total),
      logo: { png: getAssetLogo(id), svg: getAssetLogo(id, "svg") },
      deleted: asset.deleted,
    };
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to fetch information for asset #${id}`);
  }
}
