# VOGT HIGH TECH — Digital Campus (Frontend)

Site public + portails candidat/étudiant en **HTML/CSS/JS vanilla**, dans la
même logique que vos autres projets (TransCam) — pas de framework, un client
API central (`js/api.js`) qui consomme le backend Spring Boot.

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Homepage publique — formations, actualités, événements chargés dynamiquement |
| `formation.html?slug=...` | Détail d'une formation |
| `actualite.html?slug=...` | Détail d'un article |
| `auth.html` | Connexion / création de compte candidat |
| `candidat.html` | Portail candidat — création de candidature, suivi, upload de documents |
| `etudiant.html` | Portail étudiant — profil, emploi du temps, notes, scolarité |

## Configuration

Le frontend appelle l'API sur `http://localhost:8080/api/v1` par défaut.
Pour changer l'URL (staging/production), ajoutez avant `js/api.js` dans chaque
page :

```html
<script>window.VOGT_API_BASE_URL = "https://api.vogthightech.cm/api/v1";</script>
<script src="js/api.js"></script>
```

## Démarrage local

Le backend doit tourner sur `http://localhost:8080` (voir le README du
backend). Servez ensuite ce dossier avec n'importe quel serveur statique,
par exemple :

```bash
npx serve .
# ou
python3 -m http.server 3000
```

Puis ouvrez `http://localhost:3000`.

## Principe "zero hardcode" respecté côté front aussi

Aucune formation, actualité, événement, partenaire ou montant n'est écrit en
dur dans le HTML/JS : tout est chargé via `js/api.js` depuis les endpoints
publics du backend (`/public/programs`, `/public/news`, `/public/events/upcoming`,
`/public/partners`, `/public/projects`). Si l'administration n'a encore rien
publié, les sections affichent un état vide plutôt qu'un faux contenu.

## Ce qui manque encore (à construire selon vos priorités)

- **VOGT ADMIN** (interface CMS) — actuellement seule l'API admin existe
  (`/api/v1/admin/**`) ; il n'y a pas encore d'écran d'administration.
  C'est la pièce la plus importante à ajouter ensuite pour que l'établissement
  puisse gérer le contenu sans coder.
- Portail enseignant (l'API existe : `/api/v1/teachers/me/**`)
- Pages Campus, Vie étudiante, Innovation/Labs, Galerie, À propos, Contact
  (statiques ou dynamiques selon le contenu réel disponible)
- i18n FR/EN (actuellement FR uniquement)
- Recherche globale, chatbot "Vogt AI"

## Design

Système de design partagé dans `css/theme.css`, basé sur le thème
**"Minimal tech"** de votre `palettes.css` (variables CSS : `--color-primary`,
`--color-accent`, etc.). Aucune couleur n'est codée en dur dans les pages —
changer de thème revient à ne modifier que `theme.css`.
