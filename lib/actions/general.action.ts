"use server";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { success } from "zod";

export async function getInterviewsByUserId(userId: string) {
    const interviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()

    })) as Interview[];
}

export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection("interviews")
        .orderBy("createdAt", "desc")
        .where("finalized", "==", true)
        .where("userId", "!=", userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db.collection("interviews").doc(id).get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const {
            object: {
                totalScore,
                categoryScores,
                strengths,
                areasForImprovement,
                finalAssessment,
            },
        } = await generateObject({
            model: google("gemini-2.0-flash-001"),
            schema: feedbackSchema,
            prompt: `
You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on the following structure. Respond with values that match the expected types in the schema.

Candidate Transcript:
${formattedTranscript}

Required structured feedback:
1. totalScore: Overall score (0–100).
2. categoryScores: For each of the 5 categories below, provide the name, score (0–100), and a short comment. Format like:
   - Communication Skills: 85 - Clear and concise answers.
   - Technical Knowledge: 75 - Strong fundamentals but missed some edge cases.
   - Problem Solving: 80 - Good breakdown, average optimization.
   - Cultural Fit: 70 - Some alignment concerns.
   - Confidence and Clarity: 90 - Very confident throughout.

3. strengths: 3–5 points in bullet form starting with '-'.
4. areasForImprovement: 3–5 points in bullet form starting with '-'.
5. finalAssessment: A closing paragraph summarizing the candidate's performance and suitability.
`,

            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = {
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}


export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}
