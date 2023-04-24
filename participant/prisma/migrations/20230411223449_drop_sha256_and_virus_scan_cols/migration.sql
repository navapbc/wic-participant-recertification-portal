/*
  Warnings:

  - You are about to drop the column `sha256_hash` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `virus_scan_status` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "sha256_hash",
DROP COLUMN "virus_scan_status";
