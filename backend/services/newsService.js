const axios = require("axios");

const API_KEY = "2b01fa73983e423588e6dfb73b3340d2";

const fetchNews = async () => {
  try {
    const url = `https://newsapi.org/v2/everything?q=india&sortBy=publishedAt&language=en&apiKey=${API_KEY}`;

    const response = await axios.get(url);

    if (response.data.status !== "ok") {
      console.error("❌ API ERROR:", response.data);
      return [];
    }

    console.log("✅ Articles fetched:", response.data.articles.length);

    return response.data.articles || [];

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return [];
  }
};

module.exports = fetchNews;