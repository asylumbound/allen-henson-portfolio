DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'image_orders'
			AND column_name = 'gallery'
			AND udt_name <> 'varchar'
	) THEN
		ALTER TABLE "image_orders"
			ALTER COLUMN "gallery" TYPE varchar(50) USING "gallery"::text;
	END IF;
END $$;
--> statement-breakpoint
WITH ranked AS (
	SELECT
		ctid,
		row_number() OVER (
			PARTITION BY "gallery"
			ORDER BY "updatedAt" DESC, "id" DESC
		) AS row_num
	FROM "image_orders"
)
DELETE FROM "image_orders"
WHERE ctid IN (
	SELECT ctid
	FROM ranked
	WHERE row_num > 1
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_indexes
		WHERE schemaname = 'public'
			AND tablename = 'image_orders'
			AND indexname = 'image_orders_gallery_unique_idx'
	) THEN
		DROP INDEX "image_orders_gallery_unique_idx";
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'image_orders_gallery_unique'
			AND conrelid = 'image_orders'::regclass
	) THEN
		ALTER TABLE "image_orders"
			ADD CONSTRAINT "image_orders_gallery_unique" UNIQUE ("gallery");
	END IF;
END $$;
