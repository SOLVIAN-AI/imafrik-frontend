/**
 * Guides pas à pas de l'aide : les procédures qui dépassent un écran.
 *
 * Proposés dans « Pour aller plus loin » par les écrans qui les citent
 * (`guides` d'une page de `help-pages.ts`) et trouvés par la recherche.
 * Les étapes reprennent les libellés exacts de la tour de contrôle et le
 * mode d'emploi du kit (`LISEZ-MOI.txt` du dépôt backend) : à tenir à
 * jour avec eux.
 */
export const guides = {
  onboardClinic: {
    title: "Raccorder une nouvelle clinique",
    intro:
      "De la création de la clinique à son premier examen reçu, en une vingtaine de minutes au téléphone avec elle. Aucun fichier de clés ne circule : la clé naît sur le poste de la clinique, et un code à usage unique suffit à le raccorder.",
    sections: [
      {
        title: "Créer la clinique, dans la tour de contrôle",
        steps: [
          "Organisations, « Nouvelle clinique » : saisissez le nom de l’établissement, la ville et la langue des comptes-rendus, qui sera aussi celle des invitations.",
          "Indiquez ses responsables, un au moins : ils enverront les examens et géreront l’équipe. Choisissez qui lit ses examens : ses propres radiologues, à inviter aussi, ou les « Radiologues du réseau IMAFRIK ».",
          "Cliquez sur « Créer et inviter l’équipe » : chacun reçoit un lien par courriel et choisit son mot de passe, puis la fiche s’ouvre. Une invitation qui n’est pas partie se refait aussitôt.",
        ],
      },
      {
        title: "Préparer le poste, avant le rendez-vous",
        steps: [
          "Faites préparer par la clinique un ordinateur Windows 10 (version 1809 ou plus récente) ou 11, 64 bits, allumé en permanence, sur le réseau des appareils, avec 100 Go libres et une adresse IP fixe.",
          "Faites-y installer Orthanc (orthanc-server.com, « Windows installer », options par défaut) et vérifier que le pare-feu laisse sortir HTTPS, port 443.",
          "Passerelles, « Télécharger le kit », puis « Copier l’empreinte » : gardez cette empreinte. Transmettez le kit à la clinique, par téléchargement ou sur une clé USB.",
        ],
      },
      {
        title: "Installer la passerelle, en ligne avec la clinique",
        steps: [
          "Sur le poste, vérifiez le kit : `certutil -hashfile kit-passerelle.zip SHA256` doit afficher l’empreinte copiée. Si elle diffère, ne l’installez pas et retéléchargez-le.",
          "Faites débloquer le fichier (clic droit, « Propriétés », « Débloquer »), extraire le kit, puis lancer « INSTALLER.bat » en acceptant la demande d’autorisation de Windows.",
          "Si Windows signale un éditeur inconnu, tant que le kit n’est pas signé : « Informations complémentaires », puis « Exécuter quand même ».",
          "Fiche de la clinique, « Raccorder une passerelle », « Émettre un code » : dictez-le à l’installateur, qui le saisit. Il vaut 15 minutes et ne sert qu’une fois.",
          "Dans « Passerelles », le poste apparaît « En attente d’approbation » : vérifiez son nom avec la clinique, puis cliquez sur « Approuver ».",
          "L’installateur active la passerelle et fait un essai DICOM réel. Faites noter le mot de passe de l’interface locale : il ne s’affiche qu’une fois.",
        ],
      },
      {
        title: "Mettre en service",
        steps: [
          "Sur la console d’imagerie, déclarez la destination indiquée sur la fiche « IMAFRIK - aide de la passerelle » du Bureau : adresse IP du poste, port 4242, AE Title IMAFRIK.",
          "Faites envoyer un examen ancien, puis vérifiez son arrivée dans « Flux d’images » ou sur la fiche de la clinique. Chaque série part une minute après sa dernière image.",
          "Contrôlez la « Mise en service » sur la fiche de la clinique : toutes ses étapes doivent être franchies.",
        ],
      },
    ],
  },
  weasis: {
    title: "Lire un examen dans Weasis",
    intro:
      "Weasis, visualiseur DICOM libre des Hôpitaux universitaires de Genève, s’installe sur l’ordinateur et s’ouvre depuis l’écran de lecture, à côté du viewer. Il reçoit cet examen seul, avec le même accès que le viewer, sans import, export ni envoi, et garde ses images sur le poste jusqu’à sa fermeture.",
    sections: [
      {
        title: "Installer Weasis, une fois par ordinateur",
        steps: [
          "Ouvrez la page de téléchargement officielle, weasis.org/en/getting-started/download-dicom-viewer, ou cliquez sur « Télécharger Weasis (site officiel) » dans l’aide de l’écran de lecture.",
          "Choisissez l’installateur de votre système : Windows 10 ou 11 (.msi), macOS (.pkg, puce Apple ou Intel) ou Linux (.deb, .rpm). Weasis n’existe ni pour tablette ni pour téléphone.",
          "Installez-le avec les options par défaut ; sur un poste géré, votre service informatique peut avoir à le faire. Aucun autre logiciel n’est nécessaire.",
        ],
      },
      {
        title: "Ouvrir un examen",
        steps: [
          "Dans l’écran de lecture, sous les images, cliquez sur « Ouvrir dans Weasis » (l’icône d’écran, sur un écran étroit).",
          "Acceptez la demande du navigateur d’ouvrir Weasis ; vous pouvez l’autoriser pour toujours sur ce site.",
          "Weasis s’ouvre dans un profil IMAFRIK, à part de votre Weasis habituel : il ferme l’examen qu’il affichait, ouvre celui-ci et télécharge ses images. Le lien vaut cinq minutes et ne sert qu’une fois.",
          "Weasis ouvert depuis IMAFRIK n’importe rien, ni fichier, ni CD, ni autre image : n’y déposez aucun fichier ni dossier, pour ne jamais mêler les images d’un autre patient à l’examen lu.",
          "Weasis ne reçoit que les images : le son, les documents (PDF), la vidéo et les comptes rendus structurés se consultent dans le visualiseur d’IMAFRIK, et un examen sans image ne s’ouvre pas dans Weasis.",
          "Si rien ne s’ouvre, l’aide s’affiche : Weasis n’est sans doute pas installé sur cet ordinateur.",
        ],
      },
      {
        title: "Après la lecture",
        steps: [
          "Rédigez et signez le compte-rendu dans IMAFRIK : Weasis ne sert qu’à afficher les images.",
          "Fermez Weasis : il efface alors les images téléchargées. Après un arrêt brutal, il les efface à son démarrage suivant.",
          "Vous perdez l’accès à l’examen, ou vous vous déconnectez : Weasis ne peut plus en télécharger d’image dans les secondes qui suivent.",
        ],
      },
      {
        title: "Ce que demande le contrat d’exercice",
        steps: [
          "Ouvrez Weasis sur un ordinateur au disque chiffré, dans une session personnelle que nul autre n’utilise.",
          "Un examen à la fois, et Weasis fermé à la fin de chaque lecture.",
          "Aucune copie : ni capture ou photo de l’écran, ni impression, ni copie du dossier temporaire où Weasis garde les images. Weasis ouvert depuis IMAFRIK n’offre d’ailleurs ni import, ni export, ni envoi.",
          "L’accès remis à Weasis est le vôtre, pour cet examen : ne le copiez pas et ne le confiez à aucun autre logiciel.",
          "Chaque ouverture est tracée à votre nom et peut être contrôlée ; un manquement suspend vos accès (article 9 du contrat).",
        ],
      },
    ],
  },
};
