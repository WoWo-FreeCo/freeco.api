-- CreateTable
CREATE TABLE `OrderRevoke` (
    `invoiceStatus` ENUM('UNISSUED', 'WAIT_CANCEL', 'CANCELLED') NOT NULL,
    `paymentStatus` ENUM('UNPAIED', 'WAIT_REFUND', 'REFUNDED') NOT NULL,
    `orderId` VARCHAR(19) NOT NULL,

    PRIMARY KEY (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderRevoke` ADD CONSTRAINT `OrderRevoke_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
