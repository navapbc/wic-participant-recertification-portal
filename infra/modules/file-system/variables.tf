variable "resource_name" {
  type        = string
  description = "The EFS volume name"
}

variable "vpc_id" {
  type        = string
  description = "Uniquely identifies the VPC."
}

variable "subnet_ids" {
  type        = list(any)
  description = "The ids of subnets to add the file system mount target in"
}

variable "cidr_blocks" {
  type        = list(any)
  description = "The CIDR blocks that can access the file system"
}

variable "access_point_posix_uid" {
  type        = number
  description = "Posix UID for the EFS access point"
}

variable "access_point_posix_gid" {
  type        = number
  description = "Posix GID for the EFS access point"
}

variable "access_point_posix_permissions" {
  type        = string
  description = "Posix permissions for the EFS access point"
  default     = "0755"
}

variable "access_point_root_dir" {
  type        = string
  description = "EFS access point root directory"
  default     = "/"
}


# variable "security_groups" {
#   description = "The security groups in effect for the file system mount target"
#   type        = list(any)
#   default = []
# }
