resource "random_password" "random_password" {
  length           = var.length
  special          = true
  min_special      = 6
  override_special = "!#$%&*()-_=+[]{}<>:?"
}


