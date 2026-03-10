"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { Key, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useUiStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/exa/websets?limit=1");
      if (res.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="bg-surface border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Your Exa API key is configured via environment variable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">API Key Status</label>
            <Input
              type="password"
              value="••••••••••••"
              disabled
              className="bg-surface-elevated border-border font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Set via <code className="text-foreground/70">.env.local</code> on the server
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              size="sm"
              className="border-border text-xs"
            >
              {testing ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              ) : null}
              Test Connection
            </Button>
            {testResult === "success" && (
              <span className="flex items-center gap-1 text-xs text-accent-green">
                <CheckCircle className="h-3.5 w-3.5" /> Connected
              </span>
            )}
            {testResult === "error" && (
              <span className="flex items-center gap-1 text-xs text-accent-red">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
