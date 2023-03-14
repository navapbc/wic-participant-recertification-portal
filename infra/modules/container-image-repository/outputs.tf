output "image_registry" {
  value = local.image_registry
}

output "image_repository_name" {
  value = aws_ecr_repository.app.name
}

output "image_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "image_repository_arn" {
  value = aws_ecr_repository.app.arn
}
