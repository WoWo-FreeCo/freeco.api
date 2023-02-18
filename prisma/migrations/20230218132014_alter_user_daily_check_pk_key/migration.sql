/*
  Warnings:

  - The primary key for the `UserDailyCheck` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserDailyCheck` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `UserDailyCheck_createdAt_idx` ON `UserDailyCheck`;

-- AlterTable
ALTER TABLE `UserDailyCheck` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`userId`, `createdAt`);
