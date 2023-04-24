/*
  Warnings:

  - You are about to drop the column `s3_path` on the `documents` table. All the data in the column will be lost.
  - Added the required column `s3_key` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "s3_path",
ADD COLUMN     "s3_key" TEXT NOT NULL;
