"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Building2, Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface AccountClass {
  _id: string;
  accountClassCode: string;
  accountClassName: string;
  description?: string;
}

export default function AccountClass() {
  const [accountClasses, setAccountClasses] = useState<AccountClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountClasses = async () => {
      try {
        const res = await fetch("/api/account-class");
        const data = await res.json();
        setAccountClasses(data.classes || []);
      } catch (err) {
        console.error("❌ Failed to fetch account classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountClasses();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Account Classes
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] w-full">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <div className="space-y-2 w-[300px]">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          ) : accountClasses.length === 0 ? (
            <p className="text-base text-muted-foreground">
              No account classes found.
            </p>
          ) : (
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="text-left px-4 py-2">Account Class Code</th>
                  <th className="text-left px-4 py-2">Account Class</th>
                </tr>
              </thead>
              <tbody>
                {accountClasses.map((cls) => (
                  <tr
                    key={cls._id}
                    className="border-b hover:bg-muted transition-colors">
                    <td className="px-4 py-2">{cls.accountClassCode}</td>
                    <td className="px-4 py-2">{cls.accountClassName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
