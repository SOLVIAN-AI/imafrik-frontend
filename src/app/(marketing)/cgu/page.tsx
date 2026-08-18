import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export const metadata = legalMetadata(
  "Conditions d’utilisation",
  "Objet du service, comptes et accès, responsabilités, disponibilité et résiliation.",
);

/**
 * Conditions générales d’utilisation.
 *
 * ⚠️ **Projet, à faire relire par un conseil avant mise en ligne.**
 *
 * Le point sensible est l’article sur la responsabilité médicale : il
 * doit énoncer sans ambiguïté qu’IMAFRIK transporte et trace, et que
 * l’interprétation engage le radiologue signataire. Une formulation
 * floue à cet endroit exposerait les trois parties.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Conditions d’utilisation" updatedAt="18 août 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l’accès au service IMAFRIK et son
        utilisation. Elles complètent le contrat de service conclu entre
        SOLVIAN AI LLC et l’établissement ou le praticien, qui prévaut en cas
        de contradiction.
      </p>

      <h2>2. Accès et comptes</h2>
      <p>
        L’accès se fait sur invitation nominative. Un compte est personnel : il
        ne peut être partagé, ni rattaché à un poste ou à un service. Le
        titulaire est responsable de la confidentialité de ses identifiants et
        signale sans délai toute utilisation qu’il n’aurait pas autorisée.
      </p>
      <p>
        Chaque accès à un examen est enregistré et rattaché au compte utilisé.
        Le partage d’un compte rendrait cette traçabilité inopérante et
        constitue un manquement grave.
      </p>

      <h2>3. Usage du service</h2>
      <p>L’utilisateur s’engage à :</p>
      <ul>
        <li>
          ne transmettre que des examens pour lesquels son établissement
          dispose d’une base légale de traitement ;
        </li>
        <li>
          n’accéder qu’aux examens que sa mission justifie de consulter ;
        </li>
        <li>
          ne pas extraire, copier ou diffuser d’images ou de comptes-rendus en
          dehors des finalités prévues ;
        </li>
        <li>
          ne pas tenter de contourner les mesures techniques de cloisonnement
          ou de journalisation.
        </li>
      </ul>

      <h2>4. Responsabilité médicale</h2>
      <p>
        IMAFRIK assure la transmission, la conservation, la mise à disposition
        et la traçabilité des examens et des comptes-rendus.{" "}
        <strong>
          L’interprétation d’un examen et le contenu du compte-rendu relèvent
          de la seule responsabilité du médecin radiologue qui le signe
        </strong>
        , dans les mêmes conditions qu’une lecture réalisée sur place.
      </p>
      <p>
        Le médecin prescripteur conserve la responsabilité de l’indication, de
        la prise en charge du patient et de l’exploitation du compte-rendu.
        Aucun élément du service ne constitue un avis médical de la part de
        SOLVIAN AI LLC.
      </p>

      <h2>5. Qualité des données transmises</h2>
      <p>
        La qualité de l’interprétation dépend de celle des images et des
        renseignements cliniques transmis. L’établissement s’assure de la
        conformité des acquisitions et de l’exactitude de l’identité du
        patient. Une erreur d’identité à l’acquisition se propage à tout le
        parcours.
      </p>

      <h2>6. Disponibilité</h2>
      <p>
        Le service est accessible en continu, sous réserve des opérations de
        maintenance, annoncées à l’avance lorsqu’elles sont programmées. Les
        engagements de disponibilité et de délai figurent au contrat de
        service. En cas d’indisponibilité affectant une urgence, la procédure
        de repli convenue au contrat s’applique.
      </p>

      <h2>7. Comptes-rendus signés</h2>
      <p>
        Un compte-rendu signé est verrouillé et ne peut plus être modifié.
        Toute correction prend la forme d’un addendum, daté, signé et visible
        de l’établissement. Chaque document porte un code permettant d’en
        vérifier l’authenticité sur la page de vérification publique.
      </p>

      <h2>8. Résiliation et réversibilité</h2>
      <p>
        Les conditions de résiliation figurent au contrat. À son terme,
        l’établissement peut demander l’export de ses examens et de ses
        comptes-rendus aux formats DICOM et PDF. Les données sont ensuite
        supprimées selon le calendrier convenu.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit [droit applicable].
        Tout litige relève de la compétence [juridiction compétente], après
        recherche d’une solution amiable.
      </p>
    </LegalPage>
  );
}
