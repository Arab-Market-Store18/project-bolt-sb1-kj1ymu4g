// supabase/functions/create-embedding/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;
env.allowRemoteModels = true;

// استخدام نموذج 384 بعد
const generator = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const output = await generator(text, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = Array.from(output.data); // 384 بعد

    return new Response(JSON.stringify({ embedding }), {
      headers: corsHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});