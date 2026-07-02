variable "environment" {
  description = "Nom de l'environnement"
  type        = string
  default     = "demo"
}

variable "location" {
  description = "Région Azure"
  type        = string
  default     = "swedencentral"
}

variable "jwt_secret" {
  description = "Secret utilisé pour signer les JWT (laisser vide pour en générer un aléatoire)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "token_ttl_seconds" {
  description = "Durée de vie des jetons JWT (secondes)"
  type        = number
  default     = 120
}

variable "hls_segment_seconds" {
  description = "Durée d'un segment HLS (secondes)"
  type        = number
  default     = 6
}

variable "admin_username" {
  description = "Identifiant du compte administrateur créé automatiquement au démarrage"
  type        = string
  default     = "admin"
}

variable "session_ttl_seconds" {
  description = "Durée de vie d'un jeton de session (login)"
  type        = number
  default     = 7200
}

variable "guest_ttl_seconds" {
  description = "Durée de vie d'un jeton de session invité (éphémère)"
  type        = number
  default     = 1800
}

variable "download_key_ttl_hours" {
  description = "Durée de validité (heures) d'une clé de déchiffrement d'un téléchargement approuvé"
  type        = number
  default     = 24
}

variable "enable_transcription" {
  description = "Active la génération automatique de sous-titres (transcription audio via Azure AI Speech), façon sous-titres auto YouTube"
  type        = bool
  default     = true
}

variable "speech_service_location" {
  description = "Région Azure du service de transcription (Azure AI Speech). Laisser vide pour réutiliser `location` (le service Speech n'est pas garanti disponible dans toutes les régions)"
  type        = string
  default     = ""
}

variable "speech_language" {
  description = "Langue utilisée pour la transcription automatique (code BCP-47, ex: fr-FR, en-US)"
  type        = string
  default     = "fr-FR"
}
