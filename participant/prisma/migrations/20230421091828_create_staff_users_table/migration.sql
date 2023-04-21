-- CreateTable
CREATE TABLE "staff_users" (
    "staff_user_id" UUID NOT NULL,
    "local_agency_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("staff_user_id")
);

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_local_agency_id_fkey" FOREIGN KEY ("local_agency_id") REFERENCES "local_agencies"("local_agency_id") ON DELETE RESTRICT ON UPDATE CASCADE;
