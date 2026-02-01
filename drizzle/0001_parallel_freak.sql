CREATE TABLE `image_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gallery` varchar(50) NOT NULL,
	`imageOrder` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `image_orders_id` PRIMARY KEY(`id`)
);
