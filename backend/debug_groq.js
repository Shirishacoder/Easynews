const fetch = require('node-fetch'); // wait, native fetch is in node 18+. I will just use http or simply require axio or Groq SDK.

const Groq = require("groq-sdk");
require("dotenv").config({ path: __dirname + "/.env" });

console.log("API KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function test() {
  try {
    console.log("Sending summarize request...");
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Say hello!" }]
    });
    console.log("Success:", response.choices[0]?.message?.content);
  } catch (err) {
    console.error("Groq Error details:", {
      message: err.message,
      status: err.status,
      error: err.error
    });
  }
}
test();
