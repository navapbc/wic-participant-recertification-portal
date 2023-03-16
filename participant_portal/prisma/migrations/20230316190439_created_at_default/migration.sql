-- AlterTable
ALTER TABLE "local_agencies" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "submission_forms" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "submissions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
