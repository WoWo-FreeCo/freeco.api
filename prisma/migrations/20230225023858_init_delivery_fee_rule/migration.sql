-- CreateTable
CREATE TABLE `DeliveryFeeRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `ruleType` ENUM('FEE', 'THRESHOLD') NOT NULL,
    `rule` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- InsertData
INSERT INTO `DeliveryFeeRule` (`name`, `ruleType`, `rule`, `createdAt`, `updatedAt`) VALUES ('本島運費', 'FEE', 100, NOW(), NOW());
INSERT INTO `DeliveryFeeRule` (`name`, `ruleType`, `rule`, `createdAt`, `updatedAt`) VALUES ('外島運費', 'FEE', 200, NOW(), NOW());
INSERT INTO `DeliveryFeeRule` (`name`, `ruleType`, `rule`, `createdAt`, `updatedAt`) VALUES ('免運數量門檻', 'THRESHOLD', 2, NOW(), NOW());
INSERT INTO `DeliveryFeeRule` (`name`, `ruleType`, `rule`, `createdAt`, `updatedAt`) VALUES ('免運金額門檻', 'THRESHOLD', 200, NOW(), NOW());
