-- CreateTable
CREATE TABLE `ProductImage` (
    `index` INTEGER NOT NULL,
    `imagePath` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,

    PRIMARY KEY (`productId`, `index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductMarkdownInfo` (
    `index` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `productId` INTEGER NOT NULL,

    PRIMARY KEY (`productId`, `index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMarkdownInfo` ADD CONSTRAINT `ProductMarkdownInfo_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
