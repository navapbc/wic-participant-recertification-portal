variable "cluster_name" {
  description = "name of the cluster, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.cluster_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}
