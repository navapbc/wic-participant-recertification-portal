/*
  Warnings:

  - Added the required column `s3_url` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "s3_url" TEXT NOT NULL;
