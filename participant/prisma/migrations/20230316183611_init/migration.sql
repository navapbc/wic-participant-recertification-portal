-- CreateTable
CREATE TABLE "submissions" (
    "submission_id" UUID NOT NULL,
    "local_agency_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "submitted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "submission_forms" (
    "submission_form_id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "form_route" TEXT NOT NULL,
    "form_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "submission_forms_pkey" PRIMARY KEY ("submission_form_id")
);

-- CreateTable
CREATE TABLE "local_agencies" (
    "local_agency_id" UUID NOT NULL,
    "url_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "local_agencies_pkey" PRIMARY KEY ("local_agency_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "local_agencies_url_id_key" ON "local_agencies"("url_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_local_agency_id_fkey" FOREIGN KEY ("local_agency_id") REFERENCES "local_agencies"("local_agency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_forms" ADD CONSTRAINT "submission_forms_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE;
