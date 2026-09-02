output "bucket_name" {
  description = "Bucket privé qui reçoit les fichiers du site."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "Identifiant de la distribution, utile pour l'invalidation."
  value       = aws_cloudfront_distribution.site.id
}

output "site_url" {
  description = "URL publique du site."
  value = var.enable_custom_domain ? (
    "https://${var.domain_name}"
  ) : "https://${aws_cloudfront_distribution.site.domain_name}"
}
