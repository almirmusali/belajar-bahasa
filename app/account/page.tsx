import { AccountDashboard } from "@/components/account-dashboard";
import { getAllVocabSets } from "@/lib/vocab";

export default function AccountPage() {
  const sets = getAllVocabSets();
  return <AccountDashboard sets={sets} />;
}
