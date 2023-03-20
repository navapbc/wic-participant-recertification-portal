data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_s3_bucket" "doc-upload" {
  bucket = "${var.environment_name}-document-upload"
}

resource "aws_s3_bucket_public_access_block" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.id
  policy = data.aws_iam_policy_document.doc-upload.json
}

data "aws_iam_role" "task_executor" {
  # Referencing the task executor of the ECS services so that they have the ability to upload documents to s3
  name = "${var.service_name}-task-executor"

}

data "aws_iam_policy_document" "doc-upload" {
  statement {
    sid = "BucketAccess"

    effect = "Allow"


    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:ListBucketMultipartUploads",
      "s3:ListMultipartUploadParts",
      "s3:DeleteObject"
    ]

    resources = [
      "${aws_s3_bucket.doc-upload.arn}",
      "${aws_s3_bucket.doc-upload.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["${data.aws_iam_role.task_executor.arn}"]
    }
  }
}
