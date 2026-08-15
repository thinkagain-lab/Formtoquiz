"use client";

import type { Question } from "@/types/quiz";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const typeLabels: Record<Question["type"], string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  short_answer: "Short answer",
};

export function QuestionCard({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
}) {
  const update = (patch: Partial<Question>) =>
    onChange({ ...question, ...patch });

  const updateOption = (i: number, value: string) => {
    const options = [...(question.options ?? [])];
    options[i] = value;
    update({ options });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <Badge variant="secondary">{typeLabels[question.type]}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete question ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`q-${question.id}`}>Question</Label>
          <Textarea
            id={`q-${question.id}`}
            value={question.question}
            onChange={(e) => update({ question: e.target.value })}
          />
        </div>

        {question.options && question.options.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Options</Label>
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-sm text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`a-${question.id}`}>Correct answer</Label>
            <Input
              id={`a-${question.id}`}
              value={question.correct_answer}
              onChange={(e) => update({ correct_answer: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`e-${question.id}`}>Explanation</Label>
            <Input
              id={`e-${question.id}`}
              value={question.explanation}
              onChange={(e) => update({ explanation: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
