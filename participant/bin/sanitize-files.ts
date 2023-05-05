import sharp from "sharp";
import path from "path";
import mime from "mime";
import pino from "pino";

const logLevel = process.env.LOG_LEVEL || "info";
const logger = pino({ level: logLevel });

async function sanitizeImage(filepath: string, outputFile: string) {
  try {
    await sharp(filepath)
      .toFile(outputFile)
      .then((info) => {
        logger.debug(info);
        logger.debug("Success");
      })
      .catch((err) => {
        logger.error(err);
      });
  } catch (error) {
    logger.error(`Error running sharp: ${error}`);
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

  if (filetype && filetype.includes("image")) {
    logger.info(`Sanitizing image: ${filepath}`);
    await sanitizeImage(filepath, outputFile);
  } else {
    logger.warn(`Unknown filetype: ${filepath}`);
  }
}

async function main(): Promise<void> {
  logger.info(`Begin sanitizing 🧼`);
  // read the sqs envelope
  // get the s3 folder uuid
  // read all the files in the s3 folder
  // process each s3 file

  await sanitize(filepath, outputDir);

  logger.info(`Done sanitizing 🧽`);
}

main();
