import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertLicensePlanSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertLicensePlanSchema.extend({
  serviceId: z.string().min(1, "Service is required").transform(Number),
  monthlyUnitCost: z.string().min(1, "Unit cost is required").transform(Number),
  qty: z.string().min(1, "Quantity is required").transform(Number),
  startMonth: z.string().min(1, "Start month is required"),
});

interface AddLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLicenseModal({ isOpen, onClose }: AddLicenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      monthlyUnitCost: "",
      qty: "",
      startMonth: "",
      endMonth: "",
      annualCommitmentEnd: "",
    },
  });

  const createLicenseMutation = useMutation({
    mutationFn: async (data: any) => {
      // Remove empty strings for optional fields
      const cleanData = { ...data };
      if (!cleanData.endMonth) delete cleanData.endMonth;
      if (!cleanData.annualCommitmentEnd) delete cleanData.annualCommitmentEnd;
      
      await apiRequest("POST", "/api/licenses", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      toast({
        title: "Success",
        description: "License plan created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create license plan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createLicenseMutation.mutate(data);
  };

  const licenseServices = services?.filter((service: any) => 
    service.category?.name?.toLowerCase().includes('license')
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add License Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="serviceId">Service</Label>
            <Select
              value={form.watch("serviceId")}
              onValueChange={(value) => form.setValue("serviceId", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                {licenseServices.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} ({service.provider?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.serviceId && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.serviceId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                {...form.register("qty")}
                placeholder="0"
                className="mt-1"
              />
              {form.formState.errors.qty && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.qty.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="monthlyUnitCost">Unit Cost ($)</Label>
              <Input
                id="monthlyUnitCost"
                type="number"
                step="0.01"
                {...form.register("monthlyUnitCost")}
                placeholder="0.00"
                className="mt-1"
              />
              {form.formState.errors.monthlyUnitCost && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.monthlyUnitCost.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startMonth">Start Month</Label>
              <Input
                id="startMonth"
                type="date"
                {...form.register("startMonth")}
                className="mt-1"
              />
              {form.formState.errors.startMonth && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.startMonth.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endMonth">End Month (Optional)</Label>
              <Input
                id="endMonth"
                type="date"
                {...form.register("endMonth")}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="annualCommitmentEnd">Annual Commitment End (Optional)</Label>
            <Input
              id="annualCommitmentEnd"
              type="date"
              {...form.register("annualCommitmentEnd")}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createLicenseMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {createLicenseMutation.isPending ? "Creating..." : "Add License Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
