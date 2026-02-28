import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import 'dotenv/config';

const aj = arcjet({
  key: process.env.ARCJET_KEY, // Get your site key from https://app.arcjet.com
  rules: [
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", 
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
        mode: "LIVE",
        interval: 2, // 60 seconds
        max: 5, // Allow 10 requests per window    
    }),
],
});

export default aj;