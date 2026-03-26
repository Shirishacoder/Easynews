const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const axios = require("axios");
const cheerio = require("cheerio");


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getArticleContent(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);

    let text = "";

    $("p").each((i, el) => {
      text += $(el).text() + " ";
    });

    return text.trim();

  } catch (err) {
    console.error("❌ Scraping failed:", err.message);
    return "";
  }
}


// 🔥 Summarize News
router.post("/summarize", async (req, res) => {
  try {
    const { title, description, content, url, language } = req.body;

    let finalContent = content || description;

    // ✅ Fetch full article if URL exists
    if (url) {
      const scrapedContent = await getArticleContent(url);

      if (scrapedContent && scrapedContent.length > 200) {
        finalContent = scrapedContent;
      }
    }

    // Prevent token limit errors with Groq by truncating roughly to 12000 chars
    if (finalContent && finalContent.length > 12000) {
      finalContent = finalContent.substring(0, 12000);
    }

    const prompt = `
Summarize this news article strictly based on given information.

Return 3 short bullet points.
${language && language !== "English" ? `IMPORTANT: You MUST write your summary entirely in the ${language} language.` : ""}

Title: ${title || ""}
Description: ${description || ""}
Content: ${finalContent || ""}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });

    const summary = response.choices[0]?.message?.content;

    res.json({ summary });

  } catch (error) {
    console.error("❌ Groq error:", error);
    res.json({ summary: "I'm temporarily unavailable: " + error.message });
  }
});


router.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    const strictPrompt = `
You are a highly precise, professional news translator. Your task is to translate the following news text strictly into ${targetLang}.

CRITICAL RULES:
1. Output ONLY the translated text. Do absolutely NOT include any extra conversational filler, introductions (e.g., "Here is the translation..."), or conclusions.
2. Ensure consistent vocabulary, integrity, and identical tone as the original news article.
3. Keep formatting (such as line breaks) completely identical.
4. Do not translate names or explicit proper nouns if they are best kept phonetic.

Text to translate:
${text}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: strictPrompt }]
    });

    res.json({
      translated: response.choices[0]?.message?.content
    });

  } catch (err) {
    console.error("❌ Translate error:", err);
    res.json({ translated: "Translation failed: " + err.message });
  }
});


router.post("/smart", async (req, res) => {
  try {
    const { article, mode, language } = req.body;

    const trimmedArticle = article?.substring(0, 8000);

    const langSuffix = (language && language !== "English") ? ` STRICTLY in ${language} language` : "";
    let prompt = "";

    if (mode === "explain") {
      prompt = `Explain this news in simple terms${langSuffix}:\n${trimmedArticle}`;
    }
    else if (mode === "future") {
      prompt = `Predict 3 possible outcomes${langSuffix}:\n${trimmedArticle}`;
    }
    else if (mode === "keypoints") {
      prompt = `Give 4 key points${langSuffix}:\n${trimmedArticle}`;
    }

    if (!prompt) {
      return res.status(400).json({ error: "Invalid mode" });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });

    const result =
      response?.choices?.[0]?.message?.content || "No response generated";

    return res.json({ result });

  } catch (err) {
    console.error("❌ Smart AI error:", err);
    return res.json({ result: "AI processing failed: " + err.message });
  }
});

// 🔥 Ask Question about Article
router.post("/ask", async (req, res) => {
  try {
    const { question, article, history = [], language } = req.body;

    const trimmedArticle = article?.substring(0, 8000) || "";

    const systemPromptMessage = {
      role: "system",
      content: `You are a friendly and helpful AI news assistant chatting with a user.
The user is currently reading the following news article:

"""
${trimmedArticle}
"""

Instructions:
1. If the user is just saying hello, greeting you, or making small talk (like "hi", "hello", "how are you"), reply in a friendly, conversational manner and offer to answer any questions they have about the article.
2. If the user asks a specific question about the article, answer it clearly and concisely based ONLY on the provided article text.
3. Keep your responses natural and engaging.
${language && language !== "English" ? `4. CRITICAL: You MUST write your entire response strictly in the ${language} language. Do NOT use English if ${language} is requested.` : ""}`
    };

    const formattedHistory = history.map(msg => ({
      role: msg.type === "bot" ? "assistant" : "user",
      content: msg.text
    }));

    const messages = [
      systemPromptMessage,
      ...formattedHistory,
      { role: "user", content: question }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages
    });

    const answer = response.choices[0]?.message?.content;

    res.json({ answer });

  } catch (error) {
    console.error("❌ Groq error:", error);
    res.json({ answer: "I'm currently unable to answer: " + error.message });
  }
});

module.exports = router;