import sharp from "sharp";
import path from "path";
import mime from "mime";
import pino from "pino";
import gs from "ghostscript4js";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

const logLevel = process.env.LOG_LEVEL || "info";
const logger = pino({ level: logLevel });

// Use sharp to create a new image.
// See https://sharp.pixelplumbing.com
async function sanitizeImage(
  filepath: string,
  outputFile: string,
  filetype: string
) {
  try {
    let options = {};
    if (filetype.includes("gif")) {
      logger.debug(`Converting a gif. Adding "animated" option`);
      options = { animated: true };
    }

    await sharp(filepath, options)
      .toFile(outputFile)
      .then((info) => {
        logger.debug(info);
        logger.debug("Success");
      })
      .catch((err) => {
        logger.error(err);
      });
  } catch (error) {
    logger.error(`❌ Error running sharp: ${error}`);
    throw error;
  }
}

// Use ghostscript to convert pdfs to jpgs and then use pdfkit to create a new pdf
// Ghostscript4js needs ghostscript to be installed on the OS
// See https://github.com/NickNaso/ghostscript4js
// See https://pdfkit.org
function sanitizePdf(filepath: string, outputDir: string) {
  const outputFile = path.join(outputDir, "part-%03d.jpeg");
  logger.debug(`Ghostscript outputFile: ${outputFile}`);

  const gsCommand = `-dBATCH \
-dNOPAUSE \
-dSAFER \
-sDEVICE=jpeg \
-dJPEGQ=95 \
-r600x600 \
-dPDFFitPage \
-dFIXEDMEDIA \
-sOutputFile=${outputFile} \
${filepath}`;
  logger.debug(`Ghostscript command: ${gsCommand}`);

  try {
    gs.executeSync(gsCommand);
  } catch (err) {
    logger.error(`❌ Error running ghostscript4js: ${err}`);
    throw err;
  }
}

async function sanitize(filepath: string, outputDir: string) {
  logger.debug(`Begin sanitizing for ${filepath}`);

  const pathParts = path.parse(filepath);
  const filename = pathParts.base;
  const outputFile = path.join(outputDir, filename);
  logger.debug(`Filename: ${filename}`);

  const filetype = mime.getType(filepath);
  logger.debug(`Filetype: ${filetype}`);

  try {
    if (filetype && filetype.includes("image")) {
      logger.info(`Sanitizing image: ${filepath}`);
      await sanitizeImage(filepath, outputFile, filetype);
    } else if (filetype && filetype === "application/pdf") {
      logger.info(`Sanitizing pdf: ${filepath}`);
      const outputSubdir = path.join(outputDir, "parts");
      mkdirSync(outputSubdir);
      sanitizePdf(filepath, outputSubdir);
    } else {
      logger.warn(`❌ Unknown filetype: ${filepath}`);
    }
  } catch (error) {
    // delete the file?
  }
}

async function main(): Promise<void> {
  logger.info(`Begin sanitizing 🧼`);
  // read the sqs envelope
  // get the s3 folder uuid
  // read all the files in the s3 folder
  // process each s3 file

  // @TODO test for:
  //
  // Convertable options:
  // - image/png
  // - image/jpeg
  // - image/gif (animated)
  // - image/gif (not animated)
  // - image/tiff <--
  // - application/pdf <--
  //
  // Unconvertable options:
  // - image/heif <--
  // - text/plain
  // - an evil unreadable file
  const filepath = "";

  const outputDir = mkdtempSync(path.join(tmpdir(), "sanitize-"));
  logger.info(`Saving files to: ${outputDir}`);
  await sanitize(filepath, outputDir);

  logger.info(`Done sanitizing 🧽`);
}

main();
