/*
  Warnings:

  - You are about to drop the column `activityType` on the `BonusPoint` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BonusPoint` DROP COLUMN `activityType`,
    ADD COLUMN `ruleId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `BonusPoint` ADD CONSTRAINT `BonusPoint_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `BonusPointRule`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
