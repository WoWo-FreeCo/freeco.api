/*
  Warnings:

  - Added the required column `logisticsStatus` to the `OrderRevoke` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OrderRevoke` ADD COLUMN `logisticsStatus` ENUM('WAIT_CANCEL', 'CANCELLED') NOT NULL;
