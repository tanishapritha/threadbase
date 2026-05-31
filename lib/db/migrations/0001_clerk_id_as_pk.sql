-- Migration 0001: Change users.id to text (Clerk user ID), drop clerk_id
-- Tables are expected to be empty (fresh Supabase project).

-- 1. Drop foreign key constraints that reference users.id
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_user_id_users_id_fk";
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_owner_id_users_id_fk";

-- 2. Drop the unique constraint on clerk_id (we're removing the column)
ALTER TABLE "users" DROP CONSTRAINT "users_clerk_id_unique";

-- 3. Alter users table
--    Since tables are empty, we can drop and recreate the primary key column
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" DROP COLUMN "clerk_id";
ALTER TABLE "users" ADD COLUMN "id" text PRIMARY KEY NOT NULL;

-- 4. Alter workspaces.owner_id to text
ALTER TABLE "workspaces" DROP COLUMN "owner_id";
ALTER TABLE "workspaces" ADD COLUMN "owner_id" text NOT NULL;

-- 5. Alter workspace_members.user_id to text
ALTER TABLE "workspace_members" DROP COLUMN "user_id";
ALTER TABLE "workspace_members" ADD COLUMN "user_id" text NOT NULL;

-- 6. Re-add foreign key constraints
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
