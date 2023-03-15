output "region" {
  value = local.region
}

output "image_registry" {
  value = module.participant_image_repository.image_registry
}

output "participant_image_repository_url" {
  value = module.participant_image_repository.image_repository_url
}

output "staff_image_repository_url" {
  value = module.staff_image_repository.image_repository_url
}

output "analytics_image_repository_url" {
  value = module.analytics_image_repository.image_repository_url
}
