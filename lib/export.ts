import { jsPDF } from "jspdf";
import type { Quiz } from "@/types/quiz";

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function quizToCsv(quiz: Quiz): string {
  const header = [
    "id",
    "type",
    "question",
    "option_1",
    "option_2",
    "option_3",
    "option_4",
    "correct_answer",
    "explanation",
  ];
  const rows = quiz.questions.map((q) => {
    const opts = q.options ?? [];
    return [
      String(q.id),
      q.type,
      q.question,
      opts[0] ?? "",
      opts[1] ?? "",
      opts[2] ?? "",
      opts[3] ?? "",
      q.correct_answer,
      q.explanation,
    ]
      .map(csvEscape)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function quizToPdfBlob(quiz: Quiz): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const maxWidth = 515;
  let y = 60;

  const addLine = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 60;
      }
      doc.text(line, marginX, y);
      y += size + 6;
    }
  };

  addLine(quiz.title, 18, true);
  y += 8;

  quiz.questions.forEach((q, i) => {
    addLine(`${i + 1}. ${q.question}`, 12, true);
    if (q.options) {
      q.options.forEach((opt, idx) => {
        addLine(`   ${String.fromCharCode(65 + idx)}. ${opt}`, 11);
      });
    }
    addLine(`Answer: ${q.correct_answer}`, 11);
    if (q.explanation) addLine(`Why: ${q.explanation}`, 10);
    y += 10;
  });

  return doc.output("blob");
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Manual fallback when OAuth / Forms API is unavailable.
// Prefer POST /api/create-google-form (see ExportButtons "Create Google Form").
export function quizToAppsScript(quiz: Quiz): string {
  const data = JSON.stringify(quiz, null, 2);
  return `// FormToQuiz -> Google Forms
// 1. Go to https://script.google.com and create a new project.
// 2. Paste this entire script, then run createQuizForm().
// 3. Authorize when prompted. A link to the new Form is logged.

function createQuizForm() {
  var quiz = ${data};

  var form = FormApp.create(quiz.title);
  form.setIsQuiz(true);
  form.setDescription('Generated with FormToQuiz');

  quiz.questions.forEach(function (q) {
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      var item = form.addMultipleChoiceItem();
      item.setTitle(q.question);
      var choices = (q.options || ['True', 'False']).map(function (opt) {
        return item.createChoice(opt, opt === q.correct_answer);
      });
      item.setChoices(choices);
      item.setPoints(1);
      if (q.explanation) {
        item.setFeedbackForCorrect(
          FormApp.createFeedback().setText(q.explanation).build()
        );
      }
    } else {
      var text = form.addParagraphTextItem();
      text.setTitle(q.question);
    }
  });

  Logger.log('Edit URL: ' + form.getEditUrl());
  Logger.log('Live URL: ' + form.getPublishedUrl());
}
`;
}
