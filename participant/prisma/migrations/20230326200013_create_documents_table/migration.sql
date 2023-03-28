-- CreateTable
CREATE TABLE "documents" (
    "document_id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "s3_path" TEXT NOT NULL,
    "detected_filetype" TEXT,
    "virus_scan_status" TEXT,
    "detected_filesize_bytes" INTEGER,
    "original_filename" TEXT NOT NULL,
    "sha256_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE;
