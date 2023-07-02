#!/usr/bin/env node

import inquirer from 'inquirer';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copy } from 'fs-extra/esm';
import { readFile, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function updateFile(file, callback) {
    const content = await readFile(file, { encoding: 'utf8' });
    await writeFile(file, callback(content), { encoding: 'utf8' });
}

(async () => {
    try {
        const answers = await inquirer.prompt([{
            type: 'input',
            name: 'appName',
            message: "What's your application name:",
            default: "starter-app"
        },{
            type: 'list',
            name: 'variant',
            message: "Select variant:",
            choices: ['Typescript', 'Javascript'],
            filter(val) {
                return val.toLowerCase();
            }
        },{
            type: 'number',
            name: 'appPort',
            message: "Which port application to run:",
            default: 3000
        }]);
        const rootDirPath = process.cwd();
        await copy(join(__dirname, 'templates', answers.variant), join(rootDirPath, answers.appName));
        await copy(join(__dirname, 'server'), join(rootDirPath, answers.appName, 'server'));
        const isTypescript = answers.variant === 'typescript';

        updateFile(
            resolve(join(rootDirPath, answers.appName), `vite.config.${isTypescript ? 'ts' : 'js'}`),
            (content) => {
              return content.replace('___PORT___', answers.appPort);
            }
        );

        updateFile(
            resolve(join(rootDirPath, answers.appName), 'package.json'),
            (content) => {
              return content.replace('___APP_NAME___', `${answers.appName}`);
            }
        );

        updateFile(
            resolve(join(rootDirPath, answers.appName, 'server'), 'package.json'),
            (content) => {
              return content.replace('___APP_NAME___', `${answers.appName}`);
            }
        );

        console.log(`\nScaffolding project in ${join(rootDirPath, answers.appName)}\n\nSetup is completed. Now run below commands:\n\n cd ${answers.appName}\n npm install\n npm run dev\n\nApplication will run on http://localhost:${answers.appPort}/${answers.appName}`);

    } catch (error) {
        console.error("Failed to create new project.");
        console.log(error);
    }
})();