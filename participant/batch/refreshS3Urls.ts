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
  logger.warn(
    {
      location: "batch.refreshS3Urls",
      type: "main.begin",
    },
    "Beginning s3 document upload url refresh"
  );

  const documentsToRefresh = await listExpiringDocuments();
  if (documentsToRefresh?.length > 0) {
    logger.warn(
      {
        location: "batch.refreshS3Urls",
        type: "main.found_expiring_documents",
      },
      `Refreshing ${documentsToRefresh.length} document urls`
    );

    for (const document of documentsToRefresh) {
      let newS3Url;
      try {
        newS3Url = await getURLFromS3(document.s3Key);
        logger.info(
          {
            location: "batch.refreshS3Urls",
            type: "main.get_url",
            submissionId: document.submissionId,
            filename: document.originalFilename,
            lastUpdatedAt: document.updatedAt,
          },
          `New document url: ${newS3Url}`
        );
      } catch (error) {
        logger.error(
          {
            location: "batch.refreshS3Urls",
            type: "main.get_url",
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
              location: "batch.refreshS3Urls",
              type: "main.update_db",
              submissionId: updatedDocument.submissionId,
              filename: updatedDocument.originalFilename,
              nowUpdatedAt: updatedDocument.updatedAt,
            },
            `Document updated`
          );
        } catch (error) {
          logger.error(
            {
              location: "batch.refreshS3Urls",
              type: "main.update_db",
              submissionId: document.submissionId,
              filename: document.originalFilename,
              lastUpdatedAt: document.updatedAt,
            },
            `Error encountered updating URL: ${error}`
          );
        }
      }
    }
  } else {
    logger.warn(
      {
        location: "batch.refreshS3Urls",
        type: "main.no_documents_found",
      },
      "No documents to refresh"
    );
  }
  logger.warn(
    {
      location: "batch.refreshS3Urls",
      type: "main.end",
    },
    "Done with s3 document upload url refresh"
  );
}

main();
