Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided for valuation." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // Build a detailed prompt for Gemini
    const itemsDescription = items.map((item: { name: string; quantity: number }) =>
      `${item.quantity}x ${item.name}`
    ).join(", ");

    const prompt = `You are an expert eco-valuation assistant for a Pakistani recycling app called Sughar. 
A user wants to recycle the following items: ${itemsDescription}.

Provide a JSON response with these exact fields:
{
  "total_value_pkr": <number - estimated total resale/recycling value in Pakistani Rupees>,
  "co2_saved_kg": <number - estimated CO2 emissions saved in kg if these items are recycled instead of dumped>,
  "water_saved_liters": <number - estimated water saved in liters through recycling>,
  "energy_saved_kwh": <number - estimated energy saved in kWh>,
  "trees_equivalent": <number - equivalent trees saved>,
  "landfill_diverted_kg": <number - estimated kg of waste diverted from landfill>,
  "eco_summary": "<2-3 sentence encouraging summary in English about the environmental impact>",
  "valuation_breakdown": [
    {"item": "<item name>", "value_pkr": <number>, "note": "<brief note about recyclability>"}
  ],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Base valuations on realistic Pakistani scrap/recycling market rates:
- Old Clothes: ~20-50 PKR per kg
- Books: ~30-80 PKR per kg
- Furniture: ~500-5000 PKR per piece depending on condition
- E-Waste: ~100-2000 PKR per item depending on type

Respond ONLY with valid JSON, no markdown or extra text.`;

    let aiData;

    if (GEMINI_API_KEY) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errText}`);
      }

      const geminiResult = await geminiResponse.json();
      const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    } else {
      // Fallback: compute estimates locally if no Gemini key
      aiData = computeLocalEstimate(items);
    }

    return new Response(
      JSON.stringify(aiData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to process eco valuation",
        ...computeLocalEstimate(
          (() => {
            try { return (req as any)._items || []; } catch { return []; }
          })()
        ),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ValuationItem {
  name: string;
  quantity: number;
}

function computeLocalEstimate(items: ValuationItem[]) {
  const rates: Record<string, { valuePerUnit: number; co2PerUnit: number; waterPerUnit: number; energyPerUnit: number }> = {
    "Old Clothes": { valuePerUnit: 35, co2PerUnit: 3.6, waterPerUnit: 2000, energyPerUnit: 1.2 },
    "Books": { valuePerUnit: 50, co2PerUnit: 1.2, waterPerUnit: 30, energyPerUnit: 0.8 },
    "Furniture": { valuePerUnit: 2000, co2PerUnit: 8.0, waterPerUnit: 500, energyPerUnit: 3.0 },
    "E-Waste": { valuePerUnit: 600, co2PerUnit: 5.0, waterPerUnit: 100, energyPerUnit: 2.5 },
  };

  let totalValue = 0;
  let co2Saved = 0;
  let waterSaved = 0;
  let energySaved = 0;
  let landfillDiverted = 0;
  const breakdown: Array<{ item: string; value_pkr: number; note: string }> = [];

  for (const item of items) {
    const rate = rates[item.name] || { valuePerUnit: 100, co2PerUnit: 2.0, waterPerUnit: 100, energyPerUnit: 1.0 };
    const value = rate.valuePerUnit * item.quantity;
    totalValue += value;
    co2Saved += rate.co2PerUnit * item.quantity;
    waterSaved += rate.waterPerUnit * item.quantity;
    energySaved += rate.energyPerUnit * item.quantity;
    landfillDiverted += item.quantity * 2.5;

    breakdown.push({
      item: item.name,
      value_pkr: Math.round(value),
      note: getRecyclabilityNote(item.name),
    });
  }

  const treesEquivalent = Math.round(co2Saved / 21);

  return {
    total_value_pkr: Math.round(totalValue),
    co2_saved_kg: Math.round(co2Saved * 10) / 10,
    water_saved_liters: Math.round(waterSaved),
    energy_saved_kwh: Math.round(energySaved * 10) / 10,
    trees_equivalent: treesEquivalent,
    landfill_diverted_kg: Math.round(landfillDiverted * 10) / 10,
    eco_summary: `By recycling ${items.length} categor${items.length === 1 ? "y" : "ies"} of items, you could save approximately ${Math.round(co2Saved * 10) / 10} kg of CO2 emissions and divert ${Math.round(landfillDiverted * 10) / 10} kg of waste from landfills. Your estimated recycling value is ${Math.round(totalValue)} PKR. Thank you for contributing to a greener Pakistan!`,
    valuation_breakdown: breakdown,
    recommendations: [
      "Sort items by material type before pickup for faster processing.",
      "Remove personal data from electronic devices before recycling.",
      "Consider donating usable clothes to local charities for additional social impact.",
    ],
  };
}

function getRecyclabilityNote(name: string): string {
  const notes: Record<string, string> = {
    "Old Clothes": "Can be repurposed as industrial rags or donated if in good condition.",
    "Books": "Highly recyclable — paper fibers can be reused 5-7 times.",
    "Furniture": "Wood and metal components are recoverable; good condition items can be resold.",
    "E-Waste": "Contains valuable metals like copper and gold; requires specialized processing.",
  };
  return notes[name] || "Recyclable with proper sorting and processing.";
}
