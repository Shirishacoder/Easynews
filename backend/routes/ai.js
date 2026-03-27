const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const fetch = require("node-fetch"); // if not installed
const gTTS = require("gtts");
const id = Date.now();
const bgmPath = path.join(__dirname, "../public/bgm1.mp3");



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




// 🎬 AI VIDEO GENERATION
router.post("/video", async (req, res) => {
  try {
    const { title, summary, image } = req.body;

    // 🧠 Generate AI Script
const aiPrompt = `
You are a professional news video script writer.

Convert the following news into a short engaging narration script (max 60-90 seconds).

Rules:
- Make it engaging like YouTube Shorts / Reels
- Use simple, conversational tone
- No bullet points
- No headings
- Output only narration text

Title: ${title}
Summary: ${summary}
`;

const aiResponse = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [{ role: "user", content: aiPrompt }]
});

const script = aiResponse.choices[0]?.message?.content;



// 🎙 Generate Voice
const audioPath = path.join(__dirname, `../public/audio_${id}.mp3`);

const tts = new gTTS(script, "en");

await new Promise((resolve, reject) => {
  tts.save(audioPath, (err) => {
    if (err) reject(err);
    else resolve();
  });
});



// ⚡ Speed increase
const fastAudioPath = path.join(__dirname, `../public/audio_fast_${id}.mp3`);

const speedCommand = `ffmpeg -y -i "${audioPath}" -filter:a atempo=1.25 -vn "${fastAudioPath}"`;

await new Promise((resolve, reject) => {
  exec(speedCommand, (err, stdout, stderr) => {
   

    if (err) reject(err);
    else resolve();
  });
});



    // 2️⃣ Download Image
 const imagePath = path.join(__dirname, `../public/image_${id}.jpg`);

   const response = await axios.get(image, {
  responseType: "arraybuffer",
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://google.com"
  }
});

fs.writeFileSync(imagePath, response.data);

    // 3️⃣ Create Video using FFmpeg
    const outputPath = path.join(__dirname, `../public/output_${id}.mp4`);

   const command = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${fastAudioPath}" -i "${bgmPath}" -filter_complex "[2:a]volume=0.20[bgm];[1:a][bgm]amix=inputs=2:duration=shortest[a]" -map 0:v -map "[a]" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p -vf scale=1280:720 "${outputPath}"`;

    exec(command, (err, stdout, stderr) => {


  if (err) {
    console.error("❌ FFmpeg error:", err);
    return res.status(500).json({ error: "Video failed" });
  }

 res.json({
  videoUrl: `http://localhost:5000/output_${id}.mp4`
});
});

  } catch (err) {
    console.error("❌ Video error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});



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