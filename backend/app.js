import readline from 'node:readline/promises';
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });


  const messages = [
    {
      role: "system",
      content: `You are Cortana, a smart personal assistant. Be always polite. Who answer the asked questions.
          You have a access to following tools:
          1. searchWeb({query}: { query: string }) // Search the latest information and realtime data on the internet.
          current date and time: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: "What is the current the Mumbai in weather?",
    //   // when was iPhone 16 launch
    // },
  ];

  while (true) {
    const question = await rl.question('You: ');

    if(question === 'bye'){
      break;
    }
    messages.push({
      role: 'user',
      content: question,
    });

    while (true) {
      const completions = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search the latest information and realtime data on the internet.",
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
        tool_choice: "auto",
      });

      messages.push(completions.choices[0].message);

      const toolCalls = completions.choices[0].message.tool_calls;
      if (!toolCalls) {
        console.log(`Assistant: ${completions.choices[0].message.content}`);
        break;
      }

      for (const tool of toolCalls) {
        console.log("tool", tool);
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionParams));
          // console.log('Tool :', toolResult);

          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      };

      // second tool call
      // const completions2 = await groq.chat.completions.create({
      //   model: "llama-3.3-70b-versatile",
      //   temperature: 0,
      //   messages: messages,
      //   tools: [
      //     {
      //       type: "function",
      //       function: {
      //         name: "webSearch",
      //         description: "Search the latest information and realtime data on the internet.",
      //         parameters: {
      //           type: "object",
      //           properties: {
      //             query: {
      //               type: "string",
      //               description: "The search query to perform search on.",
      //             },
      //           },
      //           required: ["query"],
      //         },
      //       },
      //     },
      //   ],
      //   tool_choice: 'auto',
      // });
      // console.log(JSON.stringify(completions2.choices[0].message.content, null, 2));
    }
  }
  rl.close();
}

main();

// tool_calling
async function webSearch({ query }) {
  console.log("Calling web search...");
  const response = await tvly.search(query);
  // console.log('Response: ', response);

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  return finalResult;
};
