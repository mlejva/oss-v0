import OpenAI from 'openai';
import fs from 'fs';
import { spawn } from 'child_process';
import { functions } from './functions.js';
import readline from 'readline';
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
const app = express()

const model = 'gpt-4';
// const model = 'gpt-3.5-turbo-16k';
const wait = ms => new Promise(res => setTimeout(res, ms));


const systemPrompt = fs.readFileSync('./system_prompt.txt', 'utf8');
const history = [
  {
    role: 'system',
    content: systemPrompt
  },
  {
    role: 'user',
    content: 'Give me a set of 12 buttons. Use a different color for each button. Put them in a grid.',
  },
  {
    role: 'assistant',
    content: '{"code":"<div className=\"grid grid-cols-3 gap-4\">\n<Button className=\"bg-red-500\">Button 1</Button>\n<Button className=\"bg-yellow-500\">Button 2</Button>\n<Button className=\"bg-green-500\">Button 3</Button>\n<Button className=\"bg-blue-500\">Button 4</Button>\n<Button className=\"bg-purple-500\">Button 5</Button>\n<Button className=\"bg-pink-500\">Button 6</Button>\n<Button className=\"bg-gray-500\">Button 7</Button>\n<Button className=\"bg-red-600\">Button 8</Button>\n<Button className=\"bg-yellow-600\">Button 9</Button>\n<Button className=\"bg-green-600\">Button 10</Button>\n<Button className=\"bg-blue-600\">Button 11</Button>\n<Button className=\"bg-purple-600\">Button 12</Button>\n</div>"}',
    name: 'write_jsx',
  },
  {
    role: 'assistant',
    content: "{ \"component\": \"Button\" }",
    name: 'import_component',
  },
];
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
let errors = '';
let imports = new Set();

function componentCode({ importedComponents, code }) {
  let importsCode = '';

  importedComponents.forEach(component => {
    const exportedName = component.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    console.log('exportedName', exportedName);
    importsCode += `import { ${exportedName} } from '@/components/ui/${component}';\n`;
  })

  return `${importsCode}
  export default function Component() {
    return (
      ${code || '<div></div>'}
    );
  }
  `
}

async function run(userTask) {
  history.push(
    {
      role: 'user',
      content: userTask,
    },
  )

  let stream = await openai.chat.completions.create({
    model,
    messages: history,
    // stream: true,
    functions,
  });
  let choice = stream.choices[0];
  console.log('finish reason', choice.finish_reason);

  if (choice.finish_reason === 'stop') {
    console.log('GPT IS DONE')
  }

  while (choice.finish_reason !== 'stop') {
    console.log(choice)

    if (choice.finish_reason === 'function_call') {
      const functionName = choice.message.function_call.name;
      let functionsArgsStr = choice.message.function_call.arguments;
      console.log('=== JSON STRING ===')
      console.log(functionsArgsStr)
      console.log('=====')
      // Remove newlines
      functionsArgsStr = functionsArgsStr.trim().replace(/\n|\r/g, '');
      console.log('=== JSON STRING (no newlines)===')
      console.log(functionsArgsStr)
      console.log('=====')

      const functionArgs = JSON.parse(functionsArgsStr);

      switch (functionName) {
        case 'write_jsx':


          // console.log('WRITING JSX')

          // Go into the self-healing loop -> save the code -> get more context about errors
          const component = componentCode({ importedComponents: imports, code: functionArgs.code })
          // console.log('COMPONENT')
          // console.log(component)
          fs.writeFileSync('/Users/mlejva/Developer/oss-v0/e2b-playground/template/components/Component.jsx', component);
          console.log('Waiting after file write...')
          await wait(3_000)
          console.log('errors:\n', errors)

          break;
        case 'import_components':

          // `component_imports` is a string with space separated names of components
          // we need to convert it to an array and make sure there aren't any duplicatesj
          const componentImports = functionArgs.components.split(' ');
          componentImports.forEach(component => imports.add(component));

          break;
      }
      console.log(functionName);
      console.log(functionArgs);

      // Append to `history`
      history.push({
        role: 'assistant',
        name: functionName,
        content: functionsArgsStr,
      })
      if (errors) {
        console.log('HAVE ERRORS', errors)
        history.push({
          role: 'user',
          content: `I got a following error, please fix it for me:\n\`\`\`${errors}\`\`\``,
        })
      }

      if (errors || functionName === 'import_components') {
        console.log('Waiting for GPT...')
        errors = ''
        stream = await openai.chat.completions.create({
          model,
          messages: history,
          // stream: true,
          functions,
        });
        choice = stream.choices[0];
      } else {
        console.log('Waiting on user...')
        break;
      }
    } else {
      console.log('Non function finish reason', choice.finish_reason)
    }
  }

  // for await (const part of stream) {
  //   console.log('part');
  //   console.log(part.choices[0].delta);
  //   // process.stdout.write(part.choices[0]?.delta?.content || '');
  // }
}


const child = spawn('npm', ['run', 'dev'], {
  cwd: '/Users/mlejva/Developer/oss-v0/e2b-playground/template',
});
// child.stdout.on('data', (chunk) => {
//   console.log(chunk.toString());
// });
child.stderr.on('data', (chunk) => {
  const err = chunk.toString();
  if (err.startsWith('- error')) {
    errors += chunk.toString();
  }
});


function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

console.log('Loading...')
await wait(3000)

// setTimeout(async () => {
//   while (true) {
//     const task = await askQuestion('What do you want to build?\n> ')
//     await run(task)
//   }
// }, 3_000)

// We're going to call the `run` function on user input. Then we're going to get into the self-healing improving loop with max retries.



app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.post('/', async (req, res) => {
    const data = req.body;
    console.log('data\n', data)
    const task = data.task;
    await run(task);
    res.send('');
})

app.get('/', async (req, res) => {
  const code = fs.readFileSync('/Users/mlejva/Developer/oss-v0/e2b-playground/template/components/Component.jsx', 'utf8');

  rest.json({ code });
})


app.listen(3002, () => {
  console.log('Server listening on port 3002!')
})