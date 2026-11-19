import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini Backward Planning endpoint for Christmas preparation
  app.post('/api/backward-plan', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error:
            'GEMINI_API_KEY is not configured in Settings > Secrets. Please configure your Gemini API key to generate custom AI backward plans.',
        });
        return;
      }

      const {
        targetYear = 2026,
        daysRemaining = 37,
        milestoneCount = 4,
        customFocus = 'Calm, magical Christmas preparation',
      } = req.body || {};

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Create a concise ${milestoneCount}-step backward-planned Christmas Lock-Screen milestone plan working backward from December 25, ${targetYear} (${daysRemaining} days remaining).
User holiday focus: "${customFocus}".
Return ${milestoneCount} chronological milestones leading up to December 25, ${targetYear}:
1. Late November (${targetYear}-11-29T17:00) — Tree, Lights & Holiday Plan Lock (stageKey: "selection")
2. Mid-December (${targetYear}-12-14T20:00) — Holiday Shipping & Order Cutoff (stageKey: "purchasing", 11-day delivery buffer)
3. Late December (${targetYear}-12-21T20:00) — Wrapping, Cards & Ribbon Night (stageKey: "wrapping")
4. Christmas Eve (${targetYear}-12-24T21:00) — Christmas Eve Hearth & Final Staging (stageKey: "final_prep")

Also provide a short 2-sentence "aiMethodologySummary" explaining how backward planning from December 25, ${targetYear} chose these milestone dates so the holiday season stays calm and magical.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a minimalist macOS Lock-Screen deadline architect. Return concise, chronological JSON milestones working backward from December 25.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiMethodologySummary: {
                type: Type.STRING,
                description:
                  '2-sentence summary explaining how backward planning turned the Dec 25 deadline into smaller achievable steps.',
              },
              phases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stageKey: {
                      type: Type.STRING,
                      description:
                        'One of: budgeting, selection, purchasing, delivery, wrapping, final_prep',
                    },
                    phaseNumber: {
                      type: Type.INTEGER,
                    },
                    title: {
                      type: Type.STRING,
                    },
                    dateWindowLabel: {
                      type: Type.STRING,
                    },
                    targetDate: {
                      type: Type.STRING,
                      description:
                        'ISO local datetime string YYYY-MM-DDTHH:mm in November or December of the target year',
                    },
                    daysBeforeChristmas: {
                      type: Type.INTEGER,
                    },
                    objective: {
                      type: Type.STRING,
                    },
                    actionChecklist: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.STRING,
                      },
                    },
                    linkedMilestoneTitle: {
                      type: Type.STRING,
                    },
                  },
                  required: [
                    'stageKey',
                    'phaseNumber',
                    'title',
                    'dateWindowLabel',
                    'targetDate',
                    'daysBeforeChristmas',
                    'objective',
                    'actionChecklist',
                    'linkedMilestoneTitle',
                  ],
                },
              },
            },
            required: ['aiMethodologySummary', 'phases'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate backward plan with Gemini API.';
      res.status(500).json({ error: errMessage });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frost & Wonder server running on http://localhost:${PORT}`);
  });
}

startServer();
