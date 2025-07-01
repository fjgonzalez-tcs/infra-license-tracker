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
import { insertUsageTopupSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertUsageTopupSchema.extend({
  serviceId: z.string().min(1, "Service is required").transform(Number),
  amountPurchased: z.string().min(1, "Amount is required").transform(Number),
  topupDate: z.string().min(1, "Date is required"),
});

interface AddTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServiceId?: number | null;
}

export default function AddTopupModal({ isOpen, onClose, selectedServiceId }: AddTopupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: selectedServiceId?.toString() || "",
      amountPurchased: "",
      topupDate: new Date().toISOString().split('T')[0],
      currency: "USD",
    },
  });

  const createTopupMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/usage/topups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage/topups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      toast({
        title: "Success",
        description: "Top-up recorded successfully",
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
        description: "Failed to record top-up",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTopupMutation.mutate(data);
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
          <DialogTitle>Record Top-up</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amountPurchased">Amount ($)</Label>
              <Input
                id="amountPurchased"
                type="number"
                step="0.01"
                {...form.register("amountPurchased")}
                placeholder="0.00"
                className="mt-1"
              />
              {form.formState.errors.amountPurchased && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.amountPurchased.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value) => form.setValue("currency", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="topupDate">Top-up Date</Label>
            <Input
              id="topupDate"
              type="date"
              {...form.register("topupDate")}
              className="mt-1"
            />
            {form.formState.errors.topupDate && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.topupDate.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTopupMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {createTopupMutation.isPending ? "Recording..." : "Record Top-up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
