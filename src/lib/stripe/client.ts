import "server-only";

import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";

let stripe: Stripe | undefined;

export function getStripe() {
  stripe ??= new Stripe(getStripeSecretKey(), {
    appInfo: { name: "SunTV Mall", version: "0.1.0" },
  });
  return stripe;
}
