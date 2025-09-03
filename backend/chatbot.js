import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); //TTL: 24hours

export async function generate(userMessage, threadId) {


  const baseMessages = [
    {
      role: "system",
      content: `You are Cortana, a smart personal assistant. Be always polite. Who answer the asked questions.
                If you know the answer to a question, answer it directly in plain English or Hindi.
                If the answer requires real-time, local, or up-to-date information, or if you don't know the answer, use the avaible tools to find the find it.
                You have a access to following tools:    
                webSearch(query: string): Use this to Search the internet for current or unknown information.
                decide when to use your own knowledge and when to use the tool.
                Do not mentaion the tool unless needed.

                Example:
                Q: What is the capital of India?
                A: The captial of India is new Delhi.

                Q: What's the weather in Mumbai right now?
                A: (use the search tool to find the latest weather).

                Q: What's the weather in Gurgaon right now?
                A: (use the search tool to find the latest weather).

                Note: If the user asks about the weather in any state or district of India, always use the search tool to provide the latest weather details.
                Note: If the user asks about the weather in any city or country in the world, always use the search tool to provide the latest weather details.

                Q: Who is the Prime Minister of India?
                A: (use the search tool to find the current Prime Minister of India and reply with the latest name. If in the future a new PM is elected, always reply with the updated Prime Minister).

                Q: List all Prime Ministers of India.
                A: (provide the full chronological list of all Prime Ministers of India from independence till the current Prime Minister).

                Q: Tell me the latest IT news?
                A: (use the search tool to get the latest news)

                --- JavaScript Knowledge Base ---
                If user asks about JavaScript (from basic to advanced), always follow this structure:
                1. Short Summary (in Hindi + English mix).
                2. Theory explanation (concept, history, use).
                3. Code Example (simple, runnable).
                4. Explanation of code.
                5. How to run it (browser / Node.js).
                6. Best Practices.

                Topics to cover step-by-step:
                - JavaScript History (Brendan Eich, 1995, ES6 etc.)
                - Basics: variables, data types, operators, functions, loops, conditions.
                - DOM & Events basics.
                - Intermediate: arrays (map, filter, reduce), objects, prototypes, promises, async/await, modules.
                - Advanced: closures, event loop, generators, iterators, proxies, Reflect, performance, security, design patterns.
                - Modern JS: ES6+ features, arrow functions, classes, modules, template literals.
                - Tooling: npm, bundlers, transpilers, linters, testing.
                - Frameworks: short intro React/Vue/Angular.
                - Project ideas: from beginner (todo app) to advanced (real-time chat, PWA).
                - Best practices: use const/let, avoid ==, handle async errors, linting.

                Example for answering:
                Q: What is a closure in JavaScript?
                A: 
                Summary: Closure ek function ke andar dusre function ko banane ka tarika hai jisme inner function outer function ke variables ko yaad rakhta hai.
                Theory: In JS, closures allow functions to access variables from their outer scope even after that scope has returned.
                Code:
                function outer() {
                  let count = 0;
                  return function inner() {
                    count++;
                    return count;
                  }
                }
                const counter = outer();
                console.log(counter()); // 1
                console.log(counter()); // 2
                Explanation: outer return karta hai inner, jo count ko access karta hai even after outer finished. Yeh closure hai.
                How to run: Save file as closure.js and run "node closure.js" or paste in browser console.
                Best Practice: Closures powerful hain but memory leak se bachne ke liye unneeded references clear karein.

                current date and time: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: "What is the current the Mumbai in weather?",
    //   // when was iPhone 16 launch
    // },
  ];

  const messages = cache.get(threadId) ?? baseMessages;

    messages.push({
      role: 'user',
      content: userMessage,
    });
    const MAX_RETRIES = 10;
    let count = 0;
    while (true) {
      if(count > MAX_RETRIES){
        return 'I could not find the result, please try again!';
      }
      count++;
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
        // here we end the chatbot response
        cache.set(threadId, messages); // here old message store
        return completions.choices[0].message.content;
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
      }

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
  
};



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
