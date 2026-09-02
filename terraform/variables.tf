variable "aws_region" {
  description = "Région AWS du bucket S3."
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Préfixe court utilisé pour nommer et taguer les ressources."
  type        = string
  default     = "curtis-portfolio"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,30}$", var.project_name))
    error_message = "Le nom doit contenir 3 à 30 caractères minuscules, chiffres ou tirets."
  }
}

variable "price_class" {
  description = "Classe de prix CloudFront. PriceClass_100 limite les points de présence."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "Valeur attendue : PriceClass_100, PriceClass_200 ou PriceClass_All."
  }
}

variable "enable_custom_domain" {
  description = "Active un alias CloudFront et un certificat ACM existant."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Nom de domaine à associer lorsque enable_custom_domain vaut true."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN d'un certificat ACM existant en us-east-1 pour CloudFront."
  type        = string
  default     = ""
  sensitive   = false
}
