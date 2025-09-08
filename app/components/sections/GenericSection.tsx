import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Download, Upload } from "lucide-react";

interface GenericSectionProps {
  title: string;
  description: string;
  showAddButton?: boolean;
  showImportExport?: boolean;
}

export function GenericSection({
  title,
  description,
  showAddButton = true,
  showImportExport = false,
}: GenericSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex gap-2">
              {showImportExport && (
                <>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </>
              )}
              {showAddButton && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold mb-2">{title} Module</h3>
              <p className="text-muted-foreground mb-4">
                This section is ready for development and MongoDB integration.
              </p>
              <p className="text-sm text-muted-foreground">
                The interface and data models are prepared for implementation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
