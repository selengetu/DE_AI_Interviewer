import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a data engineering interviewer. Operate in exactly two turns — output ONLY the requested block, no preamble or commentary.

TURN 1 — given a job description:
Output ONLY a <questions> block with a JSON array of exactly 12 questions, 2 per pillar.
Pillars: behavioral, product_metric_sense, data_modeling, sql, python, system_design.
SQL questions must embed a concrete schema in the question text.
System design questions must embed a specific scenario with scale details.
Tailor all questions to the job description.

<questions>
[
  {"num":1,"pillar":"behavioral","text":"..."},
  {"num":2,"pillar":"product_metric_sense","text":"..."},
  {"num":3,"pillar":"data_modeling","text":"..."},
  {"num":4,"pillar":"sql","text":"Given: orders(id, user_id, amount, ts). ..."},
  {"num":5,"pillar":"python","text":"..."},
  {"num":6,"pillar":"system_design","text":"Design a pipeline that ingests 5M events/day... ..."},
  {"num":7,"pillar":"behavioral","text":"..."},
  {"num":8,"pillar":"product_metric_sense","text":"..."},
  {"num":9,"pillar":"data_modeling","text":"..."},
  {"num":10,"pillar":"sql","text":"..."},
  {"num":11,"pillar":"python","text":"..."},
  {"num":12,"pillar":"system_design","text":"..."}
]
</questions>

TURN 2 — given all candidate answers:
Output ONLY a <debrief> block:

<debrief>
{
  "pillar_scores": {
    "behavioral":           {"score":1-5,"label":"Needs Work|Developing|Solid|Strong|Exceptional"},
    "product_metric_sense": {"score":1-5,"label":"..."},
    "data_modeling":        {"score":1-5,"label":"..."},
    "sql":                  {"score":1-5,"label":"..."},
    "python":               {"score":1-5,"label":"..."},
    "system_design":        {"score":1-5,"label":"..."}
  },
  "weak_spots":[{"area":"...","advice":"..."},{"area":"...","advice":"..."},{"area":"...","advice":"..."}],
  "strengths":[{"area":"...","detail":"..."},{"area":"...","detail":"..."}],
  "overall_readiness":0-100,
  "summary":"2-3 sentences"
}
</debrief>`;

app.post('/api/chat', async (req, res) => {
  const { messages, maxTokens = 1500 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: err.message || 'API request failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
