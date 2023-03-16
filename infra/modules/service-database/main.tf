resource "aws_security_group" "database" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.database_name}-database"
  description = "Allow inbound TCP access to database port"
  lifecycle {
    create_before_destroy = true
  }

  ingress {
    description     = "Allow HTTP traffic to database port"
    protocol        = "tcp"
    from_port       = var.database_port
    to_port         = var.database_port
    security_groups = var.allowed_security_groups
  }

  egress {
    description = "Allow all outgoing traffic from database"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
