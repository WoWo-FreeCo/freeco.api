-- CreateTable
CREATE TABLE `OrderInvoiceInfo` (
    `orderRelateNumber` VARCHAR(30) NOT NULL,
    `customerID` VARCHAR(20) NULL,
    `customerIdentifier` VARCHAR(8) NULL,
    `customerName` VARCHAR(20) NULL,
    `customerAddr` VARCHAR(100) NULL,
    `customerPhone` VARCHAR(15) NULL,
    `customerEmail` VARCHAR(80) NULL,
    `clearanceMark` VARCHAR(1) NULL,
    `print` VARCHAR(1) NOT NULL,
    `donation` VARCHAR(1) NOT NULL,
    `loveCode` VARCHAR(7) NULL,
    `carruerType` VARCHAR(1) NULL,
    `carruerNum` VARCHAR(16) NULL,
    `taxType` VARCHAR(1) NOT NULL,
    `salesAmount` VARCHAR(191) NOT NULL,
    `remark` TEXT NULL,
    `itemName` TEXT NOT NULL,
    `itemCount` TEXT NOT NULL,
    `itemWord` TEXT NOT NULL,
    `itemPrice` TEXT NOT NULL,
    `itemTaxType` TEXT NULL,
    `itemAmount` TEXT NOT NULL,
    `itemRemark` TEXT NOT NULL,
    `invType` VARCHAR(2) NOT NULL,
    `vat` VARCHAR(1) NOT NULL,

    PRIMARY KEY (`orderRelateNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderInvoiceInfo` ADD CONSTRAINT `OrderInvoiceInfo_orderRelateNumber_fkey` FOREIGN KEY (`orderRelateNumber`) REFERENCES `Order`(`relateNumber`) ON DELETE CASCADE ON UPDATE CASCADE;
