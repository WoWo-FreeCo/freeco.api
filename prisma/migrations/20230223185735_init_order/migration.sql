/*
  Warnings:

  - The values [CODE_CHAIN] on the enum `Product_attribute` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[skuId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Product` ADD COLUMN `skuId` VARCHAR(20) NULL,
    MODIFY `attribute` ENUM('GENERAL', 'COLD_CHAIN') NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(19) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `merchantTradeNo` VARCHAR(20) NOT NULL,
    `relateNumber` VARCHAR(30) NOT NULL,
    `orderStatus` ENUM('WAIT_PAYMENT', 'WAIT_DELIVER', 'WAIT_RECEIVE', 'COMPLETED', 'CANCELLED', 'REVOKED') NOT NULL,
    `price` INTEGER NOT NULL,
    `attribute` ENUM('GENERAL', 'COLD_CHAIN') NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Order_merchantTradeNo_key`(`merchantTradeNo`),
    UNIQUE INDEX `Order_relateNumber_key`(`relateNumber`),
    INDEX `Order_merchantTradeNo_idx`(`merchantTradeNo`),
    INDEX `Order_relateNumber_idx`(`relateNumber`),
    INDEX `Order_userId_orderStatus_idx`(`userId`, `orderStatus`),
    INDEX `Order_orderStatus_createdAt_idx`(`orderStatus`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderConsignee` (
    `deliveryType` ENUM('HOME', 'STORE') NOT NULL,
    `addressDetailOne` VARCHAR(191) NULL,
    `addressDetailTwo` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `idNo` VARCHAR(191) NULL,
    `idType` VARCHAR(191) NULL,
    `cellphone` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `remark` TEXT NULL,
    `stationCode` VARCHAR(191) NULL,
    `stationName` VARCHAR(191) NULL,
    `town` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `senderRemark` TEXT NULL,
    `requiredDeliveryDates` VARCHAR(191) NULL,
    `requiredDeliveryTimeslots` VARCHAR(191) NULL,
    `codAmount` INTEGER NOT NULL,
    `currencyCode` VARCHAR(20) NOT NULL,
    `orderId` VARCHAR(19) NOT NULL,

    PRIMARY KEY (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `orderId` VARCHAR(19) NOT NULL,
    `productId` INTEGER NULL,
    `productSkuId` VARCHAR(20) NULL,
    `quantity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Product_skuId_key` ON `Product`(`skuId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderConsignee` ADD CONSTRAINT `OrderConsignee_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `Product`(`skuId`) ON DELETE RESTRICT ON UPDATE CASCADE;
