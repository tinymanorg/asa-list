import path from "path";
import { readdir, mkdir } from "fs/promises";
import {
  existsSync,
  mkdirSync,
  lstatSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { buildDirectory, currentDirname } from "./constants.mjs";

const ASSET_ID_MATCHER = /\d+/;

try {
  await mkdir(buildDirectory);
  const files = await readdir(currentDirname);

  for (const file of files) {
    try {
      const folderFiles = await readdir(path.join(currentDirname, file));

      if (folderFiles.some((folderFile) => folderFile.includes("icon.png"))) {
        copyDirectorySync(file, buildDirectory);
      }
    } catch (error) {
      // not a directory
    }
  }
} catch (err) {
  console.error(err);
}

/**
 * @param {string} source
 * @returns Directory name that includes only asset ids
 */
function createTargetDirectoryName(source) {
  let sourceDirName = source;

  if (sourceDirName.match(ASSET_ID_MATCHER)) {
    sourceDirName = sourceDirName.match(ASSET_ID_MATCHER)[0];
  } else {
    // it is ALGO folder
    sourceDirName = "0";
  }

  return sourceDirName;
}

function copyDirectorySync(source, target) {
  let targetDirName = createTargetDirectoryName(path.basename(source));
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, targetDirName);

  if (!existsSync(targetFolder)) {
    console.log(`┏━━━ Creating ${targetFolder} ━━━━━━━━━━━━`);
    mkdirSync(targetFolder);
  }

  // Copy source
  if (lstatSync(source).isDirectory()) {
    console.log(
      `
      Copying contents of ${source} into ${targetFolder} ━━━━━━━━━━━━`
    );

    files = readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);

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
