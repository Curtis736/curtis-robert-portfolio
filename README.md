# Site de Curtis Robert

CV en ligne statique, en français, réalisé en HTML, CSS et JavaScript sans
framework. Le site présente le parcours, les compétences et une sélection de
projets DevOps et Cloud de Curtis Robert.

## Structure

```text
.
├── index.html                 # contenu et métadonnées
├── assets/
│   ├── css/styles.css         # identité visuelle et responsive
│   └── js/
│       ├── main.js            # menu et liens optionnels
│       └── site.config.js     # LinkedIn, e-mail et CV
├── terraform/                 # S3 privé + CloudFront OAC
├── .github/workflows/         # contrôles et déploiement manuel
├── Dockerfile
└── nginx.conf
```

## Lancer en local

Avec Python :

```bash
python3 -m http.server 8080
```

Ouvrir <http://127.0.0.1:8080>.

Avec les dépendances de contrôle :

```bash
npm ci
npm run check
```

## Lancer avec Docker

```bash
docker build -t curtis-portfolio .
docker run --rm -p 8080:8080 curtis-portfolio
```

Le conteneur sert le site avec nginx sur <http://127.0.0.1:8080>. Il ajoute des
en-têtes HTTP de sécurité et utilise un utilisateur non privilégié.

## Modifier le contenu

- Les textes, expériences et projets sont dans `index.html`.
- Les couleurs et la typographie sont centralisées au début de
  `assets/css/styles.css`.
- LinkedIn, e-mail et CV sont volontairement absents tant que leurs valeurs ne
  sont pas connues. Les renseigner dans `assets/js/site.config.js`. Un champ vide
  n'affiche aucun lien.
- Si un PDF est ajouté, le placer par exemple dans `assets/docs/cv-curtis-robert.pdf`
  puis renseigner ce chemin dans `cvUrl`.
- Les titres exacts des certifications et les dates d'expérience doivent être
  ajoutés seulement après vérification.

`Resilio Orders` est affiché comme projet local, sans lien, tant que le dépôt
GitHub n'est pas public.

## Architecture AWS

```text
Navigateur ──HTTPS──> CloudFront ──requêtes SigV4/OAC──> S3 privé
```

Terraform crée :

- un bucket S3 privé, chiffré avec SSE-S3, versionné et protégé contre la
  suppression accidentelle ;
- une distribution CloudFront avec redirection HTTPS, compression et en-têtes
  de sécurité ;
- un Origin Access Control qui signe systématiquement les requêtes vers le
  point d'accès REST S3 ;
- une règle de nettoyage des anciennes versions après 30 jours ;
- un domaine personnalisé uniquement si l'option est explicitement activée.

Le domaine, Route 53, AWS WAF et les journaux d'accès ne sont pas créés par
défaut. Ce choix garde une architecture simple et limite les coûts et la
collecte de données pour un site personnel à faible trafic.

### Estimation mensuelle

Ordre de grandeur pour un site léger, peu de requêtes et peu de transfert :

- S3 (stockage et requêtes) : généralement moins de 1 EUR ;
- CloudFront (requêtes et transfert) : de quelques centimes à quelques euros ;
- total indicatif : **environ 1 à 5 EUR par mois**.

Le domaine est exclu. La région, le trafic, les invalidations et les taxes
modifient le montant réel. Consulter AWS Pricing Calculator et configurer un
budget avant un déploiement.

## Vérifier Terraform sans compte AWS

```bash
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend=false
terraform -chdir=terraform validate
checkov -d terraform --config-file .checkov.yml
```

Ces commandes n'appellent pas AWS et sont aussi exécutées par la CI.

## Déployer manuellement sur AWS

Prérequis : Terraform, AWS CLI et une identité AWS autorisée. Aucun déploiement
n'est exécuté automatiquement.

Créer d'abord un bucket séparé pour l'état Terraform, avec blocage public,
versioning et chiffrement. Créer ensuite un fichier `backend.hcl` non suivi :

```hcl
bucket       = "mon-bucket-etat-terraform"
key          = "curtis-portfolio/terraform.tfstate"
region       = "eu-west-3"
encrypt      = true
use_lockfile = true
```

Puis :

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
terraform -chdir=terraform init -backend-config=../backend.hcl
terraform -chdir=terraform plan -out=portfolio.tfplan
terraform -chdir=terraform apply portfolio.tfplan

BUCKET="$(terraform -chdir=terraform output -raw bucket_name)"
DISTRIBUTION="$(terraform -chdir=terraform output -raw cloudfront_distribution_id)"
aws s3 cp index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache" --content-type "text/html"
aws s3 sync assets "s3://$BUCKET/assets" \
  --delete --cache-control "public,max-age=604800,immutable"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*"
terraform -chdir=terraform output -raw site_url
```

### Domaine personnalisé

Le domaine est désactivé par défaut. Pour l'activer, fournir un certificat ACM
existant en `us-east-1` :

```hcl
enable_custom_domain = true
domain_name          = "exemple.fr"
acm_certificate_arn  = "arn:aws:acm:us-east-1:..."
```

Le DNS reste à configurer séparément vers la distribution CloudFront.

### GitHub Actions et OIDC

Le workflow `AWS manual` ne démarre que via `workflow_dispatch`. Il reste sans
effet tant que ces variables de dépôt ne sont pas définies :

- `AWS_DEPLOY_ROLE_ARN` : rôle assumable via GitHub OIDC ;
- `TF_STATE_BUCKET` : bucket d'état séparé ;
- `AWS_REGION` : région, `eu-west-3` par défaut.

Limiter la trust policy du rôle au dépôt et à l'environnement GitHub
`aws-portfolio`. Protéger cet environnement par une approbation. L'opération
`apply` exige en plus la saisie exacte de `DEPLOY`. Aucune access key statique
n'est attendue.

## Détruire

Le bucket du site utilise `prevent_destroy = true` et `force_destroy = false`.
Cette double protection évite une suppression involontaire. Pour une destruction
réellement voulue :

1. sauvegarder ce qui doit l'être et vider toutes les versions du bucket ;
2. remplacer temporairement `prevent_destroy = true` par `false` ;
3. contrôler puis appliquer un plan de destruction :

```bash
terraform -chdir=terraform plan -destroy -out=destroy.tfplan
terraform -chdir=terraform apply destroy.tfplan
```

Remettre ensuite la protection dans le code. Le bucket d'état Terraform est
indépendant et n'est pas détruit par ce projet.

## Licence

Code publié sous licence MIT. Le contenu biographique reste à valider par son
auteur avant publication.
