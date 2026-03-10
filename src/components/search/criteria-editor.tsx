"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { MAX_CRITERIA } from "@/lib/constants";

interface CriteriaEditorProps {
  criteria: string[];
  onChange: (criteria: string[]) => void;
}

export function CriteriaEditor({ criteria, onChange }: CriteriaEditorProps) {
  const addCriterion = () => {
    if (criteria.length < MAX_CRITERIA) {
      onChange([...criteria, ""]);
    }
  };

  const removeCriterion = (index: number) => {
    onChange(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...criteria];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Criteria (optional)
      </label>
      {criteria.map((criterion, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={criterion}
            onChange={(e) => updateCriterion(i, e.target.value)}
            placeholder={`e.g. "Must have 5+ years of experience"`}
            className="bg-surface border-border text-sm h-9"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => removeCriterion(i)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {criteria.length < MAX_CRITERIA && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addCriterion}
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <Plus className="h-3 w-3" />
          Add criterion
        </Button>
      )}
    </div>
  );
}
