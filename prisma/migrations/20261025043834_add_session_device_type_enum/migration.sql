/*
  Warnings:

  - The `device_type` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN');

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "device_type",
ADD COLUMN     "device_type" "DeviceType" NOT NULL DEFAULT 'UNKNOWN';
