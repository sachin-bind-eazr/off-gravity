import type { Metadata } from "next";
import { LegalPage } from "@/components/city/LegalPage";
export const metadata: Metadata = { title: "Refund & cancellation" };
export default function Page() { return (<LegalPage title="Refund & cancellation"><p>This is a draft placeholder. The refund and cancellation policy will be published before ticket sales open, and shown again at checkout.</p></LegalPage>); }
