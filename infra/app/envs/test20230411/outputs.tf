output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.name
}

output "cluster_name" {
  value = module.app.cluster_name
}

output "participant_service_name" {
  value = module.app.participant_service_name
}

output "staff_service_name" {
  value = module.app.staff_service_name
}

output "analytics_service_name" {
  value = module.app.analytics_service_name
}
