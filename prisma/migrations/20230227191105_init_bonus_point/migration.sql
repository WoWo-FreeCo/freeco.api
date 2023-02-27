-- AlterTable
ALTER TABLE `Order` ADD COLUMN `bonusPointRedemptionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `BonusPoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activityType` ENUM('REGISTER', 'UPGRADE', 'REWARD', 'REDEEM') NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `points` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BonusPointRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `rule` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BonusPoint` ADD CONSTRAINT `BonusPoint_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_bonusPointRedemptionId_fkey` FOREIGN KEY (`bonusPointRedemptionId`) REFERENCES `BonusPoint`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- InsertData
INSERT INTO `BonusPointRule` (`name`, `rule`, `createdAt`, `updatedAt`) VALUES ('紅利消費回饋百分比', 1, NOW(), NOW());
INSERT INTO `BonusPointRule` (`name`, `rule`, `createdAt`, `updatedAt`) VALUES ('註冊會員贈點', 50, NOW(), NOW());
INSERT INTO `BonusPointRule` (`name`, `rule`, `createdAt`, `updatedAt`) VALUES ('升級VIP贈點', 70, NOW(), NOW());
INSERT INTO `BonusPointRule` (`name`, `rule`, `createdAt`, `updatedAt`) VALUES ('升級SVIP贈點', 100, NOW(), NOW());
