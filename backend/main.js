const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Subreddit Vibe Check API is running " });
});

// Proxy endpoint for Reddit hot posts
app.get("/api/reddit/:subreddit", async (req, res) => {
  const { subreddit } = req.params;
  const limit = req.query.limit || 50;

  // Basic validation
  if (!/^[a-zA-Z0-9_]+$/.test(subreddit)) {
    return res.status(400).json({ error: "Invalid subreddit name." });
  }

  try {
    const response = await axios.get(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          "User-Agent": "SubredditVibeCheck/1.0 (by /u/your_reddit_username)",
        },
      }
    );

    const posts = response.data.data.children.map((child) => ({
      id: child.data.id,
      title: child.data.title,
      score: child.data.score,
      numComments: child.data.num_comments,
      author: child.data.author,
      url: child.data.url,
      permalink: `https://reddit.com${child.data.permalink}`,
      thumbnail: child.data.thumbnail,
      created: child.data.created_utc,
      upvoteRatio: child.data.upvote_ratio,
    }));

    res.json({ subreddit, posts });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: `Subreddit r/${subreddit} not found.` });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ error: `r/${subreddit} is private or banned.` });
    }
    console.error("Reddit API error:", error.message);
    res.status(500).json({ error: "Failed to fetch data from Reddit." });
  }
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});