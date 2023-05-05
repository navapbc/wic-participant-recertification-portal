import sharp from "sharp";
import path from "path";
import mime from "mime";
import pino from "pino";
import gs from "ghostscript4js";
import {
  mkdtempSync,
  mkdirSync,
  createWriteStream,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import PDFDocument from "pdfkit";

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
function sanitizePdf(filepath: string, filename: string, outputDir: string) {
  const outputFile = path.join(outputDir, "part-%03d.jpeg");
  logger.debug(`Ghostscript outputFile: ${outputFile}`);

  // 🎩 Hat tip to:
  // https://superuser.com/questions/168444/using-ghostscript-to-convert-multi-page-pdf-into-single-jpg
  const gsCommand = `-dBATCH \
-dNOPAUSE \
-dSAFER \
-sDEVICE=jpeg \
-dJPEGQ=100 \
-r600x600 \
-dPDFFitPage \
-dFIXEDMEDIA \
-sOutputFile=${outputFile} \
${filepath}`;
  logger.debug(`Ghostscript command: ${gsCommand}`);

  try {
    // @TODO the logs are out of order, seeming to indicate this runs first?
    gs.executeSync(gsCommand);
  } catch (err) {
    logger.error(`❌ Error running ghostscript4js: ${err}`);
    throw err;
  }

  const jpgs = readdirSync(outputDir);
  const newPdf = path.join(outputDir, filename);
  logger.info(`Creating new pdf: ${newPdf}`);
  const doc = new PDFDocument({ size: "LETTER" });
  doc.pipe(createWriteStream(newPdf));

  // Letter pages are 612 x 792 points
  // @TODO respect the orientation of the original pdf.
  //   currently, all pdfs become portrait
  let firstPage = true;
  jpgs.forEach((jpgFile) => {
    if (firstPage) {
      firstPage = false;
      doc.image(path.join(outputDir, jpgFile), 0, 0, { fit: [612, 792] });
    } else {
      doc
        .addPage()
        .image(path.join(outputDir, jpgFile), 0, 0, { fit: [612, 792] });
    }
  });
  doc.end();
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
      sanitizePdf(filepath, filename, outputSubdir);
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
  // - application/pdf
  //   - pdfs with spaces in the filename <-- normalize filenames?
  //   - landscape pdfs <--
  //   - mixed landscape and portrait pdfs <--
  //   - pdfs that aren't letter <--
  //
  // - large image <--
  // - large pdf <--
  //
  // Unconvertable options:
  // - image/heif <-- reject?
  // - text/plain
  // - an evil unreadable file
  const filepath = "";

  const outputDir = mkdtempSync(path.join(tmpdir(), "sanitize-"));
  logger.info(`Saving files to: ${outputDir}`);
  await sanitize(filepath, outputDir);

  logger.info(`Done sanitizing 🧽`);
}

main();
