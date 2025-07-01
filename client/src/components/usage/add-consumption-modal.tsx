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
import { insertUsageConsumptionSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertUsageConsumptionSchema.extend({
  serviceId: z.string().min(1, "Service is required").transform(Number),
  amountConsumed: z.string().min(1, "Amount is required").transform(Number),
  consumptionDate: z.string().min(1, "Date is required"),
});

interface AddConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServiceId?: number | null;
}

export default function AddConsumptionModal({ isOpen, onClose, selectedServiceId }: AddConsumptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: selectedServiceId?.toString() || "",
      amountConsumed: "",
      consumptionDate: new Date().toISOString().split('T')[0],
    },
  });

  const createConsumptionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/usage/consumption", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage/consumption"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      toast({
        title: "Success",
        description: "Usage consumption recorded successfully",
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
        description: "Failed to record consumption",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createConsumptionMutation.mutate(data);
  };

  // Filter only usage services
  const usageServices = services?.filter((service: any) => 
    service.category?.name?.toLowerCase().includes('usage')
  ) || [];

  // Set selected service when modal opens
  if (selectedServiceId && form.watch("serviceId") !== selectedServiceId.toString()) {
    form.setValue("serviceId", selectedServiceId.toString());
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Usage Consumption</DialogTitle>
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
                {usageServices.map((service: any) => (
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

          <div>
            <Label htmlFor="amountConsumed">Amount Consumed ($)</Label>
            <Input
              id="amountConsumed"
              type="number"
              step="0.01"
              {...form.register("amountConsumed")}
              placeholder="0.00"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the amount consumed or used from your service balance
            </p>
            {form.formState.errors.amountConsumed && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.amountConsumed.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="consumptionDate">Consumption Date</Label>
            <Input
              id="consumptionDate"
              type="date"
              {...form.register("consumptionDate")}
              className="mt-1"
            />
            {form.formState.errors.consumptionDate && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.consumptionDate.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createConsumptionMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {createConsumptionMutation.isPending ? "Recording..." : "Record Consumption"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
