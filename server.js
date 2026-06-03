import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// HEALTH CHECK ROUTE
app.get("/", (req, res) => {
  res.send("Growie AI Backend Running");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const history = (req.body.history || []).slice(-6);

  const sessionId = req.body.sessionId || "unknown";

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "deepseek/deepseek-chat",

          messages: [
            {
              role: "system",
              content: `
You are Growie, the AI assistant of Growth Aesthetic.

Talk like a real human support executive.
Keep responses short.
Maximum 1-3 lines.
Stay conversational.
Avoid robotic language.
Avoid long explanations unless asked.
Focus on branding, marketing, websites, automation, ads, funnels, design, content creation and business growth.

If users ask about pricing:
"Pricing depends on your requirements and project scope. Our team can guide you based on your goals."

Never invent pricing.

If users ask unrelated educational topics, keep replies short and in-character rather than becoming a teacher.
`,
            },

            ...history,

            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const aiReply =
      data.choices?.[0]?.message?.content ||
      "Something went wrong.";

    // GOOGLE SHEETS LOGGING

    fetch(
      "https://script.google.com/macros/s/AKfycbyWEluGTWdYUG1Y_n-uKttjoNiylrwi90pUgh6Cunx9o_V96hpgLq4qGOmr7BGxMLczKw/exec",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          sessionId,
          userMessage,
          aiReply,
        }),
      }
    ).catch(console.error);

    res.json({
      reply: aiReply,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "Something went wrong.",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});