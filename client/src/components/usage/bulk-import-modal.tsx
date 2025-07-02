import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRecord {
  serviceName: string;
  amount: string;
  currency: string;
  date: string;
  serviceId?: number;
  isValid: boolean;
  errors: string[];
}

export default function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [rawData, setRawData] = useState("");
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "importing">("input");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  // Filter only usage services
  const usageServices = Array.isArray(services) 
    ? services.filter((service: any) => 
        service.category?.name?.toLowerCase().includes('usage')
      ) 
    : [];

  const bulkImportMutation = useMutation({
    mutationFn: async (records: any[]) => {
      await apiRequest("POST", "/api/usage/topups/bulk", { records });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage/topups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      toast({
        title: "Success",
        description: `Successfully imported ${parsedRecords.filter(r => r.isValid).length} records`,
      });
      setStep("input");
      setRawData("");
      setParsedRecords([]);
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
        description: "Failed to import records",
        variant: "destructive",
      });
      setStep("preview");
    },
  });

  const parseData = () => {
    if (!rawData.trim()) {
      toast({
        title: "Error",
        description: "Please paste some data to import",
        variant: "destructive",
      });
      return;
    }

    const lines = rawData.trim().split('\n');
    const parsed: ParsedRecord[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length < 4) {
        parsed.push({
          serviceName: parts[0] || '',
          amount: parts[1] || '',
          currency: parts[2] || '',
          date: parts[3] || '',
          isValid: false,
          errors: ['Line must have 4 comma-separated values: Service, Amount, Currency, Date']
        });
        return;
      }

      const [serviceName, amount, currency, date] = parts;
      const errors: string[] = [];

      // Find matching service
      const matchingService = usageServices.find((service: any) => 
        service.name.toLowerCase().includes(serviceName.toLowerCase()) ||
        serviceName.toLowerCase().includes(service.name.toLowerCase())
      );

      if (!matchingService) {
        errors.push(`Service "${serviceName}" not found`);
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push('Amount must be a positive number');
      }

      // Validate currency (basic check)
      if (!currency || currency.length !== 3) {
        errors.push('Currency must be a 3-letter code (e.g., USD)');
      }

      // Validate date
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push('Date must be in a valid format (YYYY-MM-DD)');
      }

      parsed.push({
        serviceName,
        amount,
        currency: currency.toUpperCase(),
        date,
        serviceId: matchingService?.id,
        isValid: errors.length === 0,
        errors
      });
    });

    setParsedRecords(parsed);
    setStep("preview");
  };

  const handleImport = () => {
    const validRecords = parsedRecords
      .filter(record => record.isValid)
      .map(record => ({
        serviceId: record.serviceId,
        amountPurchased: parseFloat(record.amount),
        currency: record.currency,
        topupDate: record.date
      }));

    if (validRecords.length === 0) {
      toast({
        title: "Error",
        description: "No valid records to import",
        variant: "destructive",
      });
      return;
    }

    setStep("importing");
    bulkImportMutation.mutate(validRecords);
  };

  const validCount = parsedRecords.filter(r => r.isValid).length;
  const invalidCount = parsedRecords.length - validCount;

  if (step === "input") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import Top-ups
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Paste your data with the following format (comma-separated):</p>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-xs">
                Service,Amount,Currency,Date<br/>
                OpenAI API,100.00,USD,2025-07-01<br/>
                Twilio SMS,50.00,USD,2025-07-01
              </div>
              <p className="mt-2 text-xs">
                • Copy data from Excel/Google Sheets or CSV files<br/>
                • Service names will be matched with existing services<br/>
                • Date format: YYYY-MM-DD
              </p>
            </div>

            <div>
              <Label htmlFor="bulkData">Paste Data</Label>
              <Textarea
                id="bulkData"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="Service,Amount,Currency,Date
OpenAI API,100.00,USD,2025-07-01
Twilio SMS,50.00,USD,2025-07-01"
                rows={10}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={parseData} disabled={!rawData.trim()}>
                Parse Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "preview") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Preview
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {invalidCount} Invalid
                </Badge>
              )}
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 font-medium text-sm border-b">
                <div>Service</div>
                <div>Amount</div>
                <div>Currency</div>
                <div>Date</div>
                <div>Status</div>
              </div>
              
              {parsedRecords.map((record, index) => (
                <div key={index} className={`grid grid-cols-5 gap-2 p-3 border-b last:border-b-0 text-sm ${
                  record.isValid ? 'bg-white' : 'bg-red-50'
                }`}>
                  <div className="truncate">{record.serviceName}</div>
                  <div>{record.amount}</div>
                  <div>{record.currency}</div>
                  <div>{record.date}</div>
                  <div>
                    {record.isValid ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        Valid
                      </Badge>
                    ) : (
                      <div>
                        <Badge variant="destructive" className="text-xs">Invalid</Badge>
                        {record.errors.length > 0 && (
                          <div className="mt-1 text-xs text-red-600">
                            {record.errors.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep("input")}
              >
                Back to Edit
              </Button>
              <div className="space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Import {validCount} Records
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Importing state
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importing Records...
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Importing {validCount} records...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}