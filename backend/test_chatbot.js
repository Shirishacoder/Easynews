
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
async function main() {
  try {
    const prompt = `
Summarize this news article strictly based on given information.

Return 3 short bullet points.

Title: This is a testing title
Description: Testing description
Content: Testing content
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });
    console.log("Success! Summary:", response.choices[0]?.message?.content);
  } catch (err) {
    console.error("Groq Error:", err.message);
  }
}

main();
