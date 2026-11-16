import type { Metadata } from "next";
import { LegalPage } from "@/components/city/LegalPage";
export const metadata: Metadata = { title: "Privacy policy" };
export default function Page() { return (<LegalPage title="Privacy policy"><p>This is a draft placeholder. The final privacy policy will explain what participant data we collect to run bookings, tickets and check-in, and how it is protected.</p><p>[Data controller and contact details TBC]</p></LegalPage>); }
