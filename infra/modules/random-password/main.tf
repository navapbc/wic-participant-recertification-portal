resource "random_password" "random_password" {
  length           = 41
  special          = true
  min_special      = 6
  override_special = "!#$%&*()-_=+[]{}<>:?"
}


