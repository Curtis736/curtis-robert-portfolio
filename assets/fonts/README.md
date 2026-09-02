# Polices

Trois familles, hébergées ici plutôt que chargées depuis un service tiers : le
site ne fait donc aucune requête sortante au chargement.

| Famille          | Fichiers                       | Usage                        |
| ---------------- | ------------------------------ | ---------------------------- |
| Geist            | fonte variable, 100 à 900      | titres et texte courant      |
| Geist Mono       | fonte variable, 100 à 900      | micro-libellés capitalisés   |
| Instrument Serif | romain et italique, graisse 400 | incises en italique          |

Seuls les sous-ensembles `latin` et `latin-ext` sont embarqués, soit 144 Ko au
total. Les déclarations `@font-face` se trouvent en tête de
`assets/css/styles.css`, avec les plages `unicode-range` correspondantes.

## Licences

Les deux projets sont publiés sous SIL Open Font License 1.1, qui autorise
l'hébergement et la redistribution avec les fichiers.

- Geist et Geist Mono — <https://github.com/vercel/geist-font>
- Instrument Serif — <https://github.com/Instrument/instrument-serif>
