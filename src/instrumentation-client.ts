import { init } from "@sentry/browser";

import { errorTrackingOptions } from "@/lib/monitoring/error-tracking";

// Navigateur : suivi des erreurs, s'il est configuré, avant toute
// hydratation. Le SDK de base plutôt que celui de Next, qui embarque la
// mesure de performance même éteinte : mesuré le 19 octobre 2026, 90 Ko
// de JavaScript en plus sur chaque page au lieu de 220, sur des
// connexions qui les sentent. Ni enregistrement de session ni mesure de
// performance : voir `lib/monitoring/error-tracking.ts`.
const options = errorTrackingOptions();
if (options) init(options);
