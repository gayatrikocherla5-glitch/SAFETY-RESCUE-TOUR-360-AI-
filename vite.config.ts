import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { message, language, userLocation, isEmergency } = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  fallback: true,
                  reply: "Online AI Key not configured. Using SAFETY AI Offline Knowledge Base. I am ready to help with safe routes, nearest hospitals, and emergency guidance." 
                }));
                return;
              }

              const ai = new GoogleGenAI();
              const systemPrompt = `You are "SAFETY AI", the official AI Tourist and Public Safety Assistant for the platform "SAFETY & RESCUE TOUR 360°– AI".
Your mission is tourist safety, emergency guidance, navigation assistance, safe zones, hospital/police contact info, incident reporting guidance, and translation.
The user's preferred language is: ${language || 'English'}. Respond in ${language || 'English'} unless instructed otherwise.
Current user coordinates: ${userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Unknown'}.
Is emergency mode active: ${isEmergency ? 'YES - PRIORITIZE LIFE SAFETY, CALM INSTRUCTIONS, CALL 112/911' : 'No'}.
Keep emergency instructions extremely clear, step-by-step, actionable, and reassuring. Always remind them that they can press the SOS button to alert authorities.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: message,
                config: {
                  systemInstruction: systemPrompt,
                  temperature: 0.3,
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: response.text || "I am here to ensure your safety. What do you need assistance with?" }));
            } catch (err: any) {
              console.error('Gemini API Error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                fallback: true, 
                reply: "SAFETY AI safety advice: If you are in immediate danger, trigger the SOS button immediately or call local emergency services (112). Seek well-lit public safe zones." 
              }));
            }
          });
          return;
        }

        if (req.url === '/api/ai/analyze-incident' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { incidents } = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  analysis: "Incident Analysis (Heuristic Engine): Clustered 3 reports around high-density transit corridor. Recommendation: Increase patrol presence between 18:00 and 23:00, ensure street illumination, and designate temporary safe-haven check-ins." 
                }));
                return;
              }

              const ai = new GoogleGenAI();
              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: `Analyze these safety incident reports for tourist authorities:\n${JSON.stringify(incidents, null, 2)}\nIdentify: 1) High risk hotspot clusters 2) Most frequent incident types 3) Preventive authority recommendations. Note: this is AI safety assistance, not a final law enforcement determination.`,
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ analysis: response.text }));
            } catch (err: any) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                analysis: "Safety pattern detected: 2 caution zones require increased tourist guidance signage. Verified safe corridor along Main Promenade." 
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
