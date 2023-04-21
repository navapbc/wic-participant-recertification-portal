##############################################
## General variables
##############################################
variable "environment_name" {
  type        = string
  description = "name of the application environment"
}


##############################################
## Variables for the participant app
##############################################
variable "participant_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the participant service"
  default     = "latest"
}

variable "participant_url" {
  type        = string
  description = "URL to access the application"
}

variable "participant_max_upload_size_bytes" {
  type        = string
  description = "The maximum allowed size of a single file upload"
  default     = "26214400"
}

variable "participant_max_upload_filecount" {
  type        = string
  description = "The maximum allowed number of files per submission"
  default     = "20"
}

variable "participant_max_session_seconds" {
  type        = string
  description = "The maximum allowed number of seconds per session (aka session timeout limit in seconds)"
  default     = "1800"
}

variable "participant_s3_presigned_url_expiration" {
  type        = string
  description = "The maximum allowed number of seconds a presigned s3 url is active before it expires"
  default     = "604800"
}

variable "participant_doc_upload_expiration" {
  type        = string
  description = "The maximum allowed number of seconds a presigned s3 url is active before it expires"
  default     = "604800"
}

variable "participant_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the participant service"
  default     = false
}


##############################################
## Variables for the staff app
##############################################
variable "staff_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the staff service"
  default     = "latest"
}

variable "staff_url" {
  type        = string
  description = "URL to access the application"
}

variable "staff_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the staff service"
  default     = false
}


##############################################
## Variables for the analytics app
##############################################
variable "analytics_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the analytics service"
  default     = "latest"
}

variable "analytics_url" {
  type        = string
  description = "URL to access the application"
}

variable "analytics_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the analytics service"
  default     = false
}