/*
  Warnings:

  - You are about to drop the column `local` on the `GoogleUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `GoogleUser` DROP COLUMN `local`,
    ADD COLUMN `locale` VARCHAR(10) NULL;
