import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ServiceTable from "@/components/services/service-table";

export default function Services() {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Service Management"
          subtitle="Manage all your infrastructure, license, and usage services"
        />
        <main className="p-8">
          <ServiceTable />
        </main>
      </div>
    </div>
  );
}
