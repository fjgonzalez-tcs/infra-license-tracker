import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import LicenseTable from "@/components/licenses/license-table";

export default function Licenses() {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="License Management"
          subtitle="Track license plans, quantities, and renewal dates"
        />
        <main className="p-8">
          <LicenseTable />
        </main>
      </div>
    </div>
  );
}
