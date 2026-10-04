CREATE TABLE "book_list_items" (
	"book_list_id" uuid NOT NULL,
	"user_book_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_list_items_book_list_id_user_book_id_pk" PRIMARY KEY("book_list_id","user_book_id")
);
--> statement-breakpoint
CREATE TABLE "book_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_list_items" ADD CONSTRAINT "book_list_items_book_list_id_book_lists_id_fk" FOREIGN KEY ("book_list_id") REFERENCES "public"."book_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_list_items" ADD CONSTRAINT "book_list_items_user_book_id_user_books_id_fk" FOREIGN KEY ("user_book_id") REFERENCES "public"."user_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_lists" ADD CONSTRAINT "book_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_list_items_user_book_id_index" ON "book_list_items" USING btree ("user_book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_lists_user_id_name_unique" ON "book_lists" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "book_lists_user_id_index" ON "book_lists" USING btree ("user_id");