import { LegalPage } from "@/components/marketing/legal-page";
import type { Locale } from "@/lib/i18n/locale";
import { PUBLISHER } from "@/lib/legal";

/** Titre de la page, dans chaque langue. */
export const TERMS_TITLE: Record<Locale, string> = {
  fr: "Conditions d’utilisation",
  en: "Terms of use",
};

/** Description de la page, dans chaque langue. */
export const TERMS_DESCRIPTION: Record<Locale, string> = {
  fr: "Objet du service, comptes et accès, responsabilités, disponibilité et résiliation.",
  en: "Purpose of the service, accounts and access, responsibilities, availability and termination.",
};

/**
 * Conditions générales d’utilisation.
 *
 * ⚠️ **Projet, à faire relire par un conseil avant mise en ligne**, dans
 * les deux langues.
 *
 * Le point sensible est l’article sur la responsabilité médicale : il
 * doit énoncer sans ambiguïté qu’IMAFRIK transporte et trace, et que
 * l’interprétation engage le radiologue signataire. Une formulation
 * floue à cet endroit exposerait les trois parties.
 *
 * @param locale Langue de la page.
 */
export function Terms({ locale }: { locale: Locale }) {
  return (
    <LegalPage locale={locale} title={TERMS_TITLE[locale]}>
      {locale === "en" ? <English /> : <French />}
    </LegalPage>
  );
}

function French() {
  return (
    <>
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l’accès au service IMAFRIK et son
        utilisation. Elles complètent le contrat de service conclu entre{" "}
        {PUBLISHER.name} et l’établissement ou le praticien, qui prévaut en cas
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
          ne transmettre que des examens pour lesquels son établissement dispose
          d’une base légale de traitement ;
        </li>
        <li>n’accéder qu’aux examens que sa mission justifie de consulter ;</li>
        <li>
          ne pas extraire, copier ou diffuser d’images ou de comptes-rendus en
          dehors des finalités prévues ;
        </li>
        <li>
          ne pas tenter de contourner les mesures techniques de cloisonnement ou
          de journalisation.
        </li>
      </ul>

      <h2>4. Responsabilité médicale</h2>
      <p>
        IMAFRIK assure la transmission, la conservation, la mise à disposition
        et la traçabilité des examens et des comptes-rendus.{" "}
        <strong>
          L’interprétation d’un examen et le contenu du compte-rendu relèvent de
          la seule responsabilité du médecin radiologue qui le signe
        </strong>
        , dans les mêmes conditions qu’une lecture réalisée sur place.
      </p>
      <p>
        Le médecin prescripteur conserve la responsabilité de l’indication, de
        la prise en charge du patient et de l’exploitation du compte-rendu.
        Aucun élément du service ne constitue un avis médical de la part de{" "}
        {PUBLISHER.name}.
      </p>

      <h2>5. Qualité des données transmises</h2>
      <p>
        La qualité de l’interprétation dépend de celle des images et des
        renseignements cliniques transmis. L’établissement s’assure de la
        conformité des acquisitions et de l’exactitude de l’identité du patient.
        Une erreur d’identité à l’acquisition se propage à tout le parcours.
      </p>

      <h2>6. Disponibilité</h2>
      <p>
        Le service est accessible en continu, sous réserve des opérations de
        maintenance, annoncées à l’avance lorsqu’elles sont programmées. Les
        engagements de disponibilité et de délai figurent au contrat de service.
        En cas d’indisponibilité affectant une urgence, la procédure de repli
        convenue au contrat s’applique.
      </p>

      <h2>7. Comptes-rendus signés</h2>
      <p>
        Un compte-rendu signé est verrouillé et ne peut plus être modifié. Toute
        correction prend la forme d’un addendum, daté, signé et visible de
        l’établissement. Chaque document porte un code permettant d’en vérifier
        l’authenticité sur la page de vérification publique.
      </p>

      <h2>8. Résiliation et réversibilité</h2>
      <p>
        Les conditions de résiliation figurent au contrat. À tout moment, et en
        particulier à son terme, l’établissement peut demander l’export de ses
        examens et de ses comptes-rendus : images DICOM, comptes-rendus signés
        en PDF et manifeste d’empreintes permettant d’en vérifier l’intégrité.
        La suite, conservation ou suppression, obéit aux durées fixées au
        contrat.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        {PUBLISHER.governingLaw
          ? `Les présentes conditions sont soumises au ${PUBLISHER.governingLaw.fr}. `
          : "Le droit applicable et la juridiction compétente sont ceux que désigne le contrat de service. "}
        Tout litige est d’abord soumis à la recherche d’une solution amiable.
      </p>
    </>
  );
}

function English() {
  return (
    <>
      <h2>1. Purpose</h2>
      <p>
        These terms govern access to and use of the IMAFRIK service. They
        supplement the service contract entered into between {PUBLISHER.name}{" "}
        and the facility or practitioner, which prevails in the event of any
        conflict.
      </p>

      <h2>2. Access and accounts</h2>
      <p>
        Access is granted by personal invitation. An account is personal: it may
        not be shared or assigned to a workstation or department. The account
        holder is responsible for keeping their credentials confidential and
        must report any unauthorised use without delay.
      </p>
      <p>
        Each access to an examination is recorded and linked to the account
        used. Sharing an account would defeat this traceability and constitutes
        a serious breach.
      </p>

      <h2>3. Use of the service</h2>
      <p>Users undertake:</p>
      <ul>
        <li>
          to transmit only examinations for which their facility has a lawful
          basis for processing;
        </li>
        <li>
          to access only those examinations that their role requires them to
          consult;
        </li>
        <li>
          not to extract, copy or distribute images or reports for purposes
          other than those intended;
        </li>
        <li>
          not to attempt to circumvent the technical isolation or logging
          measures.
        </li>
      </ul>

      <h2>4. Medical responsibility</h2>
      <p>
        IMAFRIK ensures the transmission, storage, availability and traceability
        of examinations and reports.{" "}
        <strong>
          The interpretation of an examination and the content of the report are
          the sole responsibility of the radiologist who signs it
        </strong>
        , on the same terms as a reading performed on site.
      </p>
      <p>
        The referring physician remains responsible for the indication, for the
        patient’s care and for the use made of the report. Nothing in the
        service constitutes medical advice from {PUBLISHER.name}.
      </p>

      <h2>5. Quality of the data transmitted</h2>
      <p>
        The quality of the interpretation depends on that of the images and
        clinical information transmitted. The facility shall ensure that
        acquisitions are compliant and that the patient’s identity is accurate.
        An identification error at acquisition propagates through the entire
        workflow.
      </p>

      <h2>6. Availability</h2>
      <p>
        The service is available at all times, subject to maintenance
        operations, which are announced in advance when scheduled. Availability
        and turnaround commitments are set out in the service contract. In the
        event of unavailability affecting an emergency, the fallback procedure
        agreed in the contract applies.
      </p>

      <h2>7. Signed reports</h2>
      <p>
        A signed report is locked and can no longer be modified. Any correction
        takes the form of an addendum, which is dated, signed and visible to the
        facility. Each document bears a code that allows its authenticity to be
        checked on the public verification page.
      </p>

      <h2>8. Termination and reversibility</h2>
      <p>
        The terms of termination are set out in the contract. At any time, and
        in particular when the contract ends, the facility may request an export
        of its examinations and reports: DICOM images, signed PDF reports and a
        manifest of checksums with which to verify their integrity. Thereafter,
        retention or deletion follows the periods set in the contract.
      </p>

      <h2>9. Governing law</h2>
      <p>
        {PUBLISHER.governingLaw
          ? `These terms are governed by ${PUBLISHER.governingLaw.en}. `
          : "The governing law and the competent courts are those designated in the service contract. "}
        Any dispute shall first be referred to an attempt at amicable
        settlement.
      </p>
    </>
  );
}
