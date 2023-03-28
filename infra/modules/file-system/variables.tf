variable "name" {
  type        = string
  description = "The EFS volume name"
}

variable "subnet_ids" {
  type        = list(any)
  description = "The ids of subnets to add the file system mount target in"
}

variable "security_groups" {
  description = "The security groups in effect for the file system mount target"
  type        = list(any)
}
