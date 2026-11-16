import type { Metadata } from "next";
import { LegalPage } from "@/components/city/LegalPage";
export const metadata: Metadata = { title: "Terms & conditions" };
export default function Page() { return (<LegalPage title="Terms & conditions"><p>This is a draft placeholder. The final terms for OFF GRAVITY by The Great Inflate Run will be published before ticket sales open.</p><p>Dates are provisional, subject to venue and permission confirmations. Participant eligibility and age limits are listed on each ticket.</p></LegalPage>); }
