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
};
