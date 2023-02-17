-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `UserActivation` DROP FOREIGN KEY `UserActivation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserDailyCheck` DROP FOREIGN KEY `UserDailyCheck_userId_fkey`;

-- AddForeignKey
ALTER TABLE `UserDailyCheck` ADD CONSTRAINT `UserDailyCheck_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivation` ADD CONSTRAINT `UserActivation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
