// A batch script to update s3 presigned urls saved to the database.
// Intended to be run in a lambda.
import {
  listExpiringDocuments,
  updateDocumentS3Url,
} from "app/utils/db.server";
import { getURLFromS3 } from "app/utils/s3.server";
import logger from "app/utils/logging.server";

// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
export async function main() {
  logger.info(`Beginning s3 document upload url refresh`);

  const documentsToRefresh = await listExpiringDocuments();
  logger.debug(documentsToRefresh);

  if (documentsToRefresh !== undefined && documentsToRefresh.length > 0) {
    logger.info(`Refreshing ${documentsToRefresh.length} document urls`);
    for (const document of documentsToRefresh) {
      let newS3Url;
      try {
        newS3Url = await getURLFromS3(document.s3Key);
        logger.info(
          {
            submissionId: document.submissionId,
            filename: document.originalFilename,
            lastUpdatedAt: document.updatedAt,
          },
          `New document url: ${newS3Url}`
        );
      } catch (error) {
        logger.error(
          {
            submissionId: document.submissionId,
            filename: document.originalFilename,
            lastUpdatedAt: document.updatedAt,
          },
          `Error encountered trying to get new URL: ${error}`
        );
      }
      if (newS3Url) {
        try {
          const updatedDocument = await updateDocumentS3Url(
            document.submissionId,
            document.originalFilename,
            newS3Url
          );
          logger.info(
            {
              submissionId: updatedDocument.submissionId,
              filename: updatedDocument.originalFilename,
              nowUpdatedAt: updatedDocument.updatedAt,
              newS3Url: newS3Url,
            },
            `Document updated`
          );
        } catch (error) {
          logger.error(
            {
              submissionId: document.submissionId,
              filename: document.originalFilename,
              lastUpdatedAt: document.updatedAt,
              newS3Url: newS3Url,
            },
            `Error encountered updating URL: ${error}`
          );
        }
      }
    }
  } else {
    logger.warn("No documents to refresh");
  }
}

main()