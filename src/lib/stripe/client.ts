import "server-only";

import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";

let stripe: Stripe | undefined;

export function getStripe() {
  stripe ??= new Stripe(getStripeSecretKey(), {
    appInfo: { name: "White-label commerce", version: "1.0.0" },
    timeout: 15_000, maxNetworkRetries: 1,
  });
  return stripe;
}
