import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completions = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          `You are Cortana, a smart personal assistant. Be always polite. Who answer the asked questions.
          You have a access to following tools:
          1. searchWeb({query}: { query: string }) // Search the latest information and realtime data on the internet.
          `,
      },
      {
        role: "user",
        content: "when was iPhone 16 launch",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the latest information and realtime data on the internet.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to perform search on.",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: 'auto',
  });

  const toolCalls = completions.choices[0].message.tool_calls;
  if(!toolCalls){
    console.log(`Assistant: ${completions.choices[0].message.content}`);
    return;
  }

  for(const tool of toolCalls){
    console.log('tool', tool);
    const functionName = tool.function.name;
    const functionParams = tool.function.arguments;

    if(functionName === 'webSearch'){
        const toolResult = await webSearch(JSON.parse(functionParams));
        console.log('Tool :', toolResult);
    }
  }
//   console.log(JSON.stringify(completions.choices[0].message.content), null, 2);
}

main();

// tool_calling
async function webSearch({ query }) {
    console.log('Calling web search...');
    return 'iPhone was launched on 20 september 2024.'
}
