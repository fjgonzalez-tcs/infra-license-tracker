import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BudgetCards from "@/components/budget/budget-cards";
import BudgetChart from "@/components/budget/budget-chart";
import BudgetTable from "@/components/budget/budget-table";

export default function Budget() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Budget Management"
          subtitle="Set budgets and track spending against targets"
        />
        <main className="p-8 space-y-8">
          <BudgetCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BudgetChart />
            <BudgetTable />
          </div>
        </main>
      </div>
    </div>
  );
}