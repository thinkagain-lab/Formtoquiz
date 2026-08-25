import type { Question, Quiz } from "@/types/quiz";

const FORMS_API = "https://forms.googleapis.com/v1/forms";

export type CreatedGoogleForm = {
  formId: string;
  editUrl: string;
  responderUrl: string;
  title: string;
};

type FormsApiError = {
  error?: {
    message?: string;
    status?: string;
    code?: number;
    details?: unknown[];
  };
};

function resolveCorrectAnswer(q: Question): string {
  const answer = (q.correct_answer ?? "").trim();
  if (!q.options?.length) return answer;
  const exact = q.options.find((opt) => opt === answer);
  if (exact) return exact;
  const caseInsensitive = q.options.find(
    (opt) => opt.toLowerCase() === answer.toLowerCase(),
  );
  if (caseInsensitive) return caseInsensitive;
  if (/^[A-Da-d]$/.test(answer)) {
    const idx = answer.toUpperCase().charCodeAt(0) - 65;
    if (q.options[idx]) return q.options[idx];
  }
  return answer;
}

function explanationText(q: Question): string | undefined {
  const text = q.explanation?.trim();
  return text || undefined;
}

/** MCQ / T-F: whenRight/whenWrong only (never generalFeedback). */
function gradingForChoice(q: Question) {
  const correct = resolveCorrectAnswer(q);
  const options =
    q.options && q.options.length > 0
      ? q.options
      : q.type === "true_false"
        ? ["True", "False"]
        : [];
  if (!correct || (options.length > 0 && !options.includes(correct))) {
    return undefined;
  }

  const grading: Record<string, unknown> = {
    pointValue: 1,
    correctAnswers: { answers: [{ value: correct }] },
  };
  const explanation = explanationText(q);
  if (explanation) {
    grading.whenRight = { text: explanation };
    grading.whenWrong = { text: explanation };
  }
  return grading;
}

/** Short answer: generalFeedback only (never whenRight/whenWrong). */
function gradingForText(q: Question) {
  const correct = resolveCorrectAnswer(q);
  if (!correct) return undefined;

  const grading: Record<string, unknown> = {
    pointValue: 1,
    correctAnswers: { answers: [{ value: correct }] },
  };
  const explanation = explanationText(q);
  if (explanation) {
    grading.generalFeedback = { text: explanation };
  }
  return grading;
}

function createItemRequest(q: Question, index: number) {
  const title = (q.question || `Question ${index + 1}`).slice(0, 500);

  if (q.type === "multiple_choice" || q.type === "true_false") {
    const options =
      q.options && q.options.length > 0
        ? q.options.map((value) => value.slice(0, 500))
        : q.type === "true_false"
          ? ["True", "False"]
          : ["Option A", "Option B", "Option C", "Option D"];

    const question: Record<string, unknown> = {
      required: true,
      choiceQuestion: {
        type: "RADIO",
        options: options.map((value) => ({ value })),
      },
    };
    const grading = gradingForChoice({ ...q, options });
    if (grading) question.grading = grading;

    return {
      createItem: {
        item: {
          title,
          questionItem: { question },
        },
        location: { index },
      },
    };
  }

  const question: Record<string, unknown> = {
    required: true,
    textQuestion: { paragraph: true },
  };
  const grading = gradingForText(q);
  if (grading) question.grading = grading;

  return {
    createItem: {
      item: {
        title,
        questionItem: { question },
      },
      location: { index },
    },
  };
}

async function formsFetch(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function readError(res: Response, stage: string): Promise<string> {
  try {
    const data = (await res.json()) as FormsApiError;
    const message = data.error?.message ?? `HTTP ${res.status}`;
    const status = data.error?.status ? ` [${data.error.status}]` : "";
    console.error(`Google Forms API ${stage} failed:`, JSON.stringify(data));
    if (/ACCESS_NOT_CONFIGURED|has not been used|disabled/i.test(message)) {
      return (
        "Google Forms API is not enabled for this Cloud project. " +
        "Enable it in APIs & Services → Library, then wait a minute and retry."
      );
    }
    return `${stage}: ${message}${status}`;
  } catch {
    return `${stage}: Google Forms API error (HTTP ${res.status})`;
  }
}

async function batchUpdate(
  accessToken: string,
  formId: string,
  requests: unknown[],
  stage: string,
): Promise<void> {
  const res = await formsFetch(
    accessToken,
    `${FORMS_API}/${formId}:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({ requests }),
    },
  );
  if (!res.ok) {
    throw new Error(await readError(res, stage));
  }
}

/**
 * Creates a Google Form quiz in the authorized user's Drive via the Forms API.
 */
export async function createGoogleFormFromQuiz(
  accessToken: string,
  quiz: Quiz,
): Promise<CreatedGoogleForm> {
  if (!quiz.title?.trim()) {
    throw new Error("Quiz title is required.");
  }
  if (!quiz.questions?.length) {
    throw new Error("Quiz must include at least one question.");
  }

  const createRes = await formsFetch(accessToken, FORMS_API, {
    method: "POST",
    body: JSON.stringify({
      info: {
        title: quiz.title.trim().slice(0, 300),
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(await readError(createRes, "Create form"));
  }

  const created = (await createRes.json()) as {
    formId?: string;
    responderUri?: string;
    info?: { title?: string };
  };

  const formId = created.formId;
  if (!formId) {
    throw new Error("Google Forms API did not return a form ID.");
  }

  // Quiz mode must be enabled before graded questions are added.
  await batchUpdate(
    accessToken,
    formId,
    [
      {
        updateSettings: {
          settings: { quizSettings: { isQuiz: true } },
          updateMask: "quizSettings.isQuiz",
        },
      },
      {
        updateFormInfo: {
          info: { description: "Generated with FormToQuiz" },
          updateMask: "description",
        },
      },
    ],
    "Enable quiz mode",
  );

  try {
    await batchUpdate(
      accessToken,
      formId,
      quiz.questions.map((q, index) => createItemRequest(q, index)),
      "Add questions",
    );
  } catch (err) {
    // Some quiz payloads (grading edge cases) return opaque INTERNAL errors.
    // Retry once without answer keys so the form still gets created.
    console.warn(
      "Add questions with grading failed, retrying without grading:",
      err,
    );
    await batchUpdate(
      accessToken,
      formId,
      quiz.questions.map((q, index) =>
        createItemRequest({ ...q, correct_answer: "", explanation: "" }, index),
      ),
      "Add questions (without grading)",
    );
  }

  const publishRes = await formsFetch(
    accessToken,
    `${FORMS_API}/${formId}:setPublishSettings`,
    {
      method: "POST",
      body: JSON.stringify({
        publishSettings: {
          publishState: {
            isPublished: true,
            isAcceptingResponses: true,
          },
        },
      }),
    },
  );
  if (!publishRes.ok) {
    console.warn(
      "setPublishSettings failed:",
      await readError(publishRes, "Publish").catch(() => publishRes.status),
    );
  }

  const getRes = await formsFetch(accessToken, `${FORMS_API}/${formId}`);
  let responderUrl = created.responderUri ?? "";
  let title = created.info?.title ?? quiz.title;

  if (getRes.ok) {
    const form = (await getRes.json()) as {
      responderUri?: string;
      info?: { title?: string };
    };
    responderUrl = form.responderUri ?? responderUrl;
    title = form.info?.title ?? title;
  }

  if (!responderUrl) {
    responderUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
  }

  return {
    formId,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl,
    title,
  };
}
