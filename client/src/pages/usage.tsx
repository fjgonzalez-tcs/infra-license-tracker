import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import UsageCards from "@/components/usage/usage-cards";
import TransactionHistory from "@/components/usage/transaction-history";

export default function Usage() {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Usage Tracking"
          subtitle="Monitor usage-based service balances and consumption"
        />
        <main className="p-8">
          <UsageCards />
          <TransactionHistory />
        </main>
      </div>
    </div>
  );
}
