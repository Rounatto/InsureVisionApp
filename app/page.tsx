// =====================================================
// PAGE D'ACCUEIL - INSURE VISION AI
// =====================================================
// 
// ARCHITECTURE DU THÈME DYNAMIQUE :
// ---------------------------------
// 1. Le conteneur principal #home-container reçoit la classe "dark" du HomeThemeSwitcher
// 2. Le CSS dans globals.css utilise des sélecteurs directs (#home-container.dark)
// 3. Tous les éléments enfants réagissent au changement de classe du container
//
// POURQUOI CETTE APPROCHE ?
// - Les classes Tailwind "dark:" nécessitent que la classe "dark" soit sur <html>
// - Notre theme switcher applique "dark" sur #home-container (scope limité à cette page)
// - Solution : CSS personnalisé avec sélecteurs directs pour cibler les éléments
//
// CHANGEMENTS DYNAMIQUES :
// - Navigation : Noire (light) → Blanche (dark)
// - Textes/Logo nav : Blancs (light) → Noirs (dark)
// - Background page : Gradient blanc-gris (light) → Gradient noir-gris foncé (dark)
// - Boutons/Cartes : Adaptés automatiquement via les styles CSS personnalisés
//
// =====================================================

// Importations nécessaires
import Link from "next/link"; // Composant Next.js pour les liens (navigation sans rechargement)
import InsureVisionLogo from "@/components/InsureVisionLogo"; // Logo de l'application
import { HomeThemeSwitcher } from "@/components/home-theme-switcher"; // Composant pour changer le thème UNIQUEMENT sur la page d'accueil

// Fonction principale de la page d'accueil - c'est ce que voient les utilisateurs en arrivant sur le site
export default function Home() {
  return (
    // ===== CONTENEUR PRINCIPAL =====
    // ID "home-container" : Cible pour le HomeThemeSwitcher
    // La classe 'dark' sera ajoutée/supprimée dynamiquement sur ce div
    <div id="home-container" className="min-h-screen">
      {/* ======================== NAVIGATION BAR ======================== */}
      {/* 
       * BARRE DE NAVIGATION DYNAMIQUE
       * -------------------------------
       * ID "home-nav" : Permet au CSS de cibler cet élément
       * 
       * COMPORTEMENT :
       * - Light mode : Fond NOIR (défini dans globals.css : #home-nav)
       * - Dark mode : Fond BLANC (défini dans globals.css : #home-container.dark #home-nav)
       * 
       * CLASSES :
       * - sticky top-0 : Reste en haut lors du scroll
       * - z-50 : Au-dessus des autres éléments
       * - backdrop-blur-lg : Effet de flou derrière la nav (look moderne)
       * - border-b : Bordure en bas pour séparer du contenu
       */}
      <nav id="home-nav" className="sticky top-0 z-50 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* ===== CÔTÉ GAUCHE : LOGO + NOM DE L'APP ===== */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            {/* 
             * LOGO SVG DYNAMIQUE
             * ------------------
             * Classe "nav-logo" : Ciblée par le CSS pour changer de couleur
             * - Light mode : Blanc (via #home-nav .nav-logo)
             * - Dark mode : Noir (via #home-container.dark #home-nav .nav-logo)
             */}
            <InsureVisionLogo className="nav-logo" />
            
            {/* 
             * NOM DE L'APPLICATION
             * --------------------
             * Classe "nav-text" : Change de couleur comme le logo
             * hidden sm:inline : Caché sur mobile, visible sur écrans moyens et +
             */}
            <span className="nav-text font-bold text-xl hidden sm:inline">InsureVision AI</span>
          </Link>

          {/* ===== CÔTÉ DROIT : BOUTONS DE NAVIGATION ET THEME SWITCHER ===== */}
          <div className="flex items-center gap-4">
            {/* 
             * BOUTON CONNEXION
             * ----------------
             * Classe "nav-connexion" : Applique les styles dynamiques du CSS
             * - Light mode : Texte blanc, hover fond gris foncé
             * - Dark mode : Texte noir, hover fond gris clair
             * Redirige vers /login
             */}
            <Link
              href="/login"
              className="nav-connexion px-4 py-2 rounded-lg transition"
            >
              Connexion
            </Link>

            {/* 
             * BOUTON S'INSCRIRE
             * -----------------
             * Style fixe : Fond bleu avec texte blanc (ne change PAS selon le thème)
             * C'est le bouton d'action principal (CTA - Call To Action)
             * Redirige vers /register
             */}
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
            >
              S&apos;inscrire
            </Link>

            {/* 
             * SÉPARATEUR + THEME SWITCHER
             * ----------------------------
             * Classe "nav-separator" : Ligne verticale qui change de couleur
             * - Light mode : Gris foncé (visible sur fond noir)
             * - Dark mode : Gris clair (visible sur fond blanc)
             * 
             * HomeThemeSwitcher : Le bouton qui bascule entre les thèmes
             * - containerId="home-container" : Indique sur quel élément appliquer la classe "dark"
             */}
            <div className="nav-separator pl-4 border-l">
              <HomeThemeSwitcher containerId="home-container" />
            </div>
          </div>
        </div>
      </nav>

      {/* ======================== HERO SECTION (Section principale) ======================== */}
      {/* C'est la première chose que voient les visiteurs - elle explique ce que fait l'app */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Colonne gauche: Texte et boutons */}
          <div>
            {/* Titre principal avec gradient de couleur */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Estimez les dégâts de votre voiture en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                quelques secondes {/* Ce texte a un dégradé bleu-cyan */}
              </span>
            </h1>

            {/* Description courte de ce que fait l'app */}
            <p className="text-lg hero-description mb-8 leading-relaxed">
              Utilisez l&apos;intelligence artificielle pour obtenir une estimation précise des coûts de réparation. Simplement photographiez les dégâts et obtenez un rapport complet.
            </p>

            {/* ===== BOUTONS D'ACTION ===== */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 
               * BOUTON PRINCIPAL : "Commencer maintenant"
               * -----------------------------------------
               * Style fixe : Bleu avec texte blanc (CTA principal)
               * Action : Redirige vers la page d'inscription
               */}
              <Link
                href="/register"
                className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-center"
              >
                Commencer maintenant
              </Link>

              {/* 
               * BOUTON SECONDAIRE : "En savoir plus"
               * ------------------------------------
               * PROBLÈME RÉSOLU : En light mode, au hover le fond devenait gris clair
               * et le texte restait noir → texte invisible !
               * 
               * SOLUTION :
               * - hover:bg-gray-900 : Fond NOIR au hover (au lieu de gray-50)
               * - hover:text-white : Texte BLANC au hover pour contraster
               * 
               * RÉSULTAT :
               * - Light mode : Bordure grise, fond transparent → Au hover : fond noir + texte blanc
               * - Dark mode : Bordure grise, fond transparent → Au hover : fond gris foncé + texte blanc
               * 
               * Classes utilisées :
               * - text-foreground : Couleur du texte par défaut (noir en light, blanc en dark)
               * - border-gray-300 dark:border-gray-700 : Bordure adaptée au thème
               */}
              <button className="px-8 py-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-foreground font-semibold hover:bg-gray-900 hover:text-white dark:hover:bg-gray-800 transition">
                En savoir plus
              </button>
            </div>
          </div>

          {/* Colonne droite: Image/illustration placeholder */}
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">📱 Interface d&apos;analyse des dégâts</p>
              {/* À remplacer par une vraie image */}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== COMMENT ÇA MARCHE (3 étapes) ======================== */}
      {/* Cette section explique le processus en 3 étapes simples */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de la section */}
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Comment ça marche ?</h2>
          {/* Sous-titre explicatif */}
          <p className="text-center text-gray-700 dark:text-gray-300 mb-16 max-w-2xl mx-auto">
            Trois étapes simples pour obtenir une estimation fiable en moins d&apos;une minute.
          </p>
          
          {/* Grille de 3 colonnes pour les étapes */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* ÉTAPE 1: Prendre une photo */}
            <div className="text-center">
              {/* Icône circulaire avec fond coloré */}
              <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6 text-4xl">
                📸
              </div>
              <h3 className="text-xl font-bold mb-3">Prenez une photo</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Photographiez les dégâts de votre véhicule sous différents angles pour une analyse complète.
              </p>
            </div>

            {/* ÉTAPE 2: L'IA analyse */}
            <div className="text-center">
              {/* Icône circulaire avec fond coloré différent */}
              <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-6 text-4xl">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-3">L&apos;IA analyse</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Notre intelligence artificielle examine les images et évalue l&apos;ampleur des dégâts en profondeur.
              </p>
            </div>

            {/* ÉTAPE 3: Obtenir une estimation */}
            <div className="text-center">
              {/* Icône circulaire avec fond coloré vert */}
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6 text-4xl">
                💰
              </div>
              <h3 className="text-xl font-bold mb-3">Obtenez une estimation</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Recevez un rapport détaillé avec le coût estimé des réparations et les pièces affectées.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== AVANTAGES DE L'APP ======================== */}
      {/* Cette section liste 4 avantages clés avec icônes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Pourquoi choisir InsureVision ?</h2>
        
        {/* Grille de 2 colonnes pour les avantages */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* AVANTAGE 1: Rapide */}
          <div className="flex gap-4">
            {/* Icône avec fond coloré */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            {/* Texte descriptif */}
            <div>
              <h3 className="text-xl font-bold mb-2">Rapide</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Obtenez une estimation en moins d&apos;une minute sans avoir à vous déplacer chez un garagiste.
              </p>
            </div>
          </div>

          {/* AVANTAGE 2: Précis */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Précis</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Grâce à l&apos;IA avancée, nos estimations ont une précision exceptionnelle comparée aux méthodes traditionnelles.
              </p>
            </div>
          </div>

          {/* AVANTAGE 3: Sécurisé */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Sécurisé</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Vos données sont chiffrées et protégées. Aucun partage sans votre consentement.
              </p>
            </div>
          </div>

          {/* AVANTAGE 4: Accessible 24/7 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Accessible 24/7</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Disponible sur tous les appareils, n&apos;importe quand, n&apos;importe où pour vos besoins d&apos;assurance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATISTIQUES ======================== */}
      {/* Section avec fond coloré affichant des chiffres impressionnants */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grille de 3 colonnes pour afficher les stats */}
          <div className="grid md:grid-cols-3 gap-8 text-white text-center">
            {/* Stat 1: Utilisateurs */}
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">50K+</div>
              <p className="text-lg opacity-90">Utilisateurs satisfaits</p>
            </div>

            {/* Stat 2: Sinistres estimés */}
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">100K+</div>
              <p className="text-lg opacity-90">Sinistres estimés</p>
            </div>

            {/* Stat 3: Note moyenne */}
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">4.8/5</div>
              <p className="text-lg opacity-90">Note moyenne</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== FAQ (Questions Fréquemment Posées) ======================== */}
      {/* 
       * SECTION FAQ AVEC ACCORDÉONS INTERACTIFS
       * ----------------------------------------
       * Chaque question est un élément <details> qui se déplie au clic.
       * 
       * PROBLÈME RÉSOLU : Même problème que le bouton "En savoir plus"
       * En light mode, au hover :
       * - Ancien comportement : bg-gray-50 (gris clair) + texte noir → texte invisible
       * - Nouveau comportement : bg-gray-900 (noir) + texte blanc → bien visible
       * 
       * SOLUTION APPLIQUÉE :
       * 1. hover:bg-gray-900 : Fond noir au hover (au lieu de gray-50)
       * 2. group-hover:text-white : Le texte du titre devient blanc au hover
       * 
       * UTILISATION DU "group" :
       * - "group" sur <details> : Définit un groupe d'éléments liés
       * - "group-hover:text-white" sur <summary> : Change la couleur quand on survole le group
       * - "group-open:rotate-180" : Fait tourner la flèche quand l'accordéon est ouvert
       * 
       * RÉSULTAT :
       * - Light mode : Fond transparent → Au hover : fond noir + titre blanc (bien visible)
       * - Dark mode : Fond transparent → Au hover : fond gris foncé + titre blanc (bien visible)
       */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Questions fréquemment posées</h2>
        
        {/* Conteneur des questions */}
        <div className="space-y-6">
          {/* ===== QUESTION 1 ===== */}
          <details className="group border border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-900 dark:hover:bg-gray-900 transition">
            {/* En-tête cliquable avec flèche */}
            <summary className="font-bold text-lg flex justify-between items-center group-hover:text-white">
              Qu&apos;est-ce qu&apos;InsureVision ?
              <span className="group-open:rotate-180 transition">➔</span> {/* Flèche qui tourne au clic */}
            </summary>
            {/* Réponse cachée jusqu'au clic */}
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              InsureVision est une application d&apos;intelligence artificielle qui analyse les photos de dégâts automobiles et fournit une estimation précise des coûts de réparation en quelques secondes.
            </p>
          </details>

          {/* ===== QUESTION 2 ===== */}
          <details className="group border border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-900 dark:hover:bg-gray-900 transition">
            <summary className="font-bold text-lg flex justify-between items-center group-hover:text-white">
              Comment l&apos;IA évalue-t-elle les dégâts ?
              <span className="group-open:rotate-180 transition">➔</span>
            </summary>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Notre IA utilise la vision par ordinateur et l&apos;apprentissage automatique pour analyser les images. Elle identifie les zones endommagées, évalue la gravité et estime les coûts basés sur une base de données de réparations.
            </p>
          </details>

          {/* QUESTION 3 */}
          <details className="group border border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-900 dark:hover:bg-gray-900 transition">
            <summary className="font-bold text-lg flex justify-between items-center group-hover:text-white">
              Mes données sont-elles sécurisées ?
              <span className="group-open:rotate-180 transition">➔</span>
            </summary>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Oui, vos données sont chiffrées en transit et au repos. Nous respectons les normes RGPD et ne partageons jamais vos informations sans consentement explicite.
            </p>
          </details>

          {/* QUESTION 4 */}
          <details className="group border border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-900 dark:hover:bg-gray-900 transition">
            <summary className="font-bold text-lg flex justify-between items-center group-hover:text-white">
              Combien ça coûte ?
              <span className="group-open:rotate-180 transition">➔</span>
            </summary>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              InsureVision est gratuit pour les trois premières estimations. Après cela, nous proposons des plans d&apos;abonnement flexibles à partir de 9,99€/mois.
            </p>
          </details>

          {/* QUESTION 5 */}
          <details className="group border border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-900 dark:hover:bg-gray-900 transition">
            <summary className="font-bold text-lg flex justify-between items-center group-hover:text-white">
              Quelle est la précision des estimations ?
              <span className="group-open:rotate-180 transition">➔</span>
            </summary>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Nos estimations ont une précision moyenne de 95% comparée aux devis professionnels. La qualité des photos affecte la précision, donc plusieurs angles aident.
            </p>
          </details>
        </div>
      </section>

      {/* ======================== APPEL À L'ACTION FINAL ======================== */}
      {/* Dernière section pour encourager les inscriptions */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Titre */}
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Prêt à débuter ?</h2>
          {/* Description */}
          <p className="text-lg opacity-90 mb-8 text-gray-100 dark:text-gray-100">
            Créez votre compte maintenant et obtenez votre première estimation gratuitement.
          </p>
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Bouton principal - S'inscrire */}
            <Link
              href="/register"
              className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              S&apos;inscrire gratuitement
            </Link>
            {/* Bouton secondaire - Contact */}
            <button className="px-8 py-4 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-gray-900 transition">
              Contacter le support
            </button>
          </div>
        </div>
      </section>

      {/* ======================== FOOTER (Pied de page) ======================== */}
      {/* Dernière section avec liens utiles et copyright */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Grille de 4 colonnes avec différentes catégories de liens */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Colonne 1: À propos */}
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-foreground transition">À propos</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Carrières</a></li>
              </ul>
            </div>

            {/* Colonne 2: Support */}
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-foreground transition">Aide</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition">FAQ</a></li>
              </ul>
            </div>

            {/* Colonne 3: Légal */}
            <div>
              <h4 className="font-bold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-foreground transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-foreground transition">Conditions</a></li>
                <li><a href="#" className="hover:text-foreground transition">Cookies</a></li>
              </ul>
            </div>

            {/* Colonne 4: Réseaux sociaux */}
            <div>
              <h4 className="font-bold mb-4">Suivez-nous</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                <li><a href="#" className="hover:text-foreground transition">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-foreground transition">Facebook</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright et droits d'auteur */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-700 dark:text-gray-400">
            <p>&copy; 2026 InsureVision. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}