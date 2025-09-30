import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_PATH = process.env.PYTHON_PATH || path.join(__dirname, '../python');

/**
 * Execute a Python script and return the result
 * @param {string} scriptName - Name of the Python script to run
 * @param {string} input - Input data to pass to the script
 * @returns {Promise<Object>} Parsed JSON result from Python script
 */
export async function runPythonScript(scriptName, input) {
  return new Promise((resolve, reject) => {
    // Validate script name to prevent path traversal
    const allowedScripts = ['email_parser.py', 'data_cleaner.py'];
    if (!allowedScripts.includes(scriptName)) {
      reject(new Error('Invalid script name'));
      return;
    }

    const scriptPath = path.join(PYTHON_PATH, scriptName);

    // Validate input size
    if (typeof input === 'string' && input.length > 100000) {
      reject(new Error('Input too large'));
      return;
    }

    // Use 'python' command (will work on both Unix and Windows)
    // Spawn with array args is safe from injection
    const pythonProcess = spawn('python', [scriptPath, input]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}\nstderr: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Parse email using Python script
 * @param {string} emailContent - Raw email content
 * @returns {Promise<Object>} Workflow result
 */
export async function parseEmail(emailContent) {
  return runPythonScript('email_parser.py', emailContent);
}

/**
 * Clean data using Python script
 * @param {Object} data - Data object to clean
 * @returns {Promise<Object>} Workflow result
 */
export async function cleanData(data) {
  const jsonInput = JSON.stringify(data);
  return runPythonScript('data_cleaner.py', jsonInput);
}
