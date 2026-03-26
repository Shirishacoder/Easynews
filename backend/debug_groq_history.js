const Groq = require("groq-sdk");
require("dotenv").config({ path: __dirname + "/.env" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function test() {
  try {
    console.log("Testing [system, assistant, user] sequence...");
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are an AI." },
        { role: "assistant", "content": "- point 1" },
        { role: "user", content: "Hi" }
      ]
    });
    console.log("Success:", response.choices[0]?.message?.content);
  } catch (err) {
    console.error("Groq Error details:", err.message);
  }
}
test();
