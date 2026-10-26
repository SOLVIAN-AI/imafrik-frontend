# Visuels IDC : sources et attributions

Phase 1 de l’imagerie de la vitrine : **des coupes réelles, stylisées, jamais une image générée par une IA ni une anatomie retouchée**. Chaque visuel vient d’une coupe DICOM publique d’Imaging Data Commons, sous licence Creative Commons Attribution 4.0 (CC BY 4.0), qui autorise l’usage commercial à condition de citer la source et d’indiquer les modifications.

Produits par `tools/visuels-idc/generer.py` (le détail de chaque traitement est dans son en-tête), reproductibles à l’octet près depuis le seau public `idc-open-data`.

## Modifications apportées (à mentionner avec l’attribution)

Pixels rendus carrés, extérieur du patient ramené au fond (ou cadrage à l’intérieur du champ de vue), fenêtrage, compression monotone de l’os et lissage gaussien léger (scanner seulement), table de couleurs dans la palette IMAFRIK (#070e1c, #1a2d51, #007460, #0bd1ad), fondu au bord du champ de vue, vignettage, recadrage et agrandissement (au plus 4,6 fois la résolution native). Aucun élément n’est ajouté ni retiré à l’intérieur du patient.

**Ciné de l’accroche** (`idc-irm-cerveau-sagittal-cine`) : coupes reformatées dans le plan sagittal, une tous les 2 mm de la ligne médiane vers l’hémisphère droit (le glioblastome de ReMIND-066 est frontal gauche : aucune de ces coupes ne le traverse), pixels rendus carrés, extérieur du patient ramené au fond, fenêtre unique fixée sur la première coupe, **niveaux de gris** (blanc plafonné à 94 %), fondu au bord inférieur du champ de vue, cadre commun à toutes les coupes, agrandissement, puis vidéo H.264 en aller-retour (8 images par seconde, 48 images). C’est un visualiseur : l’image y reste en niveaux de gris sur fond noir, comme en lecture.

## Les visuels

Chaque visuel existe en WebP et en PNG, carré sauf le rachis sagittal (3:4), aux largeurs indiquées.

| Fichiers (`idc-…-<largeur>.webp` / `.png`) | Largeurs                                | Coupe                                                                                                                                                            | Examen (identifiant public)                                                            | Série (SeriesInstanceUID)                                                                                   |
| ------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `idc-scanner-cerveau-axial`                | 480, 960, 1440                          | Scanner, axiale native, cornes frontales et noyaux gris, 17ᵉ coupe sur 39 depuis la base                                                                         | EAY131-1473515, étude 1.3.6.1.4.1.14519.5.2.1.1620.1226.261527264962040663603388005464 | 1.3.6.1.4.1.14519.5.2.1.1620.1226.148673123929438370673927465260 (IDC 00005dad-3674-4e10-b1fd-01ca82315ed2) |
| `idc-irm-cerveau-sagittal`                 | 480, 960                                | IRM T2 3D, sagittale médiane reformatée (1 mm)                                                                                                                   | ReMIND-066, étude 1.3.6.1.4.1.14519.5.2.1.74266087281706948184425796375594396891       | 1.3.6.1.4.1.14519.5.2.1.100586321205392875770560922642660892383 (IDC 536667b6-e601-4b07-a755-7ed607fee378)  |
| `idc-irm-cerveau-axial`                    | 480, 960                                | IRM T2 3D, axiale native, noyaux gris                                                                                                                            | ReMIND-066 (même étude)                                                                | même série                                                                                                  |
| `idc-irm-cerveau-coronal`                  | 480, 960                                | IRM T1 3D après injection, coronale reformatée (1 mm), fosse postérieure                                                                                         | ReMIND-066 (même étude)                                                                | 1.3.6.1.4.1.14519.5.2.1.268825797094532165063777127599153262686 (IDC 47188763-64f0-4936-a3b9-23d1ca723116)  |
| `idc-irm-rachis-sagittal`                  | 480, 960                                | IRM lombaire T2, sagittale médiane native                                                                                                                        | MSB-02628, étude 1.3.6.1.4.1.14519.5.2.1.111230420467699134581544782056194375473       | 1.3.6.1.4.1.14519.5.2.1.322159875423857532988671658389799015182 (IDC 51bc7378-dc8c-42f3-a3b4-3fb36d44b57b)  |
| `idc-irm-rachis-axial`                     | 480, 960, 1440                          | IRM lombaire T2, axiale native                                                                                                                                   | MSB-02628 (même étude)                                                                 | 1.3.6.1.4.1.14519.5.2.1.29107748456491578596761312442858652523 (IDC 79255152-3726-4101-96a6-a882a94c2bdd)   |
| `idc-irm-cerveau-sagittal-cine`            | 480, 960 (affiche) ; vidéo MP4 480, 720 | IRM T2 3D, 25 sagittales reformatées (1 mm), une tous les 2 mm de la ligne médiane (colonne 124) vers la droite du patient (colonne 172), **en niveaux de gris** | ReMIND-066 (même étude)                                                                | même série que `idc-irm-cerveau-sagittal`                                                                   |

Les coupes sont choisies hors des lésions documentées : la tumeur frontale gauche de ReMIND-066 et la lésion temporale droite d’EAY131-1473515 n’y figurent pas. Les visages ne sont pas reconnaissables (IRM « défacées » par l’éditeur, coupes du scanner au-dessus des orbites).

## Attributions exactes

**EAY131 (scanner)**
The ECOG-ACRIN Cancer Research Group. (2026). _The MATCH Screening Trial: Targeted Therapy Directed by Genetic Testing in Treating Patients With Advanced Refractory Solid Tumors, Lymphomas, or Multiple Myeloma (EAY131)_ (Version 1) [Dataset]. The Cancer Imaging Archive. https://doi.org/10.7937/C5KE-YX42. Licence CC BY 4.0.

**ReMIND (IRM cérébrale)**
Juvekar, P., Dorent, R., Kögl, F., Torio, E., Barr, C., Rigolo, L., Galvin, C., Jowkar, N., Kazi, A., Haouchine, N., Cheema, H., Navab, N., Pieper, S., Wells, W. M., Bi, W. L., Golby, A., Frisken, S., & Kapur, T. (2023). _The Brain Resection Multimodal Imaging Database (ReMIND)_ (Version 1) [Data set]. The Cancer Imaging Archive. https://doi.org/10.7937/3RAG-D070. Licence CC BY 4.0.

**CMB-MML (IRM lombaire)**
Cancer Moonshot Biobank. (2022). _Cancer Moonshot Biobank - Multiple Myeloma Collection (CMB-MML)_ (Version 11) [Data set]. The Cancer Imaging Archive. https://doi.org/10.7937/SZKB-SW39. Licence CC BY 4.0.

**Imaging Data Commons (diffusion)**
Fedorov, A. et al. (2023). National Cancer Institute Imaging Data Commons: Toward Transparency, Reproducibility, and Scalability in Imaging Artificial Intelligence. _RadioGraphics_, 43(12). https://doi.org/10.1148/rg.230180

Licence : https://creativecommons.org/licenses/by/4.0/

## Mention à afficher près d’un visuel

> Coupe réelle : collection ReMIND (Juvekar et al., 2023), The Cancer Imaging Archive, CC BY 4.0. Couleurs et cadrage : IMAFRIK.

> Real slice: ReMIND collection (Juvekar et al., 2023), The Cancer Imaging Archive, CC BY 4.0. Colours and framing: IMAFRIK.

Remplacer la collection selon le visuel (EAY131, ECOG-ACRIN Cancer Research Group, 2026 ; CMB-MML, Cancer Moonshot Biobank, 2022). Une page « Crédits » regroupant ces mentions, liée depuis le pied de page, satisfait aussi la licence.
